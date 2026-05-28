// FILE LOCATION: components/features/Sidebar.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useApp } from '@/app/(dashboard)/dashboard/layout'
import type { TabType } from '@/types'
import {
  Brain, Upload, FileText, Layers, HelpCircle,
  Lightbulb, MessageCircle, LogOut, Trash2, Plus, ChevronLeft, ChevronRight,
} from 'lucide-react'

const NAV: { id: TabType; label: string; icon: typeof Upload }[] = [
  { id: 'upload',     label: 'Upload PDF',    icon: Upload        },
  { id: 'summary',    label: 'AI Summary',    icon: FileText      },
  { id: 'flashcards', label: 'Flashcards',    icon: Layers        },
  { id: 'quiz',       label: 'Quiz Mode',     icon: HelpCircle    },
  { id: 'explain',    label: 'Explain Simple',icon: Lightbulb     },
  { id: 'chat',       label: 'AI Tutor Chat', icon: MessageCircle },
]

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const { user, documents, activeDoc, setActiveDoc, activeTab, setActiveTab, refreshDocuments } = useApp()
  const router = useRouter()

  const handleSignOut = async () => {
    await createClient().auth.signOut()
    router.push('/login')
  }

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Delete this document?')) return
    await createClient().from('documents').delete().eq('id', id)
    if (activeDoc?.id === id) setActiveDoc(null)
    await refreshDocuments()
  }

  const w = collapsed ? 56 : 224

  return (
    <aside style={{
      width: w, minWidth: w, height: '100vh',
      background: '#111111', borderRight: '1px solid #1E1E1E',
      display: 'flex', flexDirection: 'column',
      transition: 'width 0.25s ease, min-width 0.25s ease',
      position: 'relative', overflow: 'hidden',
    }}>

      {/* Logo */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: collapsed ? '16px 0' : '16px 14px',
        justifyContent: collapsed ? 'center' : 'flex-start',
        borderBottom: '1px solid #1E1E1E', flexShrink: 0,
      }}>
        <div style={{
          width: 28, height: 28, borderRadius: 7, background: '#4F8EF7',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Brain size={15} color="#fff" />
        </div>
        {!collapsed && (
          <span style={{ fontWeight: 700, fontSize: 15, color: '#F2F2F2', letterSpacing: '-0.3px', whiteSpace: 'nowrap' }}>
            StudyAI
          </span>
        )}
      </div>

      {/* Collapse button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        style={{
          position: 'absolute', top: 14, right: -10, zIndex: 10,
          width: 20, height: 20, borderRadius: '50%',
          background: '#1E1E1E', border: '1px solid #2A2A2A',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: '#666',
        }}
      >
        {collapsed ? <ChevronRight size={11} /> : <ChevronLeft size={11} />}
      </button>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '10px 8px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {NAV.map(({ id, label, icon: Icon }) => {
            const isActive   = activeTab === id
            const isDisabled = id !== 'upload' && !activeDoc
            return (
              <button
                key={id}
                onClick={() => !isDisabled && setActiveTab(id)}
                disabled={isDisabled}
                title={collapsed ? label : undefined}
                className="nav-item"
                style={{
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  ...(isActive ? {
                    background: 'rgba(79,142,247,0.08)',
                    color: '#4F8EF7',
                    borderColor: 'rgba(79,142,247,0.15)',
                  } : {}),
                }}
              >
                <Icon size={15} style={{ flexShrink: 0 }} />
                {!collapsed && (
                  <>
                    <span style={{ flex: 1 }}>{label}</span>
                    {isDisabled && (
                      <span style={{ fontSize: 10, color: '#444' }}>No doc</span>
                    )}
                  </>
                )}
              </button>
            )
          })}
        </div>

        {/* Documents list */}
        {!collapsed && documents.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '0 4px', marginBottom: 6,
            }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: '#444', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Documents
              </span>
              <button
                onClick={() => setActiveTab('upload')}
                style={{
                  width: 18, height: 18, borderRadius: 4, background: 'transparent',
                  border: 'none', cursor: 'pointer', color: '#555',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Plus size={12} />
              </button>
            </div>

            {documents.slice(0, 8).map(doc => (
              <div
                key={doc.id}
                onClick={() => setActiveDoc(doc)}
                className="nav-item"
                style={{
                  fontSize: 12.5, marginBottom: 1,
                  ...(activeDoc?.id === doc.id ? {
                    background: 'rgba(79,142,247,0.06)',
                    color: '#4F8EF7',
                  } : {}),
                }}
              >
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {doc.title}
                </span>
                <button
                  onClick={e => handleDelete(doc.id, e)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#444', padding: 2, borderRadius: 4,
                    display: 'flex', alignItems: 'center',
                    opacity: 0,
                  }}
                  className="delete-btn"
                  onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                  onMouseLeave={e => (e.currentTarget.style.opacity = '0')}
                >
                  <Trash2 size={11} />
                </button>
              </div>
            ))}
          </div>
        )}
      </nav>

      {/* Footer */}
      <div style={{ padding: '8px 8px', borderTop: '1px solid #1E1E1E', flexShrink: 0 }}>
        {!collapsed && (
          <div style={{
            padding: '8px 10px', borderRadius: 8, background: '#181818',
            marginBottom: 4, display: 'flex', alignItems: 'center', gap: 9,
          }}>
            <div style={{
              width: 26, height: 26, borderRadius: '50%',
              background: '#4F8EF7', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0,
            }}>
              {user?.email?.[0]?.toUpperCase() ?? 'U'}
            </div>
            <span style={{
              fontSize: 12, color: '#666',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {user?.email}
            </span>
          </div>
        )}
        <button
          onClick={handleSignOut}
          title={collapsed ? 'Sign out' : undefined}
          className="nav-item"
          style={{ justifyContent: collapsed ? 'center' : 'flex-start' }}
        >
          <LogOut size={14} style={{ flexShrink: 0 }} />
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>
    </aside>
  )
}
