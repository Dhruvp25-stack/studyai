'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { useApp } from '@/app/(dashboard)/dashboard/layout'
import { createClient } from '@/lib/supabase'
import { Upload, FileText, CheckCircle, AlertCircle, Zap, X } from 'lucide-react'

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
    setProgressLabel('Reading PDF...')

    try {
      // Upload to our extraction API
      const formData = new FormData()
      formData.append('file', file)

      setProgress(30)
      setProgressLabel('Extracting text...')

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
      setProgressLabel('Saving to workspace...')

      // Save to Supabase
      const supabase = createClient()
      const title = fileName.replace('.pdf', '').replace(/_/g, ' ').replace(/-/g, ' ')

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
      setProgressLabel('Done!')

      await refreshDocuments()
      setActiveDoc(data as Parameters<typeof setActiveDoc>[0])
      setSuccess(warning
        ? `"${title}" uploaded with limited text extraction.`
        : `"${title}" uploaded! Ready to study.`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
      setTimeout(() => setProgress(0), 1000)
    }
  }

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted[0]) processFile(accepted[0])
  }, [user])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    disabled: uploading,
  })

  return (
    <div className="max-w-3xl mx-auto animate-fade-in-up">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-lg bg-[#00FF88]/15 flex items-center justify-center">
            <Upload size={16} className="text-[#00FF88]" />
          </div>
          <h1 className="font-display font-bold text-2xl text-white">Upload Document</h1>
        </div>
        <p className="text-[#9090D0]">Upload a PDF to unlock AI-powered study tools</p>
      </div>

      {/* Drop zone */}
      <div
        {...getRootProps()}
        className={`upload-zone p-12 text-center cursor-pointer mb-6 ${isDragActive ? 'drag-over' : ''} ${uploading ? 'cursor-not-allowed opacity-70' : ''}`}
      >
        <input {...getInputProps()} />

        {uploading ? (
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto">
              <div className="w-full h-full border-3 border-t-transparent border-[#00FF88] rounded-full animate-spin" style={{ borderWidth: '3px' }} />
            </div>
            <div>
              <p className="text-white font-medium mb-3">{progressLabel}</p>
              <div className="progress-bar h-2 max-w-xs mx-auto">
                <div className="progress-fill h-full" style={{ width: `${progress}%` }} />
              </div>
              <p className="text-[#9090D0] text-sm mt-2">{progress}%</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-[#00FF88]/10 flex items-center justify-center border border-[#00FF88]/20">
              <Upload size={28} className="text-[#00FF88]" />
            </div>
            <div>
              <p className="text-white font-medium text-lg mb-1">
                {isDragActive ? 'Drop your PDF here' : 'Drag & drop your PDF'}
              </p>
              <p className="text-[#9090D0] text-sm">or click to browse — max 10MB</p>
            </div>
            <div className="flex items-center justify-center gap-4 text-xs text-[#6060A0]">
              <span className="flex items-center gap-1"><FileText size={12} /> PDF only</span>
              <span>•</span>
              <span className="flex items-center gap-1"><Zap size={12} /> Instant extraction</span>
              <span>•</span>
              <span className="flex items-center gap-1"><CheckCircle size={12} /> Secure</span>
            </div>
          </div>
        )}
      </div>

      {/* Status messages */}
      {error && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 mb-4">
          <AlertCircle size={16} />
          <span className="text-sm flex-1">{error}</span>
          <button onClick={() => setError('')}><X size={14} /></button>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#00FF88]/10 border border-[#00FF88]/20 text-[#00FF88] mb-4">
          <CheckCircle size={16} />
          <span className="text-sm flex-1">{success}</span>
          <button onClick={() => setSuccess('')}><X size={14} /></button>
        </div>
      )}

      {/* Recent documents */}
      {documents.length > 0 && (
        <div>
          <h3 className="font-display font-semibold text-white mb-3 text-sm uppercase tracking-wider text-[#6060A0]">
            Recent Documents
          </h3>
          <div className="grid gap-3">
            {documents.slice(0, 5).map(doc => (
              <div
                key={doc.id}
                onClick={() => setActiveDoc(doc)}
                className="card p-4 cursor-pointer flex items-center gap-4 glass-hover"
              >
                <div className="w-10 h-10 rounded-xl bg-[#0088FF]/10 flex items-center justify-center flex-shrink-0">
                  <FileText size={18} className="text-[#0088FF]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium text-sm truncate">{doc.title}</p>
                  <p className="text-[#9090D0] text-xs mt-0.5">
                    {(doc.file_size / 1024).toFixed(0)}KB · {new Date(doc.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {doc.summary && (
                    <span className="px-2 py-0.5 rounded-full bg-[#00FF88]/10 text-[#00FF88] text-xs border border-[#00FF88]/20">
                      Summarized
                    </span>
                  )}
                  <Zap size={14} className="text-[#00FF88]" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="mt-8 grid grid-cols-2 gap-4">
        {[
          ['📄', 'Best Results', 'Text-based PDFs work best. Scanned images have limited extraction.'],
          ['⚡', 'Instant AI', 'Once uploaded, get summaries, flashcards, and quizzes in seconds.'],
        ].map(([emoji, title, desc]) => (
          <div key={title} className="glass rounded-xl p-4">
            <div className="text-2xl mb-2">{emoji}</div>
            <p className="text-white font-medium text-sm mb-1">{title}</p>
            <p className="text-[#9090D0] text-xs">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
