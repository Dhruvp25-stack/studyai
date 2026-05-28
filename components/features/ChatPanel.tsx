// FILE LOCATION: components/features/ChatPanel.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { useApp } from '@/app/(dashboard)/dashboard/layout'
import { createClient } from '@/lib/supabase'
import type { ChatMessage } from '@/types'
import { MessageCircle, Send, Trash2, Bot, User } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

const SUGGESTIONS = ['Summarise the key concepts', 'What are the most important points?', 'Give me a real-world example', 'What should I study first?']

export function ChatPanel() {
  const { activeDoc, user }       = useApp()
  const [messages, setMessages]   = useState<ChatMessage[]>([])
  const [input, setInput]         = useState('')
  const [loading, setLoading]     = useState(false)
  const [fetching, setFetching]   = useState(false)
  const bottomRef                 = useRef<HTMLDivElement>(null)
  const inputRef                  = useRef<HTMLInputElement>(null)

  useEffect(() => { if (activeDoc) loadMessages(); else setMessages([]) }, [activeDoc?.id]) // eslint-disable-line
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const loadMessages = async () => {
    if (!activeDoc) return
    setFetching(true)
    const { data } = await createClient().from('chat_messages').select('*').eq('document_id', activeDoc.id).order('created_at')
    if (data) setMessages(data as ChatMessage[])
    setFetching(false)
  }

  const send = async (override?: string) => {
    const text = (override ?? input).trim()
    if (!text || !activeDoc || loading) return
    setInput(''); setLoading(true); inputRef.current?.focus()

    const userMsg: ChatMessage = { id: Date.now().toString(), document_id: activeDoc.id, user_id: user!.id, role: 'user', content: text, created_at: new Date().toISOString() }
    setMessages(p => [...p, userMsg])

    try {
      const res  = await fetch('/api/ai', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'chat', content: activeDoc.content, messages: messages.map(m => ({ role: m.role, content: m.content })), userMessage: text }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      const aiMsg: ChatMessage = { id: (Date.now()+1).toString(), document_id: activeDoc.id, user_id: user!.id, role: 'assistant', content: data.result, created_at: new Date().toISOString() }
      setMessages(p => [...p, aiMsg])
      const sb = createClient()
      await sb.from('chat_messages').insert([{ document_id: activeDoc.id, user_id: user!.id, role: 'user', content: text }, { document_id: activeDoc.id, user_id: user!.id, role: 'assistant', content: data.result }])
    } catch (err: unknown) {
      setMessages(p => [...p, { id: (Date.now()+1).toString(), document_id: activeDoc.id, user_id: user!.id, role: 'assistant', content: `Sorry, something went wrong: ${err instanceof Error ? err.message : 'Unknown error'}`, created_at: new Date().toISOString() }])
    } finally { setLoading(false) }
  }

  const clearChat = async () => {
    if (!activeDoc || !confirm('Clear chat history?')) return
    await createClient().from('chat_messages').delete().eq('document_id', activeDoc.id)
    setMessages([])
  }

  if (!activeDoc) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', textAlign: 'center' }}>
      <MessageCircle size={32} color="#333" style={{ marginBottom: 12 }} />
      <p style={{ color: '#555', fontSize: 14 }}>Select a document to chat with your AI tutor</p>
    </div>
  )

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 72px)' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexShrink: 0 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#F2F2F2', letterSpacing: '-0.4px', marginBottom: 2 }}>AI Tutor Chat</h1>
          <p style={{ fontSize: 13, color: '#555', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 360 }}>{activeDoc.title}</p>
        </div>
        {messages.length > 0 && (
          <button onClick={clearChat} className="btn btn-secondary" style={{ color: '#F87171', borderColor: 'rgba(248,113,113,0.2)', fontSize: 13 }}>
            <Trash2 size={12} /> Clear
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="card" style={{ flex: 1, overflowY: 'auto', padding: '16px', marginBottom: 12, minHeight: 0 }}>
        {fetching ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 8, color: '#555', fontSize: 13 }}>
            <span style={{ width: 16, height: 16, border: '2px solid #2A2A2A', borderTopColor: '#4F8EF7', borderRadius: '50%' }} className="spin" /> Loading…
          </div>
        ) : messages.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center', padding: 24 }}>
            <Bot size={28} color="#333" style={{ marginBottom: 12 }} />
            <h3 style={{ fontSize: 15, fontWeight: 600, color: '#E0E0E0', marginBottom: 6 }}>AI Tutor Ready</h3>
            <p style={{ fontSize: 13, color: '#555', marginBottom: 20, maxWidth: 300 }}>Ask anything about your document.</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, width: '100%', maxWidth: 380 }}>
              {SUGGESTIONS.map(s => (
                <button key={s} onClick={() => send(s)} style={{ textAlign: 'left', padding: '9px 12px', borderRadius: 8, background: '#181818', border: '1px solid #242424', color: '#666', fontSize: 12.5, cursor: 'pointer', transition: 'all 0.12s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#333'; e.currentTarget.style.color = '#999' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#242424'; e.currentTarget.style.color = '#666' }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {messages.map(msg => (
              <div key={msg.id} style={{ display: 'flex', gap: 10, flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: msg.role === 'user' ? 'rgba(79,142,247,0.12)' : '#202020', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {msg.role === 'user' ? <User size={13} color="#4F8EF7" /> : <Bot size={13} color="#666" />}
                </div>
                <div className={msg.role === 'user' ? 'bubble-user' : 'bubble-ai'}>
                  {msg.role === 'assistant'
                    ? <div className="prose-ai" style={{ fontSize: 13.5 }}><ReactMarkdown>{msg.content}</ReactMarkdown></div>
                    : <p style={{ fontSize: 13.5, color: '#E0E0E0' }}>{msg.content}</p>}
                  <p style={{ fontSize: 11, color: '#444', marginTop: 6 }}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#202020', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Bot size={13} color="#666" />
                </div>
                <div className="bubble-ai">
                  <div style={{ display: 'flex', gap: 4, padding: '2px 0' }}>
                    {[0,1,2].map(i => <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: '#444', animation: 'bounce 1s ease-in-out infinite', animationDelay: `${i*0.15}s` }} />)}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Suggestions */}
      {messages.length > 0 && !loading && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 8, overflowX: 'auto', flexShrink: 0 }}>
          {SUGGESTIONS.slice(0,3).map(s => (
            <button key={s} onClick={() => send(s)} style={{ flexShrink: 0, padding: '5px 11px', borderRadius: 99, background: '#181818', border: '1px solid #242424', color: '#666', fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap' }}>
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        <input
          ref={inputRef} type="text" value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder="Ask anything about this document…"
          className="input" style={{ flex: 1 }} disabled={loading}
        />
        <button
          onClick={() => send()} disabled={!input.trim() || loading}
          className="btn btn-primary"
          style={{ width: 40, height: 40, padding: 0, borderRadius: 8, flexShrink: 0 }}
        >
          {loading
            ? <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%' }} className="spin" />
            : <Send size={15} />}
        </button>
      </div>
    </div>
  )
}
