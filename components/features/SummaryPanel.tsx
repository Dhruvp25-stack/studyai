'use client'

import { useState, useEffect } from 'react'
import { useApp } from '@/app/(dashboard)/dashboard/layout'
import { createClient } from '@/lib/supabase'
import { FileText, Sparkles, RefreshCw, Copy, CheckCircle, AlertCircle } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

export function SummaryPanel() {
  const { activeDoc, refreshDocuments } = useApp()
  const [summary, setSummary] = useState(activeDoc?.summary || '')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setSummary(activeDoc?.summary || '')
    setError('')
  }, [activeDoc?.id, activeDoc?.summary])

  const generateSummary = async () => {
    if (!activeDoc) return
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'summarize', content: activeDoc.content }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      const supabase = createClient()
      await supabase.from('documents').update({ summary: data.result }).eq('id', activeDoc.id)

      setSummary(data.result)
      await refreshDocuments()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to generate summary')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(summary)
    setCopied(true)
    setTimeout(() => setCopied(false), 2200)
  }

  if (!activeDoc) {
    return (
      <div className="flex flex-col items-center justify-center py-28 text-center animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-[--accent-blue]/10 border border-[--accent-blue]/15
          flex items-center justify-center mb-5">
          <FileText size={26} className="text-[--accent-blue]" />
        </div>
        <h2 className="font-display text-2xl text-[--text-primary] mb-2">No Document Selected</h2>
        <p className="text-[--text-secondary] text-sm">Upload or select a document to generate a summary</p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto animate-fade-in-up">
      {/* Header */}
      <div className="flex items-start justify-between mb-7">
        <div>
          <div className="flex items-center gap-3 mb-1.5">
            <div className="w-9 h-9 rounded-xl bg-[--accent-blue]/10 border border-[--accent-blue]/20
              flex items-center justify-center">
              <FileText size={16} className="text-[--accent-blue]" />
            </div>
            <h1 className="font-display text-3xl text-[--text-primary] leading-none mt-0.5">AI Summary</h1>
          </div>
          <p className="text-[--text-secondary] text-sm ml-12 truncate max-w-[340px]">{activeDoc.title}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {summary && (
            <button
              onClick={handleCopy}
              className="btn-secondary flex items-center gap-2 text-sm py-2 px-3"
            >
              {copied
                ? <CheckCircle size={13} className="text-[--accent-green]" />
                : <Copy size={13} />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          )}
          <button
            onClick={generateSummary}
            disabled={loading}
            className="btn-primary flex items-center gap-2 text-sm py-2 px-4"
            style={{ background: 'linear-gradient(135deg, #2D9CFF, #9B59FF)' }}
          >
            {loading
              ? <span className="w-3.5 h-3.5 border-2 border-t-transparent border-[#03030A] rounded-full animate-spin" />
              : summary ? <RefreshCw size={13} /> : <Sparkles size={13} />}
            {loading ? 'Generating…' : summary ? 'Regenerate' : 'Generate Summary'}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 mb-5 px-4 py-3 rounded-xl
          bg-[--accent-rose]/8 border border-[--accent-rose]/20 text-[--accent-rose] text-sm">
          <AlertCircle size={14} className="flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Loading skeleton */}
      {loading ? (
        <div className="card p-7">
          <div className="space-y-3 mb-7">
            {[100, 82, 91, 58, 76, 88, 65].map((w, i) => (
              <div
                key={i}
                className="shimmer h-3.5 rounded-lg"
                style={{ width: `${w}%`, animationDelay: `${i * 0.07}s` }}
              />
            ))}
          </div>
          <div className="flex items-center gap-3 text-[--text-secondary] text-sm pt-4 border-t border-[--border]">
            <div className="w-4 h-4 border-2 border-t-transparent border-[--accent-blue] rounded-full animate-spin" />
            Gemini AI is reading your document…
          </div>
        </div>

      /* Summary content */
      ) : summary ? (
        <div className="card p-7 prose-dark animate-fade-in">
          <ReactMarkdown>{summary}</ReactMarkdown>
        </div>

      /* Empty state */
      ) : (
        <div className="card p-12 text-center border-dashed">
          <div className="w-14 h-14 rounded-2xl bg-[--accent-blue]/10 border border-[--accent-blue]/15
            flex items-center justify-center mx-auto mb-5">
            <Sparkles size={24} className="text-[--accent-blue]" />
          </div>
          <h3 className="font-display text-xl text-[--text-primary] mb-2">Ready to Summarise</h3>
          <p className="text-[--text-secondary] text-sm mb-6 max-w-sm mx-auto">
            Click below to create a structured AI summary with key concepts, main points, and important terms.
          </p>
          <button
            onClick={generateSummary}
            className="btn-primary mx-auto inline-flex items-center gap-2"
            style={{ background: 'linear-gradient(135deg, #2D9CFF, #9B59FF)' }}
          >
            <Sparkles size={15} />
            Generate Summary
          </button>
        </div>
      )}

      {/* Doc metadata */}
      {!loading && (
        <div className="mt-4 flex items-center gap-3 text-xs text-[--text-muted] px-1">
          <span>{activeDoc.content.split(/\s+/).length.toLocaleString()} words</span>
          <span className="opacity-40">·</span>
          <span>{(activeDoc.file_size / 1024).toFixed(0)} KB</span>
          <span className="opacity-40">·</span>
          <span>Uploaded {new Date(activeDoc.created_at).toLocaleDateString()}</span>
        </div>
      )}
    </div>
  )
}
