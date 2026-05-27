'use client'

import { useState, useEffect, createContext, useContext, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'
import type { Document, TabType } from '@/types'
import { Sidebar } from '@/components/features/Sidebar'
import { UploadPanel } from '@/components/features/UploadPanel'
import { SummaryPanel } from '@/components/features/SummaryPanel'
import { FlashcardsPanel } from '@/components/features/FlashcardsPanel'
import { QuizPanel } from '@/components/features/QuizPanel'
import { ExplainPanel } from '@/components/features/ExplainPanel'
import { ChatPanel } from '@/components/features/ChatPanel'

interface AppContextType {
  user: User | null
  documents: Document[]
  activeDoc: Document | null
  setActiveDoc: (doc: Document | null) => void
  activeTab: TabType
  setActiveTab: (tab: TabType) => void
  refreshDocuments: () => Promise<void>
}

export const AppContext = createContext<AppContextType>({
  user: null,
  documents: [],
  activeDoc: null,
  setActiveDoc: () => {},
  activeTab: 'upload',
  setActiveTab: () => {},
  refreshDocuments: async () => {},
})

export function useApp() {
  return useContext(AppContext)
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<User | null>(null)
  const [documents, setDocuments] = useState<Document[]>([])
  const [activeDoc, setActiveDoc] = useState<Document | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>('upload')
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const refreshDocuments = useCallback(async () => {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const { data } = await supabase
      .from('documents')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })

    if (data) setDocuments(data as Document[])
  }, [])

  useEffect(() => {
    const init = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        router.push('/login')
        return
      }

      setUser(session.user)
      await refreshDocuments()
      setLoading(false)
    }
    init()
  }, [router, refreshDocuments])

  if (loading) {
    return (
      <div className="grid-bg min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-t-transparent border-[#00FF88] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#9090D0]">Loading your workspace...</p>
        </div>
      </div>
    )
  }

  const renderPanel = () => {
    switch (activeTab) {
      case 'upload': return <UploadPanel />
      case 'summary': return <SummaryPanel />
      case 'flashcards': return <FlashcardsPanel />
      case 'quiz': return <QuizPanel />
      case 'explain': return <ExplainPanel />
      case 'chat': return <ChatPanel />
      default: return <UploadPanel />
    }
  }

  return (
    <AppContext.Provider value={{
      user,
      documents,
      activeDoc,
      setActiveDoc: (doc) => {
        setActiveDoc(doc)
        if (doc) setActiveTab('summary')
      },
      activeTab,
      setActiveTab,
      refreshDocuments,
    }}>
      <div className="grid-bg min-h-screen flex">
        <Sidebar />
        <main className="flex-1 overflow-y-auto min-h-screen">
          <div className="p-6 max-w-5xl mx-auto">
            {renderPanel()}
          </div>
        </main>
      </div>
    </AppContext.Provider>
  )
}
