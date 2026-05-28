// FILE LOCATION: components/features/FlashcardsPanel.tsx
'use client'

import { useState, useEffect } from 'react'
import { useApp } from '@/app/(dashboard)/dashboard/layout'
import { createClient } from '@/lib/supabase'
import type { Flashcard } from '@/types'
import { Layers, Sparkles, ChevronLeft, ChevronRight, RotateCcw, Shuffle, AlertCircle } from 'lucide-react'

export function FlashcardsPanel() {
  const { activeDoc, user } = useApp()
  const [cards, setCards]         = useState<Flashcard[]>([])
  const [current, setCurrent]     = useState(0)
  const [flipped, setFlipped]     = useState(false)
  const [loading, setLoading]     = useState(false)
  const [generating, setGenerating] = useState(false)
  const [error, setError]         = useState('')

  useEffect(() => { if (activeDoc) loadCards(); setFlipped(false); setCurrent(0) }, [activeDoc?.id]) // eslint-disable-line

  const loadCards = async () => {
    if (!activeDoc) return
    setLoading(true)
    const { data } = await createClient().from('flashcards').select('*').eq('document_id', activeDoc.id).order('created_at')
    if (data) setCards(data as Flashcard[])
    setLoading(false)
  }

  const generate = async () => {
    if (!activeDoc) return
    setGenerating(true); setError('')
    try {
      const res  = await fetch('/api/ai', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'flashcards', content: activeDoc.content }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      const sb = createClient()
      await sb.from('flashcards').delete().eq('document_id', activeDoc.id)
      const { data: inserted } = await sb.from('flashcards').insert(data.result.map((c: { front: string; back: string }) => ({ document_id: activeDoc.id, user_id: user!.id, front: c.front, back: c.back }))).select()
      if (inserted) setCards(inserted as Flashcard[])
      setCurrent(0); setFlipped(false)
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Failed') }
    finally { setGenerating(false) }
  }

  if (!activeDoc) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', textAlign: 'center' }}>
      <Layers size={32} color="#333" style={{ marginBottom: 12 }} />
      <p style={{ color: '#555', fontSize: 14 }}>Select a document to create flashcards</p>
    </div>
  )

  const busy = loading || generating

  return (
    <div style={{ maxWidth: 560, margin: '0 auto' }} className="fade-up">

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#F2F2F2', letterSpacing: '-0.4px', marginBottom: 3 }}>Flashcards</h1>
          {cards.length > 0 && <p style={{ fontSize: 13, color: '#555' }}>{cards.length} cards · {activeDoc.title}</p>}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {cards.length > 1 && <button onClick={() => { setCards(p => [...p].sort(() => Math.random() - 0.5)); setCurrent(0); setFlipped(false) }} className="btn btn-secondary"><Shuffle size={13} /> Shuffle</button>}
          <button onClick={generate} disabled={busy} className="btn btn-primary">
            {generating ? <span style={{ width: 13, height: 13, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%' }} className="spin" /> : <Sparkles size={13} />}
            {generating ? 'Generating…' : cards.length ? 'Regenerate' : 'Generate Cards'}
          </button>
        </div>
      </div>

      {error && <div style={{ display: 'flex', gap: 9, padding: '10px 14px', borderRadius: 8, marginBottom: 16, background: 'rgba(248,113,113,0.07)', border: '1px solid rgba(248,113,113,0.18)', color: '#F87171', fontSize: 13 }}><AlertCircle size={14} style={{ flexShrink: 0 }} />{error}</div>}

      {busy ? (
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <div style={{ width: 36, height: 36, border: '3px solid #1E1E1E', borderTopColor: '#4F8EF7', borderRadius: '50%', margin: '0 auto 12px' }} className="spin" />
          <p style={{ color: '#555', fontSize: 13 }}>{generating ? 'Creating flashcards…' : 'Loading…'}</p>
        </div>

      ) : cards.length > 0 ? (
        <>
          {/* Progress */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div className="progress-track" style={{ flex: 1, height: 3 }}>
              <div className="progress-fill" style={{ height: '100%', width: `${((current + 1) / cards.length) * 100}%` }} />
            </div>
            <span style={{ fontSize: 12, color: '#555', fontVariantNumeric: 'tabular-nums' }}>{current + 1}/{cards.length}</span>
          </div>

          {/* Card */}
          <div className="perspective" style={{ height: 220, marginBottom: 16 }}>
            <div
              className={`flip-card${flipped ? ' flipped' : ''}`}
              style={{ width: '100%', height: '100%', cursor: 'pointer' }}
              onClick={() => setFlipped(f => !f)}
            >
              {/* Front */}
              <div className="flip-face card" style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 28, textAlign: 'center' }}>
                <span style={{ fontSize: 10, fontWeight: 600, color: '#555', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>Question</span>
                <p style={{ fontSize: 16, color: '#F2F2F2', fontWeight: 500, lineHeight: 1.5 }}>{cards[current]?.front}</p>
                <p style={{ fontSize: 12, color: '#444', marginTop: 14 }}>Tap to reveal</p>
              </div>
              {/* Back */}
              <div className="flip-face flip-back" style={{ position: 'absolute', inset: 0, background: '#181818', border: '1px solid rgba(79,142,247,0.2)', borderRadius: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 28, textAlign: 'center' }}>
                <span style={{ fontSize: 10, fontWeight: 600, color: '#4F8EF7', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>Answer</span>
                <p style={{ fontSize: 15, color: '#E0E0E0', lineHeight: 1.6 }}>{cards[current]?.back}</p>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <button onClick={() => { setCurrent(p => Math.max(p - 1, 0)); setFlipped(false) }} disabled={current === 0} className="btn btn-secondary"><ChevronLeft size={15} /> Prev</button>
            <button onClick={() => setFlipped(f => !f)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4F8EF7', fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 5 }}><RotateCcw size={13} /> Flip</button>
            <button onClick={() => { setCurrent(p => Math.min(p + 1, cards.length - 1)); setFlipped(false) }} disabled={current === cards.length - 1} className="btn btn-secondary">Next <ChevronRight size={15} /></button>
          </div>

          {/* List */}
          <p style={{ fontSize: 11, fontWeight: 600, color: '#444', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>All Cards</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {cards.map((card, i) => (
              <div key={card.id} onClick={() => { setCurrent(i); setFlipped(false) }}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 8, cursor: 'pointer', background: i === current ? 'rgba(79,142,247,0.07)' : 'transparent', transition: 'background 0.1s' }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#4F8EF7', width: 18, flexShrink: 0 }}>{i + 1}</span>
                <p style={{ fontSize: 13, color: '#888', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{card.front}</p>
              </div>
            ))}
          </div>
        </>

      ) : (
        <div className="card" style={{ padding: '56px 32px', textAlign: 'center', borderStyle: 'dashed' }}>
          <Layers size={28} color="#333" style={{ margin: '0 auto 14px' }} />
          <h3 style={{ fontSize: 16, fontWeight: 600, color: '#E0E0E0', marginBottom: 6 }}>No Flashcards Yet</h3>
          <p style={{ fontSize: 13.5, color: '#555', marginBottom: 20 }}>Generate AI flashcards from your document.</p>
          <button onClick={generate} className="btn btn-primary" style={{ margin: '0 auto' }}><Sparkles size={13} /> Generate Flashcards</button>
        </div>
      )}
    </div>
  )
}
