// FILE LOCATION: components/features/ExplainPanel.tsx
'use client'

import { useState } from 'react'
import { useApp } from '@/app/(dashboard)/dashboard/layout'
import { Lightbulb, Sparkles, AlertCircle } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

export function ExplainPanel() {
  const { activeDoc }            = useApp()
  const [result, setResult]      = useState('')
  const [topic, setTopic]        = useState('')
  const [loading, setLoading]    = useState(false)
  const [error, setError]        = useState('')

  const generate = async (t?: string) => {
    if (!activeDoc) return
    setLoading(true); setError('')
    try {
      const res  = await fetch('/api/ai', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'explain', content: activeDoc.content, topic: t !== undefined ? t : topic || undefined }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setResult(data.result)
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Failed') }
    finally { setLoading(false) }
  }

  if (!activeDoc) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', textAlign: 'center' }}>
      <Lightbulb size={32} color="#333" style={{ marginBottom: 12 }} />
      <p style={{ color: '#555', fontSize: 14 }}>Select a document to use Explain Simple</p>
    </div>
  )

  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }} className="fade-up">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#F2F2F2', letterSpacing: '-0.4px', marginBottom: 3 }}>Explain Simple</h1>
        <p style={{ fontSize: 13, color: '#555' }}>Complex topics explained in plain language</p>
      </div>

      <div className="card" style={{ padding: '16px 18px', marginBottom: 16 }}>
        <p style={{ fontSize: 13, fontWeight: 500, color: '#888', marginBottom: 10 }}>
          Specific topic? <span style={{ color: '#555', fontWeight: 400 }}>(optional)</span>
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <input
            type="text" value={topic} onChange={e => setTopic(e.target.value)}
            placeholder="e.g. 'photosynthesis', 'main argument', 'Chapter 3'…"
            className="input" style={{ flex: 1 }}
            onKeyDown={e => e.key === 'Enter' && generate()}
          />
          <button onClick={() => generate()} disabled={loading} className="btn btn-primary">
            {loading ? <span style={{ width: 13, height: 13, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%' }} className="spin" /> : <Sparkles size={13} />}
            {loading ? 'Explaining…' : 'Explain'}
          </button>
        </div>
      </div>

      {error && <div style={{ display: 'flex', gap: 9, padding: '10px 14px', borderRadius: 8, marginBottom: 16, background: 'rgba(248,113,113,0.07)', border: '1px solid rgba(248,113,113,0.18)', color: '#F87171', fontSize: 13 }}><AlertCircle size={14} />{error}</div>}

      {loading ? (
        <div className="card" style={{ padding: 24 }}>
          {[85, 70, 90, 60, 75].map((w, i) => <div key={i} className="shimmer" style={{ height: 13, borderRadius: 6, marginBottom: 10, width: `${w}%` }} />)}
        </div>
      ) : result ? (
        <>
          <div className="card prose-ai" style={{ padding: 24 }} >
            <ReactMarkdown>{result}</ReactMarkdown>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button onClick={() => generate('')} className="btn btn-secondary" style={{ fontSize: 12 }}>Explain whole document</button>
            <button onClick={() => setResult('')} className="btn btn-secondary" style={{ fontSize: 12 }}>Clear</button>
          </div>
        </>
      ) : (
        <div className="card" style={{ padding: '56px 32px', textAlign: 'center', borderStyle: 'dashed' }}>
          <div style={{ fontSize: 36, marginBottom: 14 }}>🧠</div>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: '#E0E0E0', marginBottom: 6 }}>ELI12 Mode</h3>
          <p style={{ fontSize: 13.5, color: '#555', marginBottom: 6, maxWidth: 340, margin: '0 auto 20px' }}>Explains your document using simple language, analogies, and real-world examples.</p>
          <button onClick={() => generate()} className="btn btn-primary" style={{ margin: '0 auto' }}><Lightbulb size={13} /> Explain Simply</button>
        </div>
      )}
    </div>
  )
}
