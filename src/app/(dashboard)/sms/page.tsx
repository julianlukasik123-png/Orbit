'use client'

import { useState } from 'react'
import { trpc } from '@/lib/trpc'
import { Loader2, MessageSquare, Send } from 'lucide-react'
import { ClassificationBadge, type Classification } from '@/components/dashboard/ClassificationBadge'
import { cn } from '@/lib/utils'

function timeAgo(date: Date | string): string {
  const diff = Date.now() - new Date(date).getTime()
  const s = Math.floor(diff / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

export default function SmsPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [reply, setReply] = useState('')

  const { data: threads, isLoading: threadsLoading, refetch: refetchThreads } =
    trpc.sms.listThreads.useQuery(undefined, { refetchInterval: 5000 })

  const { data: thread, refetch: refetchThread } =
    trpc.sms.getThread.useQuery(
      { threadId: selectedId! },
      { enabled: !!selectedId, refetchInterval: 3000 }
    )

  const sendReply = trpc.sms.sendReply.useMutation({
    onSuccess: () => {
      setReply('')
      refetchThread()
      refetchThreads()
    },
  })

  function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedId || !reply.trim()) return
    sendReply.mutate({ threadId: selectedId, body: reply.trim() })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">SMS Inbox</h1>
        <p className="text-gray-700 mt-1">Inbound SMS leads and two-way conversations.</p>
      </div>

      <div className="flex h-[calc(100vh-200px)] bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        {/* Thread list */}
        <div className="w-72 shrink-0 border-r border-gray-200 overflow-y-auto">
          {threadsLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={20} className="animate-spin text-gray-400" />
            </div>
          ) : !threads?.length ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center gap-2">
              <MessageSquare size={32} className="text-gray-300" />
              <p className="text-sm text-gray-600">No SMS threads yet.</p>
              <p className="text-xs text-gray-500">Inbound texts will appear here.</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {threads.map((t) => {
                const lastMsg = t.messages[0]
                return (
                  <li key={t.id}>
                    <button
                      onClick={() => setSelectedId(t.id)}
                      className={cn(
                        'w-full text-left px-4 py-3.5 hover:bg-gray-50 transition-colors',
                        selectedId === t.id && 'bg-gray-50'
                      )}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold text-gray-900 truncate">
                          {t.lead?.name ?? t.fromPhone}
                        </span>
                        {lastMsg && (
                          <span className="text-xs text-gray-500 shrink-0 ml-2">
                            {timeAgo(lastMsg.createdAt)}
                          </span>
                        )}
                      </div>
                      {t.lead?.classification && (
                        <div className="mb-1">
                          <ClassificationBadge c={t.lead.classification as Classification} />
                        </div>
                      )}
                      {lastMsg && (
                        <p className="text-xs text-gray-600 truncate">{lastMsg.body}</p>
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {/* Thread view */}
        <div className="flex-1 flex flex-col min-w-0">
          {!selectedId ? (
            <div className="flex-1 flex items-center justify-center text-center px-8">
              <div>
                <MessageSquare size={40} className="text-gray-200 mx-auto mb-3" />
                <p className="text-sm text-gray-500">Select a conversation to view messages</p>
              </div>
            </div>
          ) : !thread ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 size={20} className="animate-spin text-gray-400" />
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="flex items-center gap-3 px-5 py-3.5 border-b border-gray-200 shrink-0">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-semibold text-gray-600 shrink-0">
                  {(thread.lead?.name ?? thread.fromPhone)[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {thread.lead?.name ?? thread.fromPhone}
                  </p>
                  <p className="text-xs text-gray-500">{thread.fromPhone}</p>
                </div>
                {thread.lead?.classification && (
                  <div className="ml-auto">
                    <ClassificationBadge c={thread.lead.classification as Classification} />
                  </div>
                )}
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                {thread.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      'flex',
                      msg.direction === 'outbound' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    <div
                      className={cn(
                        'max-w-[75%] px-4 py-2.5 rounded-2xl text-sm',
                        msg.direction === 'outbound'
                          ? 'text-white rounded-br-sm'
                          : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                      )}
                      style={msg.direction === 'outbound' ? { backgroundColor: 'var(--brand-primary)' } : {}}
                    >
                      <p>{msg.body}</p>
                      <p className={cn(
                        'text-xs mt-1',
                        msg.direction === 'outbound' ? 'text-white/70' : 'text-gray-400'
                      )}>
                        {timeAgo(msg.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Reply box */}
              <form
                onSubmit={handleSend}
                className="flex items-end gap-3 px-5 py-4 border-t border-gray-200 shrink-0"
              >
                <textarea
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSend(e as unknown as React.FormEvent)
                    }
                  }}
                  rows={2}
                  placeholder="Type a reply… (Enter to send)"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:border-transparent resize-none"
                />
                <button
                  type="submit"
                  disabled={sendReply.isPending || !reply.trim()}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
                  style={{ backgroundColor: 'var(--brand-primary)' }}
                >
                  {sendReply.isPending
                    ? <Loader2 size={16} className="animate-spin" />
                    : <Send size={16} />
                  }
                  Send
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
