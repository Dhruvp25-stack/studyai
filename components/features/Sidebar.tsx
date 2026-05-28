'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useApp } from '@/app/(dashboard)/dashboard/layout'
import type { TabType } from '@/types'
import {
  Brain, Upload, FileText, Layers, HelpCircle,
  Lightbulb, MessageCircle, LogOut, ChevronLeft,
  ChevronRight, Trash2, Plus, File,
} from 'lucide-react'

const NAV_ITEMS: {
  id: TabType
  label: string
  icon: typeof Upload
  color: string
  accentBg: string
}[] = [
  { id: 'upload',    label: 'Upload PDF',    icon: Upload,        color: '#00E87A', accentBg: 'rgba(0,232,122,0.08)'  },
  { id: 'summary',   label: 'AI Summary',    icon: FileText,      color: '#2D9CFF', accentBg: 'rgba(45,156,255,0.08)' },
  { id: 'flashcards',label: 'Flashcards',    icon: Layers,        color: '#FFB830', accentBg: 'rgba(255,184,48,0.08)'  },
  { id: 'quiz',      label: 'Quiz Mode',     icon: HelpCircle,    color: '#FF4D7A', accentBg: 'rgba(255,77,122,0.08)'  },
  { id: 'explain',   label: 'Explain Simple',icon: Lightbulb,     color: '#FF8C42', accentBg: 'rgba(255,140,66,0.08)'  },
  { id: 'chat',      label: 'AI Tutor Chat', icon: MessageCircle, color: '#9B59FF', accentBg: 'rgba(155,89,255,0.08)'  },
]

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const {
    user, documents, activeDoc,
    setActiveDoc, activeTab, setActiveTab, refreshDocuments,
  } = useApp()
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
      className="relative flex flex-col border-r border-[--border] bg-[--bg-surface] transition-all duration-300 ease-in-out"
      style={{ width: collapsed ? '64px' : '252px', minWidth: collapsed ? '64px' : '252px' }}
    >
      {/* ── Logo header ─────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 py-[18px] border-b border-[--border]">
        <div className="w-8 h-8 rounded-xl bg-[--accent-green] flex items-center justify-center flex-shrink-0 shadow-[0_0_14px_rgba(0,232,122,0.35)]">
          <Brain size={15} className="text-[#03030A]" />
        </div>
        {!collapsed && (
          <span className="font-display text-lg text-[--text-primary] leading-none mt-0.5">
            StudyAI
          </span>
        )}
      </div>

      {/* ── Collapse toggle ──────────────────────────────────── */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-[62px] z-10 w-6 h-6 rounded-full
          bg-[--bg-elevated] border border-[--border-light]
          flex items-center justify-center
          hover:border-[--accent-green]/40 hover:text-[--accent-green]
          text-[--text-muted] transition-colors"
      >
        {collapsed
          ? <ChevronRight size={11} />
          : <ChevronLeft  size={11} />
        }
      </button>

      {/* ── Main nav ─────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-0.5">
        {NAV_ITEMS.map(({ id, label, icon: Icon, color, accentBg }) => {
          const isActive   = activeTab === id
          const isDisabled = id !== 'upload' && !activeDoc

          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              disabled={isDisabled}
              title={collapsed ? label : undefined}
              className={`nav-item w-full ${isActive ? 'active' : ''} ${isDisabled ? 'opacity-35 cursor-not-allowed' : ''}`}
              style={isActive ? { background: accentBg, borderColor: `${color}28`, color } : undefined}
            >
              <Icon
                size={15}
                className="flex-shrink-0"
                style={{ color: isActive ? color : undefined }}
              />
              {!collapsed && <span className="flex-1 text-left">{label}</span>}
              {!collapsed && isDisabled && (
                <span className="text-[10px] text-[--text-muted] font-mono">No doc</span>
              )}
            </button>
          )
        })}

        {/* ── Documents list ─────────────────────────────────── */}
        {!collapsed && documents.length > 0 && (
          <div className="pt-5">
            <div className="flex items-center justify-between px-2 mb-2">
              <span className="text-[10px] font-semibold tracking-widest uppercase text-[--text-muted]">
                Documents
              </span>
              <button
                onClick={() => setActiveTab('upload')}
                className="w-5 h-5 rounded flex items-center justify-center
                  hover:bg-[--bg-hover] text-[--text-muted]
                  hover:text-[--accent-green] transition-colors"
              >
                <Plus size={11} />
              </button>
            </div>

            <div className="space-y-px">
              {documents.slice(0, 8).map(doc => (
                <div
                  key={doc.id}
                  onClick={() => setActiveDoc(doc)}
                  className={`group flex items-center gap-2 px-3 py-2.5 rounded-xl
                    cursor-pointer transition-all
                    ${activeDoc?.id === doc.id
                      ? 'bg-[--accent-green]/07 text-[--accent-green]'
                      : 'text-[--text-secondary] hover:bg-[--bg-hover] hover:text-[--text-primary]'
                    }`}
                >
                  <File size={12} className="flex-shrink-0 opacity-70" />
                  <span className="text-xs truncate flex-1 font-medium">{doc.title}</span>
                  <button
                    onClick={(e) => handleDeleteDoc(doc.id, e)}
                    className="opacity-0 group-hover:opacity-100 text-[--accent-rose]/70
                      hover:text-[--accent-rose] transition-all flex-shrink-0"
                  >
                    <Trash2 size={10} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Footer ───────────────────────────────────────────── */}
      <div className="px-2.5 py-3 border-t border-[--border]">
        {!collapsed && (
          <div className="flex items-center gap-2.5 px-3 py-2.5 mb-1.5 rounded-xl bg-[--bg-elevated]">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[--accent-green] to-[--accent-blue]
              flex items-center justify-center text-[#03030A] text-xs font-bold flex-shrink-0">
              {user?.email?.[0]?.toUpperCase() ?? 'U'}
            </div>
            <span className="text-xs text-[--text-secondary] truncate flex-1">
              {user?.email}
            </span>
          </div>
        )}
        <button
          onClick={handleSignOut}
          title={collapsed ? 'Sign out' : undefined}
          className="nav-item w-full text-[--text-muted] hover:text-[--accent-rose] hover:bg-[--accent-rose]/06"
        >
          <LogOut size={14} className="flex-shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  )
}
