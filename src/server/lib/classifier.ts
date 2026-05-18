export type LeadClassificationResult = {
  classification: 'high_value' | 'low_value' | 'invalid' | 'unqualified'
  reason: string
  score: number
  extractedName?: string | null
}

export async function classifyLead(
  lead: {
    name?: string | null
    email?: string | null
    phone?: string | null
    message?: string | null
    jobType?: string | null
    location?: string | null
    budget?: string | null
    timeline?: string | null
  },
  tenantContext: { name: string; industry?: string | null }
): Promise<LeadClassificationResult> {
  const leadSummary = [
    lead.name && `Name: ${lead.name}`,
    lead.email && `Email: ${lead.email}`,
    lead.phone && `Phone: ${lead.phone}`,
    lead.jobType && `Job type: ${lead.jobType}`,
    lead.location && `Location: ${lead.location}`,
    lead.budget && `Budget: ${lead.budget}`,
    lead.timeline && `Timeline: ${lead.timeline}`,
    lead.message && `Additional notes: ${lead.message}`,
  ]
    .filter(Boolean)
    .join('\n')

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a lead qualification expert for "${tenantContext.name}"${tenantContext.industry ? `, a business in the ${tenantContext.industry} industry` : ''}. Classify incoming leads accurately.

Classifications:
- high_value: Clear buying intent, specific job/project described, legitimate contact details, realistic scope
- low_value: Vague inquiry, just browsing, no specific need, unclear timeline
- invalid: Spam, test submission, fake/nonsensical contact info, clearly not a real lead
- unqualified: Real person but wrong service, out of scope, competitor, or recruiting

Also extract the person's name from the message if they mentioned it and no name was already provided.

Return ONLY valid JSON: {"classification":"high_value|low_value|invalid|unqualified","reason":"one sentence explanation","score":1-10,"extractedName":"First Last or null"}
Score reflects lead quality (10 = excellent, 1 = worthless).`,
        },
        {
          role: 'user',
          content: `Classify this lead:\n${leadSummary || '(no details provided)'}`,
        },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 150,
    }),
  })

  if (!res.ok) {
    return { classification: 'pending' as any, reason: 'Classification failed', score: 0 }
  }

  const data = await res.json() as { choices: { message: { content: string } }[] }
  const parsed = JSON.parse(data.choices[0]?.message?.content ?? '{}') as Partial<LeadClassificationResult> & { extractedName?: string | null }

  return {
    classification: parsed.classification ?? 'low_value',
    reason: parsed.reason ?? '',
    score: parsed.score ?? 5,
    extractedName: parsed.extractedName ?? null,
  }
}
