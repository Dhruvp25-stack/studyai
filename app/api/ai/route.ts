import { NextRequest, NextResponse } from 'next/server'
import {
  generateSummary,
  generateFlashcards,
  generateQuiz,
  explainSimple,
  chatWithDocument,
} from '@/lib/gemini'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, content, messages, userMessage, topic } = body

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    switch (action) {
      case 'summarize': {
        const summary = await generateSummary(content)
        return NextResponse.json({ result: summary })
      }

      case 'flashcards': {
        const flashcards = await generateFlashcards(content)
        return NextResponse.json({ result: flashcards })
      }

      case 'quiz': {
        const quiz = await generateQuiz(content)
        return NextResponse.json({ result: quiz })
      }

      case 'explain': {
        const explanation = await explainSimple(content, topic)
        return NextResponse.json({ result: explanation })
      }

      case 'chat': {
        if (!userMessage) {
          return NextResponse.json({ error: 'Message required' }, { status: 400 })
        }
        const reply = await chatWithDocument(content, messages || [], userMessage)
        return NextResponse.json({ result: reply })
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error: unknown) {
    console.error('AI API error:', error)
    const message = error instanceof Error ? error.message : 'AI processing failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
