// FILE LOCATION: app/api/ai/route.ts
// Handles all AI actions: summarize, flashcards, quiz, explain, chat.
// Called by SummaryPanel, FlashcardsPanel, QuizPanel, ExplainPanel, ChatPanel.

import { NextRequest, NextResponse } from 'next/server'
import {
  generateSummary,
  generateFlashcards,
  generateQuiz,
  explainSimple,
  chatWithDocument,
} from '@/lib/gemini'

export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, content, topic, messages, userMessage } = body

    if (!action) {
      return NextResponse.json({ error: 'Missing action' }, { status: 400 })
    }

    if (!content) {
      return NextResponse.json({ error: 'Missing document content' }, { status: 400 })
    }

    switch (action) {
      case 'summarize': {
        const result = await generateSummary(content)
        return NextResponse.json({ result })
      }

      case 'flashcards': {
        const result = await generateFlashcards(content)
        return NextResponse.json({ result })
      }

      case 'quiz': {
        const result = await generateQuiz(content)
        return NextResponse.json({ result })
      }

      case 'explain': {
        const result = await explainSimple(content, topic)
        return NextResponse.json({ result })
      }

      case 'chat': {
        if (!userMessage) {
          return NextResponse.json({ error: 'Missing userMessage' }, { status: 400 })
        }
        const result = await chatWithDocument(content, messages ?? [], userMessage)
        return NextResponse.json({ result })
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error: unknown) {
    console.error('AI route error:', error)
    const message = error instanceof Error ? error.message : 'AI request failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
