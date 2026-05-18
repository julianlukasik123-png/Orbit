import { Activity } from 'lucide-react'

export default function ActivityPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Activity</h1>
        <p className="text-gray-700 mt-1">Real-time feed of everything happening in your account.</p>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm flex flex-col items-center justify-center text-center gap-3">
        <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center">
          <Activity size={24} className="text-indigo-600" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900">Activity feed coming in Phase 4</h2>
        <p className="text-sm text-gray-700 max-w-sm">
          Every lead created, email sent, email opened, and sequence step completed will appear
          here as a real-time activity stream.
        </p>
      </div>
    </div>
  )
}
