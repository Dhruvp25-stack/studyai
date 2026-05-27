import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export type Database = {
  public: {
    Tables: {
      documents: {
        Row: {
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
        Insert: Omit<Database['public']['Tables']['documents']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['documents']['Insert']>
      }
      flashcards: {
        Row: {
          id: string
          document_id: string
          user_id: string
          front: string
          back: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['flashcards']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['flashcards']['Insert']>
      }
      quiz_questions: {
        Row: {
          id: string
          document_id: string
          user_id: string
          question: string
          options: string[]
          correct_answer: number
          explanation: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['quiz_questions']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['quiz_questions']['Insert']>
      }
      chat_messages: {
        Row: {
          id: string
          document_id: string
          user_id: string
          role: 'user' | 'assistant'
          content: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['chat_messages']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['chat_messages']['Insert']>
      }
    }
  }
}
