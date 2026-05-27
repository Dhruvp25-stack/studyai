'use client'

import { useState, useEffect } from 'react'
import { useApp } from '@/app/(dashboard)/dashboard/layout'
import { createClient } from '@/lib/supabase'
import type { Flashcard } from '@/types'
import { Layers, Sparkles, ChevronLeft, ChevronRight, RotateCcw, Shuffle } from 'lucide-react'

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
  }, [activeDoc?.id])

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
      // Delete old cards for this doc
      await supabase.from('flashcards').delete().eq('document_id', activeDoc.id)

      // Insert new cards
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
    const shuffled = [...cards].sort(() => Math.random() - 0.5)
    setCards(shuffled)
    setCurrent(0)
    setFlipped(false)
  }

  const next = () => {
    setCurrent(p => Math.min(p + 1, cards.length - 1))
    setFlipped(false)
  }

  const prev = () => {
    setCurrent(p => Math.max(p - 1, 0))
    setFlipped(false)
  }

  if (!activeDoc) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#FFEE00]/10 flex items-center justify-center mb-4">
          <Layers size={28} className="text-[#FFEE00]" />
        </div>
        <h2 className="font-display font-bold text-xl text-white mb-2">No Document Selected</h2>
        <p className="text-[#9090D0]">Upload or select a document to create flashcards</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#FFEE00]/15 flex items-center justify-center">
            <Layers size={16} className="text-[#FFEE00]" />
          </div>
          <div>
            <h1 className="font-display font-bold text-2xl text-white">Flashcards</h1>
            {cards.length > 0 && (
              <p className="text-[#9090D0] text-xs">{cards.length} cards · {activeDoc.title}</p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {cards.length > 1 && (
            <button onClick={shuffle} className="btn-secondary flex items-center gap-2 text-sm py-2 px-3">
              <Shuffle size={14} />
              Shuffle
            </button>
          )}
          <button
            onClick={generateCards}
            disabled={generating}
            className="btn-primary flex items-center gap-2 text-sm py-2 px-4"
          >
            {generating ? (
              <span className="w-4 h-4 border-2 border-t-transparent border-[#0A0A0F] rounded-full animate-spin" />
            ) : (
              <Sparkles size={14} />
            )}
            {generating ? 'Generating...' : cards.length > 0 ? 'Regenerate' : 'Generate Cards'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      {loading || generating ? (
        <div className="card p-8 text-center">
          <div className="w-12 h-12 border-2 border-t-transparent border-[#FFEE00] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#9090D0]">
            {generating ? 'Creating flashcards with Gemini AI...' : 'Loading flashcards...'}
          </p>
        </div>
      ) : cards.length > 0 ? (
        <>
          {/* Progress */}
          <div className="flex items-center gap-3 mb-4">
            <div className="progress-bar flex-1 h-1.5">
              <div className="progress-fill h-full" style={{ width: `${((current + 1) / cards.length) * 100}%`, background: 'linear-gradient(90deg, #FFEE00, #FFB800)' }} />
            </div>
            <span className="text-[#9090D0] text-xs font-mono whitespace-nowrap">{current + 1} / {cards.length}</span>
          </div>

          {/* Flashcard */}
          <div className="perspective mb-6" style={{ height: '280px' }}>
            <div
              className={`flip-card relative w-full h-full cursor-pointer`}
              style={{ transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)', transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)', transformStyle: 'preserve-3d' }}
              onClick={() => setFlipped(!flipped)}
            >
              {/* Front */}
              <div className="flip-face absolute inset-0 card flex flex-col items-center justify-center p-8 text-center" style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}>
                <div className="absolute top-4 left-4 px-2 py-0.5 rounded-full bg-[#FFEE00]/10 text-[#FFEE00] text-xs border border-[#FFEE00]/20">
                  Question
                </div>
                <p className="font-display font-semibold text-xl text-white leading-relaxed">
                  {cards[current]?.front}
                </p>
                <p className="text-[#6060A0] text-xs mt-4">Click to reveal answer</p>
              </div>

              {/* Back */}
              <div className="flip-face flip-back absolute inset-0 rounded-2xl flex flex-col items-center justify-center p-8 text-center border border-[#FFEE00]/20" style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', background: 'linear-gradient(135deg, rgba(255,238,0,0.06), rgba(255,184,0,0.04))' }}>
                <div className="absolute top-4 left-4 px-2 py-0.5 rounded-full bg-[#FFEE00]/10 text-[#FFEE00] text-xs border border-[#FFEE00]/20">
                  Answer
                </div>
                <p className="font-body text-lg text-[#C0C0E0] leading-relaxed">
                  {cards[current]?.back}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={prev}
              disabled={current === 0}
              className="btn-secondary flex items-center gap-2 py-2 px-4 disabled:opacity-30"
            >
              <ChevronLeft size={16} />
              Previous
            </button>

            <button
              onClick={() => setFlipped(!flipped)}
              className="flex items-center gap-2 text-[#FFEE00] text-sm font-medium px-4 py-2 rounded-lg hover:bg-[#FFEE00]/08 transition-colors"
            >
              <RotateCcw size={14} />
              Flip
            </button>

            <button
              onClick={next}
              disabled={current === cards.length - 1}
              className="btn-secondary flex items-center gap-2 py-2 px-4 disabled:opacity-30"
            >
              Next
              <ChevronRight size={16} />
            </button>
          </div>

          {/* All cards preview */}
          <div className="mt-8">
            <h3 className="text-[#6060A0] text-xs font-semibold uppercase tracking-wider mb-3">All Cards</h3>
            <div className="grid gap-2">
              {cards.map((card, i) => (
                <div
                  key={card.id}
                  onClick={() => { setCurrent(i); setFlipped(false) }}
                  className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all ${i === current ? 'bg-[#FFEE00]/08 border border-[#FFEE00]/20' : 'glass-hover glass'}`}
                >
                  <span className="text-[#FFEE00] text-xs font-mono font-bold mt-0.5 w-5 flex-shrink-0">{i + 1}</span>
                  <p className="text-[#C0C0E0] text-sm truncate">{card.front}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="card p-10 text-center border-dashed">
          <Layers size={32} className="text-[#FFEE00] mx-auto mb-4 opacity-60" />
          <p className="text-[#9090D0] mb-4">No flashcards yet. Generate them from your document!</p>
          <button onClick={generateCards} className="btn-primary mx-auto" style={{ background: 'linear-gradient(135deg, #FFEE00, #FFB800)' }}>
            <Sparkles size={16} className="inline mr-2" />
            Generate Flashcards
          </button>
        </div>
      )}
    </div>
  )
}
