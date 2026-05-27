'use client'

import { useState, useEffect, useRef } from 'react'
import { useApp } from '@/app/(dashboard)/dashboard/layout'
import { createClient } from '@/lib/supabase'
import type { ChatMessage } from '@/types'
import { MessageCircle, Send, Trash2, Bot, User } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

export function ChatPanel() {
  const { activeDoc, user } = useApp()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (activeDoc) loadMessages()
    else setMessages([])
  }, [activeDoc?.id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadMessages = async () => {
    if (!activeDoc) return
    setFetching(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('document_id', activeDoc.id)
      .order('created_at')
    if (data) setMessages(data as ChatMessage[])
    setFetching(false)
  }

  const sendMessage = async () => {
    if (!input.trim() || !activeDoc || loading) return
    const text = input.trim()
    setInput('')
    setLoading(true)

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

      // Save to DB
      const supabase = createClient()
      await supabase.from('chat_messages').insert([
        { document_id: activeDoc.id, user_id: user!.id, role: 'user', content: text },
        { document_id: activeDoc.id, user_id: user!.id, role: 'assistant', content: data.result },
      ])
    } catch (err: unknown) {
      const errMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        document_id: activeDoc.id,
        user_id: user!.id,
        role: 'assistant',
        content: `Sorry, I encountered an error: ${err instanceof Error ? err.message : 'Unknown error'}`,
        created_at: new Date().toISOString(),
      }
      setMessages(prev => [...prev, errMsg])
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

  const SUGGESTIONS = [
    'Summarize the key concepts',
    'What are the most important points?',
    'Give me an example of the main idea',
    'What should I study first?',
  ]

  if (!activeDoc) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#8800FF]/10 flex items-center justify-center mb-4">
          <MessageCircle size={28} className="text-[#8800FF]" />
        </div>
        <h2 className="font-display font-bold text-xl text-white mb-2">No Document Selected</h2>
        <p className="text-[#9090D0]">Upload or select a document to chat with your AI tutor</p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto animate-fade-in-up flex flex-col" style={{ height: 'calc(100vh - 80px)' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#8800FF]/15 flex items-center justify-center">
            <MessageCircle size={16} className="text-[#8800FF]" />
          </div>
          <div>
            <h1 className="font-display font-bold text-2xl text-white">AI Tutor Chat</h1>
            <p className="text-[#9090D0] text-xs">{activeDoc.title}</p>
          </div>
        </div>
        {messages.length > 0 && (
          <button onClick={clearChat} className="btn-secondary flex items-center gap-2 text-sm py-2 px-3 text-red-400 border-red-400/20 hover:border-red-400/40">
            <Trash2 size={13} />
            Clear
          </button>
        )}
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto card p-4 mb-4 min-h-0">
        {fetching ? (
          <div className="flex items-center justify-center h-full text-[#9090D0]">
            <div className="w-6 h-6 border-2 border-t-transparent border-[#8800FF] rounded-full animate-spin mr-3" />
            Loading conversation...
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#8800FF]/10 flex items-center justify-center mb-4 border border-[#8800FF]/20">
              <Bot size={28} className="text-[#8800FF]" />
            </div>
            <h3 className="font-display font-semibold text-white mb-2">Your AI Tutor is Ready</h3>
            <p className="text-[#9090D0] text-sm mb-6 max-w-sm">
              Ask anything about your document. I&apos;ll explain concepts, answer questions, and help you understand the material.
            </p>
            <div className="grid grid-cols-2 gap-2 w-full max-w-sm">
              {SUGGESTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => setInput(s)}
                  className="text-left px-3 py-2 rounded-xl glass glass-hover text-[#C0C0E0] text-xs border border-[#252540] hover:border-[#8800FF]/30"
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
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-[#0088FF]/20' : 'bg-[#8800FF]/20'}`}>
                  {msg.role === 'user'
                    ? <User size={14} className="text-[#0088FF]" />
                    : <Bot size={14} className="text-[#8800FF]" />
                  }
                </div>
                <div className={msg.role === 'user' ? 'bubble-user' : 'bubble-ai'}>
                  {msg.role === 'assistant' ? (
                    <div className="prose-dark text-sm">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-[#C0C0E0] text-sm">{msg.content}</p>
                  )}
                  <p className="text-[#6060A0] text-xs mt-2">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-[#8800FF]/20 flex items-center justify-center flex-shrink-0">
                  <Bot size={14} className="text-[#8800FF]" />
                </div>
                <div className="bubble-ai">
                  <div className="flex gap-1.5 py-1">
                    {[0, 1, 2].map(i => (
                      <div key={i} className="w-2 h-2 rounded-full bg-[#8800FF] animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="flex-shrink-0">
        {messages.length > 0 && !loading && (
          <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
            {SUGGESTIONS.slice(0, 3).map(s => (
              <button
                key={s}
                onClick={() => setInput(s)}
                className="flex-shrink-0 text-xs px-3 py-1.5 rounded-full glass border border-[#252540] hover:border-[#8800FF]/30 text-[#9090D0] hover:text-white transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        )}
        <div className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder="Ask your AI tutor anything about this document..."
            className="input-field flex-1"
            disabled={loading}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            className="btn-primary flex items-center justify-center w-12 h-12 rounded-xl flex-shrink-0"
            style={{ padding: 0, background: 'linear-gradient(135deg, #8800FF, #6600CC)' }}
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin" />
            ) : (
              <Send size={16} />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
