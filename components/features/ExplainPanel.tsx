'use client'

import { useState } from 'react'
import { useApp } from '@/app/(dashboard)/dashboard/layout'
import { Lightbulb, Sparkles, Search, AlertCircle, X } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

const AMBER = '#FF8C42'
const AMBER_DIM = 'rgba(255,140,66,0.08)'
const AMBER_BORDER = 'rgba(255,140,66,0.18)'

export function ExplainPanel() {
  const { activeDoc } = useApp()
  const [explanation, setExplanation] = useState('')
  const [topic, setTopic] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const generate = async (overrideTopic?: string) => {
    if (!activeDoc) return
    setLoading(true)
    setError('')
    const useTopic = overrideTopic !== undefined ? overrideTopic : topic

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'explain',
          content: activeDoc.content,
          topic: useTopic || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setExplanation(data.result)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to generate explanation')
    } finally {
      setLoading(false)
    }
  }

  if (!activeDoc) {
    return (
      <div className="flex flex-col items-center justify-center py-28 text-center animate-fade-in">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
          style={{ background: AMBER_DIM, border: `1px solid ${AMBER_BORDER}` }}>
          <Lightbulb size={26} style={{ color: AMBER }} />
        </div>
        <h2 className="font-display text-2xl text-[--text-primary] mb-2">No Document Selected</h2>
        <p className="text-[--text-secondary] text-sm">Upload or select a document to use Explain Simple</p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center gap-3 mb-1.5">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: AMBER_DIM, border: `1px solid ${AMBER_BORDER}` }}>
          <Lightbulb size={16} style={{ color: AMBER }} />
        </div>
        <h1 className="font-display text-3xl text-[--text-primary] leading-none mt-0.5">Explain Simple</h1>
      </div>
      <p className="text-[--text-secondary] text-sm mb-7 ml-12">
        Complex topics explained like you&apos;re 12 years old 🧒
      </p>

      {/* Topic input card */}
      <div className="card p-5 mb-6">
        <p className="text-[--text-primary] text-sm font-medium mb-3">
          Specific topic to explain?
          <span className="text-[--text-muted] font-normal ml-1">(optional)</span>
        </p>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[--text-muted]" />
            <input
              type="text"
              value={topic}
              onChange={e => setTopic(e.target.value)}
              placeholder="e.g. 'photosynthesis', 'the main argument', 'Chapter 3'…"
              className="input-field pl-9"
              onKeyDown={e => e.key === 'Enter' && generate()}
            />
          </div>
          <button
            onClick={() => generate()}
            disabled={loading}
            className="btn-primary flex items-center gap-2 flex-shrink-0"
            style={{ background: `linear-gradient(135deg, ${AMBER}, #FF6A00)` }}
          >
            {loading
              ? <span className="w-3.5 h-3.5 border-2 border-t-transparent border-[#03030A] rounded-full animate-spin" />
              : <Sparkles size={13} />}
            {loading ? 'Explaining…' : 'Explain It!'}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 mb-5 px-4 py-3 rounded-xl
          bg-[--accent-rose]/8 border border-[--accent-rose]/20 text-[--accent-rose] text-sm">
          <AlertCircle size={14} className="flex-shrink-0" />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError('')} className="opacity-70 hover:opacity-100">
            <X size={13} />
          </button>
        </div>
      )}

      {/* Loading skeleton */}
      {loading ? (
        <div className="card p-7">
          <div className="space-y-3 mb-6">
            {[88, 72, 94, 60, 80, 68].map((w, i) => (
              <div key={i} className="shimmer h-3.5 rounded-lg" style={{ width: `${w}%` }} />
            ))}
          </div>
          <div className="flex items-center gap-3 text-[--text-secondary] text-sm pt-4 border-t border-[--border]">
            <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"
              style={{ borderTopColor: AMBER }} />
            Making it super simple to understand…
          </div>
        </div>

      ) : explanation ? (
        <>
          {/* Topic badge */}
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm mb-4"
            style={{ background: AMBER_DIM, color: AMBER, border: `1px solid ${AMBER_BORDER}` }}
          >
            <Lightbulb size={13} />
            Explained simply{topic ? ` — "${topic}"` : ''}
          </div>

          <div className="card p-7 prose-dark animate-fade-in mb-4">
            <ReactMarkdown>{explanation}</ReactMarkdown>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => generate('')}
              className="btn-secondary text-sm py-2"
            >
              Explain whole document
            </button>
            <button
              onClick={() => setExplanation('')}
              className="btn-secondary text-sm py-2"
            >
              Clear
            </button>
          </div>
        </>

      ) : (
        /* Empty state */
        <div className="card p-12 text-center border-dashed">
          <div className="text-5xl mb-5">🧠</div>
          <h3 className="font-display text-xl text-[--text-primary] mb-2">ELI12 Mode</h3>
          <p className="text-[--text-secondary] text-sm mb-5 max-w-sm mx-auto leading-relaxed">
            Gemini AI will explain your document using simple language, fun analogies, and
            real-world examples that anyone can understand.
          </p>
          <div className="flex flex-wrap justify-center gap-2 mb-7">
            {['🎯 Simple words', '🔗 Analogies', '🌍 Examples', '🎉 Engaging'].map(tag => (
              <span
                key={tag}
                className="px-3 py-1 rounded-full text-xs"
                style={{ background: AMBER_DIM, color: AMBER, border: `1px solid ${AMBER_BORDER}` }}
              >
                {tag}
              </span>
            ))}
          </div>
          <button
            onClick={() => generate()}
            className="btn-primary mx-auto inline-flex items-center gap-2"
            style={{ background: `linear-gradient(135deg, ${AMBER}, #FF6A00)` }}
          >
            <Lightbulb size={15} /> Explain This Document Simply
          </button>
        </div>
      )}
    </div>
  )
}
