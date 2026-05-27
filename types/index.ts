export interface Document {
  id: string
  user_id: string
  title: string
  content: string
  summary: string | null
  created_at: string
  updated_at: string
  file_name: string
  file_size: number
}

export interface Flashcard {
  id: string
  document_id: string
  user_id: string
  front: string
  back: string
  created_at: string
}

export interface QuizQuestion {
  id: string
  document_id: string
  user_id: string
  question: string
  options: string[]
  correct_answer: number
  explanation: string
  created_at: string
}

export interface ChatMessage {
  id: string
  document_id: string
  user_id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export type TabType = 'upload' | 'summary' | 'flashcards' | 'quiz' | 'explain' | 'chat'
