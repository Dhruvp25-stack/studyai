'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { useApp } from '@/app/(dashboard)/dashboard/layout'
import { createClient } from '@/lib/supabase'
import {
  Upload, FileText, CheckCircle, AlertCircle,
  Zap, X, Shield, Sparkles, BookOpen,
} from 'lucide-react'

export function UploadPanel() {
  const { user, refreshDocuments, setActiveDoc, documents } = useApp()
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [progressLabel, setProgressLabel] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const processFile = async (file: File) => {
    setUploading(true)
    setError('')
    setSuccess('')
    setProgress(10)
    setProgressLabel('Reading PDF…')

    try {
      const formData = new FormData()
      formData.append('file', file)

      setProgress(30)
      setProgressLabel('Extracting text…')

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!uploadRes.ok) {
        const err = await uploadRes.json()
        throw new Error(err.error || 'Upload failed')
      }

      const { text, fileName, fileSize, warning } = await uploadRes.json()

      setProgress(70)
      setProgressLabel('Saving to workspace…')

      const supabase = createClient()
      const title = fileName
        .replace(/\.pdf$/i, '')
        .replace(/_/g, ' ')
        .replace(/-/g, ' ')
        .replace(/\b\w/g, (c: string) => c.toUpperCase())

      const { data, error: dbError } = await supabase
        .from('documents')
        .insert({
          user_id: user!.id,
          title,
          content: text,
          file_name: fileName,
          file_size: fileSize,
          summary: null,
        })
        .select()
        .single()

      if (dbError) throw new Error(dbError.message)

      setProgress(100)
      setProgressLabel('Ready!')

      await refreshDocuments()
      setActiveDoc(data as Parameters<typeof setActiveDoc>[0])
      setSuccess(
        warning
          ? `"${title}" uploaded with limited text extraction.`
          : `"${title}" uploaded and ready to study!`
      )
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
      setTimeout(() => setProgress(0), 1200)
    }
  }

  const onDrop = useCallback(
    (accepted: File[]) => {
      if (accepted[0]) processFile(accepted[0])
    },
    [user] // eslint-disable-line
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    disabled: uploading,
  })

  return (
    <div className="max-w-2xl mx-auto animate-fade-in-up">
      {/* ── Header ──────────────────────────────────────────── */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="relative w-9 h-9 rounded-xl bg-[--accent-green]/10 border border-[--accent-green]/20 flex items-center justify-center">
            <Upload size={16} className="text-[--accent-green]" />
            <span className="pulse-ring absolute inset-0 rounded-xl border border-[--accent-green]/30" />
          </div>
          <h1 className="font-display text-3xl text-[--text-primary] leading-none mt-0.5">
            Upload Document
          </h1>
        </div>
        <p className="text-[--text-secondary] text-sm ml-12">
          Drop a PDF and unlock AI-powered study tools instantly
        </p>
      </div>

      {/* ── Drop zone ─────────────────────────────────────── */}
      <div
        {...getRootProps()}
        className={`upload-zone relative p-10 text-center cursor-pointer mb-5 select-none
          ${isDragActive ? 'drag-over' : ''}
          ${uploading ? 'cursor-not-allowed opacity-60 pointer-events-none' : ''}`}
      >
        <input {...getInputProps()} />

        {uploading ? (
          <div className="space-y-5 py-2">
            {/* Spinner */}
            <div className="relative w-14 h-14 mx-auto">
              <div
                className="absolute inset-0 rounded-full border-2 border-t-[--accent-green] border-[--border-light] animate-spin"
              />
              <div className="absolute inset-2 rounded-full bg-[--accent-green]/8 flex items-center justify-center">
                <Sparkles size={14} className="text-[--accent-green]" />
              </div>
            </div>

            <div>
              <p className="text-[--text-primary] font-medium mb-3 text-sm">{progressLabel}</p>
              <div className="progress-bar h-1.5 max-w-[220px] mx-auto">
                <div className="progress-fill h-full" style={{ width: `${progress}%` }} />
              </div>
              <p className="text-[--text-muted] text-xs mt-2">{progress}%</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            {/* Icon */}
            <div className={`
              w-16 h-16 mx-auto rounded-2xl flex items-center justify-center
              border transition-all duration-200
              ${isDragActive
                ? 'bg-[--accent-green]/15 border-[--accent-green]/50 scale-110'
                : 'bg-[--bg-elevated] border-[--border-light]'}
            `}>
              <Upload
                size={26}
                className={isDragActive ? 'text-[--accent-green]' : 'text-[--text-secondary]'}
              />
            </div>

            <div>
              <p className="text-[--text-primary] font-semibold text-base mb-1">
                {isDragActive ? 'Release to upload' : 'Drag & drop your PDF'}
              </p>
              <p className="text-[--text-secondary] text-sm">
                or{' '}
                <span className="text-[--accent-green] underline underline-offset-2 cursor-pointer">
                  browse files
                </span>
                {' '}— max 10 MB
              </p>
            </div>

            {/* Feature tags */}
            <div className="flex items-center justify-center gap-3 pt-1">
              {[
                { icon: FileText, label: 'PDF only' },
                { icon: Zap,      label: 'Instant extraction' },
                { icon: Shield,   label: 'Secure' },
              ].map(({ icon: Icon, label }) => (
                <span
                  key={label}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full
                    bg-[--bg-elevated] border border-[--border] text-[--text-muted] text-xs"
                >
                  <Icon size={11} />
                  {label}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Status messages ────────────────────────────────── */}
      {error && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl
          bg-[--accent-rose]/8 border border-[--accent-rose]/20
          text-[--accent-rose] mb-4 animate-fade-in">
          <AlertCircle size={15} className="mt-0.5 flex-shrink-0" />
          <span className="text-sm flex-1 leading-snug">{error}</span>
          <button
            onClick={() => setError('')}
            className="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity"
          >
            <X size={13} />
          </button>
        </div>
      )}

      {success && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl
          bg-[--accent-green]/8 border border-[--accent-green]/20
          text-[--accent-green] mb-4 animate-fade-in">
          <CheckCircle size={15} className="mt-0.5 flex-shrink-0" />
          <span className="text-sm flex-1 leading-snug">{success}</span>
          <button
            onClick={() => setSuccess('')}
            className="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity"
          >
            <X size={13} />
          </button>
        </div>
      )}

      {/* ── Recent documents ───────────────────────────────── */}
      {documents.length > 0 && (
        <div className="mt-2">
          <h3 className="text-[11px] font-semibold tracking-widest uppercase
            text-[--text-muted] mb-3 px-1">
            Recent Documents
          </h3>
          <div className="space-y-2">
            {documents.slice(0, 5).map(doc => (
              <div
                key={doc.id}
                onClick={() => setActiveDoc(doc)}
                className="card px-4 py-3 cursor-pointer flex items-center gap-4 glass-hover"
              >
                <div className="w-9 h-9 rounded-xl bg-[--accent-blue]/10 border border-[--accent-blue]/15
                  flex items-center justify-center flex-shrink-0">
                  <BookOpen size={15} className="text-[--accent-blue]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[--text-primary] font-medium text-sm truncate">{doc.title}</p>
                  <p className="text-[--text-muted] text-xs mt-0.5">
                    {(doc.file_size / 1024).toFixed(0)} KB ·{' '}
                    {new Date(doc.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  {doc.summary && (
                    <span className="px-2 py-0.5 rounded-full
                      bg-[--accent-green]/8 border border-[--accent-green]/15
                      text-[--accent-green] text-[11px]">
                      Summarised
                    </span>
                  )}
                  <Zap size={13} className="text-[--text-muted]" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Tips ───────────────────────────────────────────── */}
      <div className="mt-8 grid grid-cols-2 gap-3">
        {([
          {
            icon: FileText,
            color: 'text-[--accent-blue]',
            bg: 'bg-[--accent-blue]/8 border-[--accent-blue]/15',
            title: 'Best Results',
            desc: 'Text-based PDFs work best. Scanned images have limited extraction.',
          },
          {
            icon: Zap,
            color: 'text-[--accent-green]',
            bg: 'bg-[--accent-green]/8 border-[--accent-green]/15',
            title: 'Instant AI',
            desc: 'Once uploaded, get summaries, flashcards, and quizzes in seconds.',
          },
        ] as const).map(({ icon: Icon, color, bg, title, desc }) => (
          <div
            key={title}
            className={`glass rounded-2xl p-4 border ${bg}`}
          >
            <div className={`w-8 h-8 rounded-lg ${bg} border flex items-center justify-center mb-3`}>
              <Icon size={15} className={color} />
            </div>
            <p className="text-[--text-primary] font-semibold text-sm mb-1">{title}</p>
            <p className="text-[--text-secondary] text-xs leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
