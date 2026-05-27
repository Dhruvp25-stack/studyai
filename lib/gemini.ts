const GEMINI_API_KEY = process.env.GEMINI_API_KEY

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{ text: string }>
    }
  }>
}

async function callGemini(prompt: string, systemInstruction?: string): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured')
  }

  const body: Record<string, unknown> = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 4096,
    },
  }

  if (systemInstruction) {
    body.systemInstruction = { parts: [{ text: systemInstruction }] }
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
  )

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Gemini API error: ${err}`)
  }

  const data: GeminiResponse = await response.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
}

export async function generateSummary(content: string): Promise<string> {
  const truncated = content.slice(0, 12000)
  return callGemini(
    `Summarize this document clearly and comprehensively. Use markdown formatting with headers, bullet points, and bold for key terms. Highlight the most important concepts.\n\nDocument:\n${truncated}`,
    'You are an expert academic summarizer. Create well-structured, insightful summaries that capture essential information.'
  )
}

export async function generateFlashcards(content: string): Promise<Array<{ front: string; back: string }>> {
  const truncated = content.slice(0, 10000)
  const response = await callGemini(
    `Generate exactly 10 high-quality flashcards from this document. Return ONLY valid JSON array, no other text.
Format: [{"front": "question or term", "back": "answer or definition"}]

Document:
${truncated}`,
    'You are an expert educator who creates effective study flashcards. Return only valid JSON.'
  )

  try {
    const clean = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    return JSON.parse(clean)
  } catch {
    // Extract JSON if wrapped in text
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
  const response = await callGemini(
    `Generate exactly 8 multiple-choice quiz questions from this document. Return ONLY valid JSON array, no other text.
Format: [{"question": "...", "options": ["A", "B", "C", "D"], "correct_answer": 0, "explanation": "..."}]
correct_answer is the index (0-3) of the correct option.

Document:
${truncated}`,
    'You are an expert quiz designer. Create challenging but fair questions. Return only valid JSON.'
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
  return callGemini(
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

  return callGemini(
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
