export async function transcribeRecording(recordingUrl: string): Promise<string> {
  const sid = process.env.TWILIO_ACCOUNT_SID!
  const token = process.env.TWILIO_AUTH_TOKEN!

  const audio = await fetch(recordingUrl + '.mp3', {
    headers: { Authorization: 'Basic ' + Buffer.from(`${sid}:${token}`).toString('base64') },
  })
  if (!audio.ok) return ''

  const audioBuffer = await audio.arrayBuffer()
  const form = new FormData()
  form.append('file', new Blob([audioBuffer], { type: 'audio/mpeg' }), 'recording.mp3')
  form.append('model', 'whisper-1')

  const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    body: form,
  })
  if (!res.ok) return ''

  const data = await res.json() as { text?: string }
  return data.text ?? ''
}
