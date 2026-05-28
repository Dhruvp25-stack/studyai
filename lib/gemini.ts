// FILE LOCATION: lib/gemini.ts
// Uses Groq (free, fast) instead of Gemini.
// Get a free key at https://console.groq.com

const GROQ_API_KEY = process.env.GROQ_API_KEY

interface GroqResponse {
  choices: Array<{
    message: { content: string }
  }>
}

async function callGroq(prompt: string, systemInstruction?: string): Promise<string> {
  if (!GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not configured. Add it in Vercel → Settings → Environment Variables.')
  }

  const messages: Array<{ role: string; content: string }> = []

  if (systemInstruction) {
    messages.push({ role: 'system', content: systemInstruction })
  }

  messages.push({ role: 'user', content: prompt })

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages,
      temperature: 0.7,
      max_tokens: 4096,
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Groq API error: ${err}`)
  }

  const data: GroqResponse = await response.json()
  return data.choices?.[0]?.message?.content ?? ''
}

export async function generateSummary(content: string): Promise<string> {
  const truncated = content.slice(0, 12000)
  return callGroq(
    `Summarize this document clearly and comprehensively. Use markdown formatting with headers, bullet points, and bold for key terms. Highlight the most important concepts.\n\nDocument:\n${truncated}`,
    'You are an expert academic summarizer. Create well-structured, insightful summaries that capture essential information.'
  )
}

export async function generateFlashcards(content: string): Promise<Array<{ front: string; back: string }>> {
  const truncated = content.slice(0, 10000)
  const response = await callGroq(
    `Generate exactly 10 high-quality flashcards from this document. Return ONLY valid JSON array, no other text.
Format: [{"front": "question or term", "back": "answer or definition"}]

Document:
${truncated}`,
    'You are an expert educator who creates effective study flashcards. Return only valid JSON, no markdown, no explanation.'
  )

  try {
    const clean = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    return JSON.parse(clean)
  } catch {
    const match = response.match(/\[[\s\S]*\]/)
    if (match) return JSON.parse(match[0])
    throw new Error('Failed to parse flashcards response')
  }
}

export interface QuizQuestion {
  question: string
  options: string[]
  correct_answer: number
  explanation: string
}

export async function generateQuiz(content: string): Promise<QuizQuestion[]> {
  const truncated = content.slice(0, 10000)
  const response = await callGroq(
    `Generate exactly 8 multiple-choice quiz questions from this document. Return ONLY valid JSON array, no other text.
Format: [{"question": "...", "options": ["A", "B", "C", "D"], "correct_answer": 0, "explanation": "..."}]
correct_answer is the index (0-3) of the correct option.

Document:
${truncated}`,
    'You are an expert quiz designer. Create challenging but fair questions. Return only valid JSON, no markdown, no explanation.'
  )

  try {
    const clean = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    return JSON.parse(clean)
  } catch {
    const match = response.match(/\[[\s\S]*\]/)
    if (match) return JSON.parse(match[0])
    throw new Error('Failed to parse quiz response')
  }
}

export async function explainSimple(content: string, topic?: string): Promise<string> {
  const truncated = content.slice(0, 8000)
  const focusPart = topic ? `Focus specifically on explaining: "${topic}"` : 'Explain the main concepts'
  return callGroq(
    `${focusPart} from this document as if explaining to a 12-year-old. Use simple words, fun analogies, real-world examples, and avoid jargon. Make it engaging and easy to understand!\n\nDocument:\n${truncated}`,
    'You are a brilliant teacher who makes complex topics simple and fun. Use analogies, stories, and everyday examples.'
  )
}

export async function chatWithDocument(
  content: string,
  messages: Array<{ role: string; content: string }>,
  userMessage: string
): Promise<string> {
  const truncated = content.slice(0, 8000)
  const history = messages.slice(-10).map(m => `${m.role === 'user' ? 'Student' : 'Tutor'}: ${m.content}`).join('\n')

  return callGroq(
    `You are a helpful AI tutor. The student is asking about the following document.

DOCUMENT CONTENT:
${truncated}

CONVERSATION HISTORY:
${history}

Student: ${userMessage}

Respond as a knowledgeable, encouraging tutor. Be concise but thorough. Use markdown for formatting when helpful.`,
    'You are an expert AI tutor. Help students understand their study material. Be encouraging, clear, and educational.'
  )
}
