'use client'

import { useState, useEffect } from 'react'
import { useApp } from '@/app/(dashboard)/dashboard/layout'
import { createClient } from '@/lib/supabase'
import { FileText, Sparkles, RefreshCw, Copy, CheckCircle } from 'lucide-react'
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

      // Save to DB
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
    setTimeout(() => setCopied(false), 2000)
  }

  if (!activeDoc) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#0088FF]/10 flex items-center justify-center mb-4">
          <FileText size={28} className="text-[#0088FF]" />
        </div>
        <h2 className="font-display font-bold text-xl text-white mb-2">No Document Selected</h2>
        <p className="text-[#9090D0]">Upload or select a document to generate a summary</p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-lg bg-[#0088FF]/15 flex items-center justify-center">
              <FileText size={16} className="text-[#0088FF]" />
            </div>
            <h1 className="font-display font-bold text-2xl text-white">AI Summary</h1>
          </div>
          <p className="text-[#9090D0] text-sm ml-11">{activeDoc.title}</p>
        </div>
        <div className="flex gap-2">
          {summary && (
            <button onClick={handleCopy} className="btn-secondary flex items-center gap-2 text-sm py-2 px-3">
              {copied ? <CheckCircle size={14} className="text-[#00FF88]" /> : <Copy size={14} />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          )}
          <button
            onClick={generateSummary}
            disabled={loading}
            className="btn-primary flex items-center gap-2 text-sm py-2 px-4"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-t-transparent border-[#0A0A0F] rounded-full animate-spin" />
            ) : summary ? (
              <RefreshCw size={14} />
            ) : (
              <Sparkles size={14} />
            )}
            {loading ? 'Generating...' : summary ? 'Regenerate' : 'Generate Summary'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="card p-8">
          <div className="space-y-3">
            {[100, 85, 90, 60, 75, 80].map((w, i) => (
              <div key={i} className={`shimmer h-4 rounded-lg`} style={{ width: `${w}%` }} />
            ))}
          </div>
          <div className="mt-6 flex items-center gap-3 text-[#9090D0] text-sm">
            <div className="w-4 h-4 border-2 border-t-transparent border-[#0088FF] rounded-full animate-spin" />
            Gemini AI is analyzing your document...
          </div>
        </div>
      ) : summary ? (
        <div className="card p-6 prose-dark">
          <ReactMarkdown>{summary}</ReactMarkdown>
        </div>
      ) : (
        <div className="card p-10 text-center border-dashed">
          <Sparkles size={32} className="text-[#0088FF] mx-auto mb-4 opacity-60" />
          <p className="text-[#9090D0] mb-4">Click &quot;Generate Summary&quot; to create an AI-powered summary of your document</p>
          <button onClick={generateSummary} className="btn-primary mx-auto">
            <Sparkles size={16} className="inline mr-2" />
            Generate Summary
          </button>
        </div>
      )}

      {/* Doc info */}
      {!loading && (
        <div className="mt-4 flex gap-3 text-xs text-[#6060A0]">
          <span>{(activeDoc.content.split(/\s+/).length).toLocaleString()} words</span>
          <span>·</span>
          <span>{(activeDoc.file_size / 1024).toFixed(0)} KB</span>
          <span>·</span>
          <span>{new Date(activeDoc.created_at).toLocaleDateString()}</span>
        </div>
      )}
    </div>
  )
}
