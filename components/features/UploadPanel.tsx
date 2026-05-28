// FILE LOCATION: components/features/UploadPanel.tsx
'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { useApp } from '@/app/(dashboard)/dashboard/layout'
import { createClient } from '@/lib/supabase'
import { Upload, FileText, CheckCircle, AlertCircle, X, BookOpen } from 'lucide-react'

export function UploadPanel() {
  const { user, refreshDocuments, setActiveDoc, documents } = useApp()
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress]   = useState(0)
  const [label, setLabel]         = useState('')
  const [error, setError]         = useState('')
  const [success, setSuccess]     = useState('')

  const processFile = async (file: File) => {
    setUploading(true); setError(''); setSuccess('')
    setProgress(10); setLabel('Reading PDF…')

    try {
      const formData = new FormData()
      formData.append('file', file)
      setProgress(35); setLabel('Extracting text…')

      const res  = await fetch('/api/upload', { method: 'POST', body: formData })
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Upload failed') }
      const { text, fileName, fileSize, warning } = await res.json()

      setProgress(75); setLabel('Saving…')

      const supabase = createClient()
      const title = fileName.replace(/\.pdf$/i, '').replace(/[_-]/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())

      const { data, error: dbErr } = await supabase
        .from('documents')
        .insert({ user_id: user!.id, title, content: text, file_name: fileName, file_size: fileSize, summary: null })
        .select().single()

      if (dbErr) throw new Error(dbErr.message)

      setProgress(100); setLabel('Done!')
      await refreshDocuments()
      setActiveDoc(data as Parameters<typeof setActiveDoc>[0])
      setSuccess(warning ? `"${title}" uploaded (limited text extraction).` : `"${title}" uploaded successfully!`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
      setTimeout(() => setProgress(0), 1000)
    }
  }

  const onDrop = useCallback((accepted: File[]) => { if (accepted[0]) processFile(accepted[0]) }, [user]) // eslint-disable-line

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'application/pdf': ['.pdf'] }, maxFiles: 1, disabled: uploading,
  })

  return (
    <div style={{ maxWidth: 560, margin: '0 auto' }} className="fade-up">

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#F2F2F2', letterSpacing: '-0.4px', marginBottom: 4 }}>
          Upload Document
        </h1>
        <p style={{ fontSize: 13.5, color: '#666' }}>
          Upload a PDF to unlock AI-powered study tools
        </p>
      </div>

      {/* Drop zone */}
      <div
        {...getRootProps()}
        className={`upload-zone${isDragActive ? ' drag-over' : ''}`}
        style={{
          padding: '48px 32px', textAlign: 'center', cursor: uploading ? 'not-allowed' : 'pointer',
          opacity: uploading ? 0.6 : 1, marginBottom: 16,
        }}
      >
        <input {...getInputProps()} />

        {uploading ? (
          <div>
            <div style={{
              width: 44, height: 44, border: '3px solid #1E1E1E',
              borderTopColor: '#4F8EF7', borderRadius: '50%', margin: '0 auto 16px',
            }} className="spin" />
            <p style={{ color: '#F2F2F2', fontWeight: 500, fontSize: 14, marginBottom: 12 }}>{label}</p>
            <div className="progress-track" style={{ height: 4, maxWidth: 200, margin: '0 auto' }}>
              <div className="progress-fill" style={{ height: '100%', width: `${progress}%` }} />
            </div>
            <p style={{ color: '#555', fontSize: 12, marginTop: 8 }}>{progress}%</p>
          </div>
        ) : (
          <div>
            <div style={{
              width: 48, height: 48, borderRadius: 12,
              background: isDragActive ? 'rgba(79,142,247,0.12)' : '#181818',
              border: `1px solid ${isDragActive ? 'rgba(79,142,247,0.3)' : '#2A2A2A'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px',
              transition: 'all 0.15s',
            }}>
              <Upload size={22} color={isDragActive ? '#4F8EF7' : '#555'} />
            </div>
            <p style={{ color: '#F2F2F2', fontWeight: 500, fontSize: 14, marginBottom: 6 }}>
              {isDragActive ? 'Release to upload' : 'Drag & drop your PDF'}
            </p>
            <p style={{ color: '#555', fontSize: 13 }}>
              or <span style={{ color: '#4F8EF7' }}>browse files</span> — max 10 MB
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 16 }}>
              {['PDF only', 'Instant extraction', 'Secure'].map(t => (
                <span key={t} style={{ fontSize: 11, color: '#444' }}>· {t}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Alerts */}
      {error && (
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: 10,
          padding: '10px 14px', borderRadius: 9, marginBottom: 12,
          background: 'rgba(248,113,113,0.07)', border: '1px solid rgba(248,113,113,0.18)',
          color: '#F87171', fontSize: 13,
        }} className="fade-in">
          <AlertCircle size={14} style={{ marginTop: 1, flexShrink: 0 }} />
          <span style={{ flex: 1 }}>{error}</span>
          <button onClick={() => setError('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#F87171', opacity: 0.7 }}>
            <X size={13} />
          </button>
        </div>
      )}
      {success && (
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: 10,
          padding: '10px 14px', borderRadius: 9, marginBottom: 12,
          background: 'rgba(110,231,183,0.07)', border: '1px solid rgba(110,231,183,0.18)',
          color: '#6EE7B7', fontSize: 13,
        }} className="fade-in">
          <CheckCircle size={14} style={{ marginTop: 1, flexShrink: 0 }} />
          <span style={{ flex: 1 }}>{success}</span>
          <button onClick={() => setSuccess('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6EE7B7', opacity: 0.7 }}>
            <X size={13} />
          </button>
        </div>
      )}

      {/* Recent docs */}
      {documents.length > 0 && (
        <div style={{ marginTop: 28 }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: '#444', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
            Recent Documents
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {documents.slice(0, 5).map(doc => (
              <div
                key={doc.id}
                onClick={() => setActiveDoc(doc)}
                className="card card-hover"
                style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 12 }}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: 'rgba(79,142,247,0.08)', border: '1px solid rgba(79,142,247,0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <BookOpen size={14} color="#4F8EF7" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13.5, fontWeight: 500, color: '#E0E0E0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {doc.title}
                  </p>
                  <p style={{ fontSize: 11.5, color: '#555', marginTop: 1 }}>
                    {(doc.file_size / 1024).toFixed(0)} KB · {new Date(doc.created_at).toLocaleDateString()}
                  </p>
                </div>
                {doc.summary && (
                  <span className="badge" style={{ color: '#6EE7B7', borderColor: 'rgba(110,231,183,0.2)', background: 'rgba(110,231,183,0.07)' }}>
                    Summarised
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tips */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 24 }}>
        {[
          { icon: FileText, color: '#4F8EF7', title: 'Best Results', desc: 'Text-based PDFs work best. Scanned images have limited extraction.' },
          { icon: Upload,   color: '#6EE7B7', title: 'Instant AI',   desc: 'Once uploaded, get summaries, flashcards, and quizzes in seconds.' },
        ].map(({ icon: Icon, color, title, desc }) => (
          <div key={title} className="card" style={{ padding: '14px' }}>
            <Icon size={15} color={color} style={{ marginBottom: 8 }} />
            <p style={{ fontSize: 13, fontWeight: 600, color: '#E0E0E0', marginBottom: 4 }}>{title}</p>
            <p style={{ fontSize: 12, color: '#555', lineHeight: 1.5 }}>{desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
