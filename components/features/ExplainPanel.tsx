'use client'

import { useState } from 'react'
import { useApp } from '@/app/(dashboard)/dashboard/layout'
import { Lightbulb, Sparkles, Search } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

export function ExplainPanel() {
  const { activeDoc } = useApp()
  const [explanation, setExplanation] = useState('')
  const [topic, setTopic] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const generate = async () => {
    if (!activeDoc) return
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'explain', content: activeDoc.content, topic: topic || undefined }),
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
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#FF8800]/10 flex items-center justify-center mb-4">
          <Lightbulb size={28} className="text-[#FF8800]" />
        </div>
        <h2 className="font-display font-bold text-xl text-white mb-2">No Document Selected</h2>
        <p className="text-[#9090D0]">Upload or select a document to use Explain Simple mode</p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 rounded-lg bg-[#FF8800]/15 flex items-center justify-center">
          <Lightbulb size={16} className="text-[#FF8800]" />
        </div>
        <h1 className="font-display font-bold text-2xl text-white">Explain Simple</h1>
      </div>
      <p className="text-[#9090D0] mb-6 ml-11">Complex topics explained like you're 12 years old 🧒</p>

      {/* Topic input */}
      <div className="card p-5 mb-6">
        <p className="text-sm text-[#C0C0E0] font-medium mb-3">Specific topic to explain? (optional)</p>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6060A0]" />
            <input
              type="text"
              value={topic}
              onChange={e => setTopic(e.target.value)}
              placeholder="e.g. 'photosynthesis', 'the main argument', 'Chapter 3'"
              className="input-field pl-9"
              onKeyDown={e => e.key === 'Enter' && generate()}
            />
          </div>
          <button
            onClick={generate}
            disabled={loading}
            className="btn-primary flex items-center gap-2 flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #FF8800, #FF6600)' }}
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin" />
            ) : (
              <Sparkles size={14} />
            )}
            {loading ? 'Explaining...' : 'Explain It!'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
      )}

      {loading ? (
        <div className="card p-8">
          <div className="space-y-3 mb-6">
            {[90, 75, 85, 60, 80].map((w, i) => (
              <div key={i} className="shimmer h-4 rounded-lg" style={{ width: `${w}%` }} />
            ))}
          </div>
          <div className="flex items-center gap-3 text-[#9090D0] text-sm">
            <div className="w-4 h-4 border-2 border-t-transparent border-[#FF8800] rounded-full animate-spin" />
            Making it super simple to understand...
          </div>
        </div>
      ) : explanation ? (
        <>
          <div className="px-4 py-2 rounded-xl bg-[#FF8800]/10 border border-[#FF8800]/20 text-[#FF8800] text-sm mb-4 flex items-center gap-2">
            <Lightbulb size={14} />
            Explained in simple terms{topic ? ` — "${topic}"` : ''}
          </div>
          <div className="card p-6 prose-dark">
            <ReactMarkdown>{explanation}</ReactMarkdown>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => { setTopic(''); generate() }}
              className="btn-secondary text-sm py-2"
            >
              Explain the whole document
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
        <div className="card p-10 text-center border-dashed">
          <div className="text-5xl mb-4">🧠</div>
          <p className="text-white font-display font-semibold text-lg mb-2">ELI12 Mode</p>
          <p className="text-[#9090D0] mb-2 max-w-md mx-auto">
            Gemini AI will explain your document using simple language, fun analogies, and real-world examples that anyone can understand.
          </p>
          <div className="flex flex-wrap justify-center gap-2 mt-4 mb-6">
            {['🎯 Simple words', '🔗 Analogies', '🌍 Examples', '🎉 Engaging'].map(tag => (
              <span key={tag} className="px-3 py-1 rounded-full bg-[#FF8800]/10 text-[#FF8800] text-xs border border-[#FF8800]/20">{tag}</span>
            ))}
          </div>
          <button onClick={generate} className="btn-primary mx-auto" style={{ background: 'linear-gradient(135deg, #FF8800, #FF6600)' }}>
            <Lightbulb size={16} className="inline mr-2" />
            Explain This Document Simply
          </button>
        </div>
      )}
    </div>
  )
}
