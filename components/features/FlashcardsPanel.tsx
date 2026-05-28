'use client'

import { useState, useEffect } from 'react'
import { useApp } from '@/app/(dashboard)/dashboard/layout'
import { createClient } from '@/lib/supabase'
import type { Flashcard } from '@/types'
import { Layers, Sparkles, ChevronLeft, ChevronRight, RotateCcw, Shuffle, AlertCircle } from 'lucide-react'

const AMBER = '#FFB830'
const AMBER_DIM = 'rgba(255,184,48,0.08)'
const AMBER_BORDER = 'rgba(255,184,48,0.18)'

export function FlashcardsPanel() {
  const { activeDoc, user } = useApp()
  const [cards, setCards] = useState<Flashcard[]>([])
  const [current, setCurrent] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (activeDoc) loadCards()
    setFlipped(false)
    setCurrent(0)
  }, [activeDoc?.id]) // eslint-disable-line

  const loadCards = async () => {
    if (!activeDoc) return
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('flashcards')
      .select('*')
      .eq('document_id', activeDoc.id)
      .order('created_at')
    if (data) setCards(data as Flashcard[])
    setLoading(false)
  }

  const generateCards = async () => {
    if (!activeDoc) return
    setGenerating(true)
    setError('')
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'flashcards', content: activeDoc.content }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      const supabase = createClient()
      await supabase.from('flashcards').delete().eq('document_id', activeDoc.id)

      const toInsert = data.result.map((card: { front: string; back: string }) => ({
        document_id: activeDoc.id,
        user_id: user!.id,
        front: card.front,
        back: card.back,
      }))
      const { data: inserted } = await supabase.from('flashcards').insert(toInsert).select()
      if (inserted) setCards(inserted as Flashcard[])
      setCurrent(0)
      setFlipped(false)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to generate flashcards')
    } finally {
      setGenerating(false)
    }
  }

  const shuffle = () => {
    setCards(prev => [...prev].sort(() => Math.random() - 0.5))
    setCurrent(0)
    setFlipped(false)
  }

  const next = () => { setCurrent(p => Math.min(p + 1, cards.length - 1)); setFlipped(false) }
  const prev = () => { setCurrent(p => Math.max(p - 1, 0)); setFlipped(false) }

  if (!activeDoc) {
    return (
      <div className="flex flex-col items-center justify-center py-28 text-center animate-fade-in">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
          style={{ background: AMBER_DIM, border: `1px solid ${AMBER_BORDER}` }}>
          <Layers size={26} style={{ color: AMBER }} />
        </div>
        <h2 className="font-display text-2xl text-[--text-primary] mb-2">No Document Selected</h2>
        <p className="text-[--text-secondary] text-sm">Upload or select a document to create flashcards</p>
      </div>
    )
  }

  const busy = loading || generating

  return (
    <div className="max-w-2xl mx-auto animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-7">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: AMBER_DIM, border: `1px solid ${AMBER_BORDER}` }}>
            <Layers size={16} style={{ color: AMBER }} />
          </div>
          <div>
            <h1 className="font-display text-3xl text-[--text-primary] leading-none mt-0.5">Flashcards</h1>
            {cards.length > 0 && (
              <p className="text-[--text-secondary] text-xs mt-0.5">
                {cards.length} cards · {activeDoc.title}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {cards.length > 1 && (
            <button onClick={shuffle} className="btn-secondary flex items-center gap-2 text-sm py-2 px-3">
              <Shuffle size={13} /> Shuffle
            </button>
          )}
          <button
            onClick={generateCards}
            disabled={busy}
            className="btn-primary flex items-center gap-2 text-sm py-2 px-4"
            style={{ background: `linear-gradient(135deg, ${AMBER}, #FF9500)` }}
          >
            {generating
              ? <span className="w-3.5 h-3.5 border-2 border-t-transparent border-[#03030A] rounded-full animate-spin" />
              : <Sparkles size={13} />}
            {generating ? 'Generating…' : cards.length > 0 ? 'Regenerate' : 'Generate Cards'}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 mb-5 px-4 py-3 rounded-xl
          bg-[--accent-rose]/8 border border-[--accent-rose]/20 text-[--accent-rose] text-sm">
          <AlertCircle size={14} className="flex-shrink-0" /> {error}
        </div>
      )}

      {/* Loading */}
      {busy ? (
        <div className="card p-10 text-center">
          <div className="w-12 h-12 rounded-full border-2 border-t-transparent animate-spin mx-auto mb-4"
            style={{ borderColor: `${AMBER} transparent transparent transparent` }} />
          <p className="text-[--text-secondary] text-sm">
            {generating ? 'Creating flashcards with Gemini AI…' : 'Loading flashcards…'}
          </p>
        </div>

      ) : cards.length > 0 ? (
        <>
          {/* Progress bar */}
          <div className="flex items-center gap-3 mb-5">
            <div className="progress-bar flex-1 h-1">
              <div
                className="progress-fill h-full transition-all duration-500"
                style={{
                  width: `${((current + 1) / cards.length) * 100}%`,
                  background: `linear-gradient(90deg, ${AMBER}, #FF9500)`,
                }}
              />
            </div>
            <span className="text-[--text-muted] text-xs font-mono tabular-nums">
              {current + 1} / {cards.length}
            </span>
          </div>

          {/* Card */}
          <div className="perspective mb-6" style={{ height: '260px' }}>
            <div
              className="relative w-full h-full cursor-pointer"
              style={{
                transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                transition: 'transform 0.55s cubic-bezier(0.4,0,0.2,1)',
                transformStyle: 'preserve-3d',
              }}
              onClick={() => setFlipped(f => !f)}
            >
              {/* Front */}
              <div
                className="absolute inset-0 card flex flex-col items-center justify-center p-8 text-center"
                style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
              >
                <span className="absolute top-4 left-4 text-[10px] font-semibold tracking-widest uppercase
                  px-2.5 py-1 rounded-full"
                  style={{ background: AMBER_DIM, color: AMBER, border: `1px solid ${AMBER_BORDER}` }}>
                  Question
                </span>
                <p className="font-display text-xl text-[--text-primary] leading-relaxed">
                  {cards[current]?.front}
                </p>
                <p className="text-[--text-muted] text-xs mt-5">Tap to reveal answer</p>
              </div>

              {/* Back */}
              <div
                className="absolute inset-0 rounded-[--radius-lg] flex flex-col items-center justify-center p-8 text-center"
                style={{
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)',
                  background: `linear-gradient(135deg, ${AMBER_DIM}, rgba(255,149,0,0.04))`,
                  border: `1px solid ${AMBER_BORDER}`,
                }}
              >
                <span className="absolute top-4 left-4 text-[10px] font-semibold tracking-widest uppercase
                  px-2.5 py-1 rounded-full"
                  style={{ background: AMBER_DIM, color: AMBER, border: `1px solid ${AMBER_BORDER}` }}>
                  Answer
                </span>
                <p className="text-[--text-primary] text-lg leading-relaxed">
                  {cards[current]?.back}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={prev}
              disabled={current === 0}
              className="btn-secondary flex items-center gap-2 py-2 px-4 disabled:opacity-25"
            >
              <ChevronLeft size={15} /> Prev
            </button>
            <button
              onClick={() => setFlipped(f => !f)}
              className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-xl transition-colors"
              style={{ color: AMBER }}
            >
              <RotateCcw size={13} /> Flip
            </button>
            <button
              onClick={next}
              disabled={current === cards.length - 1}
              className="btn-secondary flex items-center gap-2 py-2 px-4 disabled:opacity-25"
            >
              Next <ChevronRight size={15} />
            </button>
          </div>

          {/* Card list */}
          <div>
            <h3 className="text-[10px] font-semibold tracking-widest uppercase text-[--text-muted] mb-3 px-1">
              All Cards
            </h3>
            <div className="grid gap-1.5">
              {cards.map((card, i) => (
                <div
                  key={card.id}
                  onClick={() => { setCurrent(i); setFlipped(false) }}
                  className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all"
                  style={i === current
                    ? { background: AMBER_DIM, border: `1px solid ${AMBER_BORDER}` }
                    : { background: 'transparent', border: '1px solid transparent' }}
                >
                  <span
                    className="text-xs font-mono font-bold w-5 flex-shrink-0 tabular-nums"
                    style={{ color: AMBER }}
                  >
                    {i + 1}
                  </span>
                  <p className="text-[--text-secondary] text-sm truncate">{card.front}</p>
                </div>
              ))}
            </div>
          </div>
        </>

      ) : (
        /* Empty state */
        <div className="card p-12 text-center border-dashed">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
            style={{ background: AMBER_DIM, border: `1px solid ${AMBER_BORDER}` }}>
            <Layers size={24} style={{ color: AMBER }} />
          </div>
          <h3 className="font-display text-xl text-[--text-primary] mb-2">No Flashcards Yet</h3>
          <p className="text-[--text-secondary] text-sm mb-6">Generate AI-powered flashcards from your document.</p>
          <button
            onClick={generateCards}
            className="btn-primary mx-auto inline-flex items-center gap-2"
            style={{ background: `linear-gradient(135deg, ${AMBER}, #FF9500)` }}
          >
            <Sparkles size={15} /> Generate Flashcards
          </button>
        </div>
      )}
    </div>
  )
}
