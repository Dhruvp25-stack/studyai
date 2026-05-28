'use client'

import { useState, useEffect, useRef } from 'react'
import { useApp } from '@/app/(dashboard)/dashboard/layout'
import { createClient } from '@/lib/supabase'
import type { ChatMessage } from '@/types'
import { MessageCircle, Send, Trash2, Bot, User } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

const VIOLET = '#9B59FF'
const VIOLET_DIM = 'rgba(155,89,255,0.08)'
const VIOLET_BORDER = 'rgba(155,89,255,0.18)'

const SUGGESTIONS = [
  'Summarise the key concepts',
  'What are the most important points?',
  'Give me a real-world example',
  'What should I study first?',
]

export function ChatPanel() {
  const { activeDoc, user } = useApp()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (activeDoc) loadMessages()
    else setMessages([])
  }, [activeDoc?.id]) // eslint-disable-line

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadMessages = async () => {
    if (!activeDoc) return
    setFetching(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('chat_messages').select('*')
      .eq('document_id', activeDoc.id).order('created_at')
    if (data) setMessages(data as ChatMessage[])
    setFetching(false)
  }

  const sendMessage = async (overrideText?: string) => {
    const text = (overrideText ?? input).trim()
    if (!text || !activeDoc || loading) return
    setInput('')
    setLoading(true)
    inputRef.current?.focus()

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      document_id: activeDoc.id,
      user_id: user!.id,
      role: 'user',
      content: text,
      created_at: new Date().toISOString(),
    }
    setMessages(prev => [...prev, userMsg])

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'chat',
          content: activeDoc.content,
          messages: messages.map(m => ({ role: m.role, content: m.content })),
          userMessage: text,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        document_id: activeDoc.id,
        user_id: user!.id,
        role: 'assistant',
        content: data.result,
        created_at: new Date().toISOString(),
      }
      setMessages(prev => [...prev, aiMsg])

      const supabase = createClient()
      await supabase.from('chat_messages').insert([
        { document_id: activeDoc.id, user_id: user!.id, role: 'user',      content: text },
        { document_id: activeDoc.id, user_id: user!.id, role: 'assistant', content: data.result },
      ])
    } catch (err: unknown) {
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          document_id: activeDoc.id,
          user_id: user!.id,
          role: 'assistant',
          content: `Sorry, I encountered an error: ${err instanceof Error ? err.message : 'Unknown error'}`,
          created_at: new Date().toISOString(),
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const clearChat = async () => {
    if (!activeDoc || !confirm('Clear chat history?')) return
    const supabase = createClient()
    await supabase.from('chat_messages').delete().eq('document_id', activeDoc.id)
    setMessages([])
  }

  /* ── No doc ─────────────────────────────────────────────────── */
  if (!activeDoc) {
    return (
      <div className="flex flex-col items-center justify-center py-28 text-center animate-fade-in">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
          style={{ background: VIOLET_DIM, border: `1px solid ${VIOLET_BORDER}` }}>
          <MessageCircle size={26} style={{ color: VIOLET }} />
        </div>
        <h2 className="font-display text-2xl text-[--text-primary] mb-2">No Document Selected</h2>
        <p className="text-[--text-secondary] text-sm">Upload or select a document to chat with your AI tutor</p>
      </div>
    )
  }

  return (
    <div
      className="max-w-3xl mx-auto animate-fade-in-up flex flex-col"
      style={{ height: 'calc(100vh - 80px)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: VIOLET_DIM, border: `1px solid ${VIOLET_BORDER}` }}>
            <MessageCircle size={16} style={{ color: VIOLET }} />
          </div>
          <div>
            <h1 className="font-display text-3xl text-[--text-primary] leading-none mt-0.5">
              AI Tutor Chat
            </h1>
            <p className="text-[--text-secondary] text-xs mt-0.5 truncate max-w-[260px]">
              {activeDoc.title}
            </p>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={clearChat}
            className="btn-secondary flex items-center gap-2 text-sm py-2 px-3
              text-[--accent-rose] border-[--accent-rose]/20 hover:border-[--accent-rose]/40"
          >
            <Trash2 size={12} /> Clear
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto card p-5 mb-4 min-h-0">
        {fetching ? (
          <div className="flex items-center justify-center h-full gap-3 text-[--text-secondary] text-sm">
            <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin"
              style={{ borderTopColor: VIOLET }} />
            Loading conversation…
          </div>

        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
              style={{ background: VIOLET_DIM, border: `1px solid ${VIOLET_BORDER}` }}
            >
              <Bot size={26} style={{ color: VIOLET }} />
            </div>
            <h3 className="font-display text-xl text-[--text-primary] mb-2">Your AI Tutor is Ready</h3>
            <p className="text-[--text-secondary] text-sm mb-7 max-w-sm leading-relaxed">
              Ask anything about your document. I&apos;ll explain concepts, answer questions,
              and help you understand the material.
            </p>
            <div className="grid grid-cols-2 gap-2 w-full max-w-sm">
              {SUGGESTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="text-left px-3 py-2.5 rounded-xl glass text-[--text-secondary]
                    text-xs border border-[--border] transition-all
                    hover:border-[rgba(155,89,255,0.3)] hover:text-[--text-primary]"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

        ) : (
          <div className="flex flex-col gap-4">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {/* Avatar */}
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{
                    background: msg.role === 'user' ? 'rgba(45,156,255,0.15)' : VIOLET_DIM,
                  }}
                >
                  {msg.role === 'user'
                    ? <User size={13} className="text-[--accent-blue]" />
                    : <Bot  size={13} style={{ color: VIOLET }} />}
                </div>

                {/* Bubble */}
                <div className={msg.role === 'user' ? 'bubble-user' : 'bubble-ai'}>
                  {msg.role === 'assistant' ? (
                    <div className="prose-dark text-sm">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-[--text-primary] text-sm">{msg.content}</p>
                  )}
                  <p className="text-[--text-muted] text-[11px] mt-2">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div className="flex gap-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: VIOLET_DIM }}
                >
                  <Bot size={13} style={{ color: VIOLET }} />
                </div>
                <div className="bubble-ai">
                  <div className="flex gap-1.5 py-0.5">
                    {[0, 1, 2].map(i => (
                      <div
                        key={i}
                        className="w-2 h-2 rounded-full animate-bounce"
                        style={{ background: VIOLET, animationDelay: `${i * 0.14}s` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="flex-shrink-0">
        {messages.length > 0 && !loading && (
          <div className="flex gap-2 mb-3 overflow-x-auto pb-0.5 scrollbar-hide">
            {SUGGESTIONS.slice(0, 3).map(s => (
              <button
                key={s}
                onClick={() => sendMessage(s)}
                className="flex-shrink-0 text-xs px-3 py-1.5 rounded-full glass
                  border border-[--border] text-[--text-secondary]
                  hover:text-[--text-primary] transition-colors"
                style={{ '--hover-border': VIOLET_BORDER } as React.CSSProperties}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <div className="flex gap-3">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder="Ask your AI tutor anything about this document…"
            className="input-field flex-1"
            disabled={loading}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className="btn-primary flex items-center justify-center w-11 h-11 rounded-xl flex-shrink-0 disabled:opacity-40"
            style={{ padding: 0, background: `linear-gradient(135deg, ${VIOLET}, #6A00DD)` }}
          >
            {loading
              ? <span className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin" />
              : <Send size={15} />}
          </button>
        </div>
      </div>
    </div>
  )
}
