'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useApp } from '@/app/(dashboard)/dashboard/layout'
import type { TabType } from '@/types'
import {
  Brain, Upload, FileText, Layers, HelpCircle,
  Lightbulb, MessageCircle, LogOut, ChevronLeft,
  ChevronRight, Trash2, Plus, File
} from 'lucide-react'

const NAV_ITEMS: { id: TabType; label: string; icon: typeof Upload; color: string }[] = [
  { id: 'upload', label: 'Upload PDF', icon: Upload, color: '#00FF88' },
  { id: 'summary', label: 'AI Summary', icon: FileText, color: '#0088FF' },
  { id: 'flashcards', label: 'Flashcards', icon: Layers, color: '#FFEE00' },
  { id: 'quiz', label: 'Quiz Mode', icon: HelpCircle, color: '#FF0088' },
  { id: 'explain', label: 'Explain Simple', icon: Lightbulb, color: '#FF8800' },
  { id: 'chat', label: 'AI Tutor Chat', icon: MessageCircle, color: '#8800FF' },
]

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const { user, documents, activeDoc, setActiveDoc, activeTab, setActiveTab, refreshDocuments } = useApp()
  const router = useRouter()

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const handleDeleteDoc = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Delete this document?')) return
    const supabase = createClient()
    await supabase.from('documents').delete().eq('id', id)
    if (activeDoc?.id === id) setActiveDoc(null)
    await refreshDocuments()
  }

  return (
    <aside
      className="relative flex flex-col border-r border-[#252540] bg-[#0F0F1A] transition-all duration-300 ease-in-out"
      style={{ width: collapsed ? '64px' : '260px', minWidth: collapsed ? '64px' : '260px' }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-[#252540]">
        <div className="w-8 h-8 rounded-lg bg-[#00FF88] flex items-center justify-center flex-shrink-0">
          <Brain size={16} className="text-[#0A0A0F]" />
        </div>
        {!collapsed && (
          <span className="font-display font-bold text-white text-base">StudyAI</span>
        )}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-16 z-10 w-6 h-6 rounded-full bg-[#252540] border border-[#353570] flex items-center justify-center hover:bg-[#353570] transition-colors"
      >
        {collapsed ? <ChevronRight size={12} className="text-[#9090D0]" /> : <ChevronLeft size={12} className="text-[#9090D0]" />}
      </button>

      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {/* Navigation */}
        {NAV_ITEMS.map(({ id, label, icon: Icon, color }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            disabled={id !== 'upload' && !activeDoc}
            className={`nav-item w-full ${activeTab === id ? 'active' : ''} ${id !== 'upload' && !activeDoc ? 'opacity-40 cursor-not-allowed' : ''}`}
            title={collapsed ? label : undefined}
          >
            <Icon size={16} style={{ color: activeTab === id ? color : undefined }} className="flex-shrink-0" />
            {!collapsed && <span>{label}</span>}
            {!collapsed && id !== 'upload' && !activeDoc && (
              <span className="ml-auto text-[10px] text-[#6060A0]">No doc</span>
            )}
          </button>
        ))}

        {/* Documents section */}
        {!collapsed && documents.length > 0 && (
          <div className="mt-6">
            <div className="flex items-center justify-between px-2 mb-2">
              <span className="text-xs font-semibold text-[#6060A0] uppercase tracking-wider">Documents</span>
              <button
                onClick={() => setActiveTab('upload')}
                className="w-5 h-5 rounded flex items-center justify-center hover:bg-[#252540] text-[#6060A0] hover:text-[#00FF88] transition-colors"
              >
                <Plus size={12} />
              </button>
            </div>
            <div className="space-y-1">
              {documents.slice(0, 8).map(doc => (
                <div
                  key={doc.id}
                  onClick={() => setActiveDoc(doc)}
                  className={`group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all ${
                    activeDoc?.id === doc.id
                      ? 'bg-[#00FF88]/08 border border-[#00FF88]/15 text-[#00FF88]'
                      : 'text-[#9090D0] hover:bg-[#252540] hover:text-white'
                  }`}
                >
                  <File size={13} className="flex-shrink-0" />
                  <span className="text-xs truncate flex-1">{doc.title}</span>
                  <button
                    onClick={(e) => handleDeleteDoc(doc.id, e)}
                    className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-opacity"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer - user & sign out */}
      <div className="px-3 py-4 border-t border-[#252540]">
        {!collapsed && (
          <div className="flex items-center gap-2 px-3 py-2 mb-2 rounded-lg bg-[#16162A]">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#00FF88] to-[#0088FF] flex items-center justify-center text-[#0A0A0F] text-xs font-bold flex-shrink-0">
              {user?.email?.[0]?.toUpperCase() ?? 'U'}
            </div>
            <span className="text-xs text-[#9090D0] truncate flex-1">
              {user?.email}
            </span>
          </div>
        )}
        <button
          onClick={handleSignOut}
          className={`nav-item w-full text-red-400 hover:text-red-300 hover:bg-red-400/08`}
          title={collapsed ? 'Sign out' : undefined}
        >
          <LogOut size={16} className="flex-shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  )
}
