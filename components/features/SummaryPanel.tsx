// FILE LOCATION: components/features/SummaryPanel.tsx
'use client'

import { useState, useEffect } from 'react'
import { useApp } from '@/app/(dashboard)/dashboard/layout'
import { createClient } from '@/lib/supabase'
import { FileText, Sparkles, RefreshCw, Copy, Check, AlertCircle } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

export function SummaryPanel() {
  const { activeDoc, refreshDocuments } = useApp()
  const [summary, setSummary]   = useState(activeDoc?.summary || '')
  const [loading, setLoading]   = useState(false)
  const [copied, setCopied]     = useState(false)
  const [error, setError]       = useState('')

  useEffect(() => { setSummary(activeDoc?.summary || ''); setError('') }, [activeDoc?.id, activeDoc?.summary])

  const generate = async () => {
    if (!activeDoc) return
    setLoading(true); setError('')
    try {
      const res  = await fetch('/api/ai', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'summarize', content: activeDoc.content }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      await createClient().from('documents').update({ summary: data.result }).eq('id', activeDoc.id)
      setSummary(data.result)
      await refreshDocuments()
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Failed') }
    finally { setLoading(false) }
  }

  const copy = async () => { await navigator.clipboard.writeText(summary); setCopied(true); setTimeout(() => setCopied(false), 2000) }

  if (!activeDoc) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', textAlign: 'center' }}>
      <FileText size={32} color="#333" style={{ marginBottom: 12 }} />
      <p style={{ color: '#555', fontSize: 14 }}>Select a document to generate a summary</p>
    </div>
  )

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }} className="fade-up">

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#F2F2F2', letterSpacing: '-0.4px', marginBottom: 3 }}>AI Summary</h1>
          <p style={{ fontSize: 13, color: '#555', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 360 }}>{activeDoc.title}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {summary && (
            <button onClick={copy} className="btn btn-secondary">
              {copied ? <Check size={13} /> : <Copy size={13} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          )}
          <button onClick={generate} disabled={loading} className="btn btn-primary">
            {loading
              ? <span style={{ width: 13, height: 13, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%' }} className="spin" />
              : summary ? <RefreshCw size={13} /> : <Sparkles size={13} />}
            {loading ? 'Generating…' : summary ? 'Regenerate' : 'Generate Summary'}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{ display: 'flex', gap: 9, padding: '10px 14px', borderRadius: 8, marginBottom: 16, background: 'rgba(248,113,113,0.07)', border: '1px solid rgba(248,113,113,0.18)', color: '#F87171', fontSize: 13 }}>
          <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} /> {error}
        </div>
      )}

      {/* Loading skeleton */}
      {loading ? (
        <div className="card" style={{ padding: 24 }}>
          {[90,70,85,55,75,65].map((w, i) => (
            <div key={i} className="shimmer" style={{ height: 14, borderRadius: 6, marginBottom: 10, width: `${w}%` }} />
          ))}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16, paddingTop: 16, borderTop: '1px solid #1E1E1E', color: '#555', fontSize: 13 }}>
            <span style={{ width: 14, height: 14, border: '2px solid #333', borderTopColor: '#4F8EF7', borderRadius: '50%' }} className="spin" />
            AI is reading your document…
          </div>
        </div>

      ) : summary ? (
        <div className="card prose-ai" style={{ padding: 24 }}>
          <ReactMarkdown>{summary}</ReactMarkdown>
        </div>

      ) : (
        <div className="card" style={{ padding: '56px 32px', textAlign: 'center', borderStyle: 'dashed' }}>
          <Sparkles size={28} color="#333" style={{ margin: '0 auto 14px' }} />
          <h3 style={{ fontSize: 16, fontWeight: 600, color: '#E0E0E0', marginBottom: 6 }}>Ready to Summarise</h3>
          <p style={{ fontSize: 13.5, color: '#555', marginBottom: 20 }}>Generate a structured summary with key concepts and main points.</p>
          <button onClick={generate} className="btn btn-primary" style={{ margin: '0 auto' }}>
            <Sparkles size={13} /> Generate Summary
          </button>
        </div>
      )}

      {/* Meta */}
      {!loading && (
        <p style={{ fontSize: 12, color: '#444', marginTop: 12 }}>
          {activeDoc.content.split(/\s+/).length.toLocaleString()} words · {(activeDoc.file_size / 1024).toFixed(0)} KB · {new Date(activeDoc.created_at).toLocaleDateString()}
        </p>
      )}
    </div>
  )
}
