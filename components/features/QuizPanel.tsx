// FILE LOCATION: components/features/QuizPanel.tsx
'use client'

import { useState, useEffect } from 'react'
import { useApp } from '@/app/(dashboard)/dashboard/layout'
import { createClient } from '@/lib/supabase'
import type { QuizQuestion } from '@/types'
import { HelpCircle, Sparkles, CheckCircle, XCircle, Trophy, RefreshCw, AlertCircle } from 'lucide-react'

export function QuizPanel() {
  const { activeDoc, user } = useApp()
  const [questions, setQuestions]   = useState<QuizQuestion[]>([])
  const [current, setCurrent]       = useState(0)
  const [selected, setSelected]     = useState<number | null>(null)
  const [answers, setAnswers]       = useState<(number | null)[]>([])
  const [showResult, setShowResult] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')
  const [done, setDone]             = useState(false)

  useEffect(() => { if (activeDoc) loadQ(); reset() }, [activeDoc?.id]) // eslint-disable-line

  const reset = () => { setCurrent(0); setSelected(null); setAnswers([]); setShowResult(false); setDone(false) }

  const loadQ = async () => {
    if (!activeDoc) return
    setLoading(true)
    const { data } = await createClient().from('quiz_questions').select('*').eq('document_id', activeDoc.id).order('created_at')
    if (data?.length) { setQuestions(data as QuizQuestion[]); setAnswers(new Array(data.length).fill(null)) }
    setLoading(false)
  }

  const generate = async () => {
    if (!activeDoc) return
    setGenerating(true); setError(''); reset()
    try {
      const res  = await fetch('/api/ai', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'quiz', content: activeDoc.content }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      const sb = createClient()
      await sb.from('quiz_questions').delete().eq('document_id', activeDoc.id)
      const { data: ins } = await sb.from('quiz_questions').insert(data.result.map((q: Omit<QuizQuestion, 'id' | 'document_id' | 'user_id' | 'created_at'>) => ({ document_id: activeDoc.id, user_id: user!.id, ...q }))).select()
      if (ins) { setQuestions(ins as QuizQuestion[]); setAnswers(new Array(ins.length).fill(null)) }
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Failed') }
    finally { setGenerating(false) }
  }

  const answer = (i: number) => {
    if (selected !== null) return
    setSelected(i); setShowResult(true)
    const a = [...answers]; a[current] = i; setAnswers(a)
  }

  const next = () => {
    if (current === questions.length - 1) { setDone(true); return }
    const n = current + 1; setCurrent(n); setSelected(answers[n]); setShowResult(answers[n] !== null)
  }

  const score = answers.filter((a, i) => a === questions[i]?.correct_answer).length

  if (!activeDoc) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', textAlign: 'center' }}>
      <HelpCircle size={32} color="#333" style={{ marginBottom: 12 }} />
      <p style={{ color: '#555', fontSize: 14 }}>Select a document to take a quiz</p>
    </div>
  )

  /* Results */
  if (done) {
    const pct = Math.round((score / questions.length) * 100)
    const col = pct >= 80 ? '#6EE7B7' : pct >= 60 ? '#FBBF24' : '#F87171'
    return (
      <div style={{ maxWidth: 520, margin: '0 auto' }} className="fade-up">
        <div className="card" style={{ padding: '40px 32px', textAlign: 'center', marginBottom: 16 }}>
          <div style={{ width: 60, height: 60, borderRadius: '50%', background: col + '18', border: `2px solid ${col}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Trophy size={26} color={col} />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#F2F2F2', marginBottom: 6 }}>Quiz Complete!</h2>
          <p style={{ fontSize: 13, color: '#555', marginBottom: 20 }}>You answered {score} of {questions.length} correctly</p>
          <div style={{ fontSize: 52, fontWeight: 800, color: col, marginBottom: 8, letterSpacing: '-2px' }}>{pct}%</div>
          <p style={{ fontSize: 13, color: '#555', marginBottom: 24 }}>
            {pct >= 80 ? '🎉 Excellent work!' : pct >= 60 ? '👍 Good job, keep going!' : '📚 Keep studying!'}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 24 }}>
            {[['Correct', score, '#6EE7B7'], ['Wrong', questions.length - score, '#F87171'], ['Total', questions.length, '#666']].map(([l, v, c]) => (
              <div key={l as string} className="card" style={{ padding: '12px 8px', textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: c as string }}>{v as number}</div>
                <div style={{ fontSize: 11, color: '#555' }}>{l as string}</div>
              </div>
            ))}
          </div>
          <button onClick={reset} className="btn btn-secondary" style={{ margin: '0 auto' }}><RefreshCw size={13} /> Retake</button>
        </div>
        <p style={{ fontSize: 11, fontWeight: 600, color: '#444', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Review</p>
        {questions.map((q, i) => {
          const ok = answers[i] === q.correct_answer
          return (
            <div key={q.id} className="card" style={{ padding: '12px 16px', marginBottom: 8, borderColor: ok ? 'rgba(110,231,183,0.2)' : 'rgba(248,113,113,0.2)' }}>
              <div style={{ display: 'flex', gap: 10 }}>
                {ok ? <CheckCircle size={14} color="#6EE7B7" style={{ flexShrink: 0, marginTop: 2 }} /> : <XCircle size={14} color="#F87171" style={{ flexShrink: 0, marginTop: 2 }} />}
                <div>
                  <p style={{ fontSize: 13, color: '#E0E0E0', marginBottom: 4 }}>{q.question}</p>
                  <p style={{ fontSize: 12, color: '#6EE7B7' }}>✓ {q.options[q.correct_answer]}</p>
                  {!ok && answers[i] !== null && <p style={{ fontSize: 12, color: '#F87171' }}>✗ {q.options[answers[i]!]}</p>}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  const busy = loading || generating

  return (
    <div style={{ maxWidth: 520, margin: '0 auto' }} className="fade-up">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#F2F2F2', letterSpacing: '-0.4px' }}>Quiz Mode</h1>
        <button onClick={generate} disabled={busy} className="btn btn-primary">
          {generating ? <span style={{ width: 13, height: 13, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%' }} className="spin" /> : <Sparkles size={13} />}
          {generating ? 'Generating…' : questions.length ? 'New Quiz' : 'Generate Quiz'}
        </button>
      </div>

      {error && <div style={{ display: 'flex', gap: 9, padding: '10px 14px', borderRadius: 8, marginBottom: 16, background: 'rgba(248,113,113,0.07)', border: '1px solid rgba(248,113,113,0.18)', color: '#F87171', fontSize: 13 }}><AlertCircle size={14} />{error}</div>}

      {busy ? (
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <div style={{ width: 36, height: 36, border: '3px solid #1E1E1E', borderTopColor: '#4F8EF7', borderRadius: '50%', margin: '0 auto 12px' }} className="spin" />
          <p style={{ color: '#555', fontSize: 13 }}>{generating ? 'Crafting quiz questions…' : 'Loading…'}</p>
        </div>

      ) : questions.length > 0 ? (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <div className="progress-track" style={{ flex: 1, height: 3 }}>
              <div className="progress-fill" style={{ height: '100%', width: `${((current + 1) / questions.length) * 100}%` }} />
            </div>
            <span style={{ fontSize: 12, color: '#555' }}>{current + 1}/{questions.length}</span>
          </div>

          <div className="card" style={{ padding: '20px 22px', marginBottom: 14 }}>
            <span style={{ fontSize: 10, fontWeight: 600, color: '#555', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: 10 }}>Question {current + 1}</span>
            <p style={{ fontSize: 16, fontWeight: 500, color: '#F2F2F2', lineHeight: 1.55 }}>{questions[current]?.question}</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
            {questions[current]?.options.map((opt, i) => {
              let cls = 'quiz-opt'
              if (showResult) {
                if (i === questions[current].correct_answer) cls += ' correct'
                else if (i === selected) cls += ' incorrect'
              }
              return (
                <button key={i} className={cls} onClick={() => answer(i)} disabled={showResult}>
                  <span style={{ fontSize: 11, fontFamily: 'monospace', marginRight: 10, opacity: 0.5 }}>{String.fromCharCode(65+i)}.</span>
                  {opt}
                </button>
              )
            })}
          </div>

          {showResult && (
            <>
              <div style={{ padding: '12px 16px', borderRadius: 9, marginBottom: 14, background: selected === questions[current]?.correct_answer ? 'rgba(110,231,183,0.07)' : 'rgba(248,113,113,0.07)', border: `1px solid ${selected === questions[current]?.correct_answer ? 'rgba(110,231,183,0.2)' : 'rgba(248,113,113,0.2)'}` }} className="fade-in">
                <p style={{ fontSize: 13, fontWeight: 600, color: selected === questions[current]?.correct_answer ? '#6EE7B7' : '#F87171', marginBottom: 4 }}>
                  {selected === questions[current]?.correct_answer ? '✓ Correct!' : '✗ Incorrect'}
                </p>
                <p style={{ fontSize: 13, color: '#888', lineHeight: 1.55 }}>{questions[current]?.explanation}</p>
              </div>
              <button onClick={next} className="btn btn-primary" style={{ width: '100%' }}>
                {current === questions.length - 1 ? 'See Results' : 'Next Question →'}
              </button>
            </>
          )}
        </>

      ) : (
        <div className="card" style={{ padding: '56px 32px', textAlign: 'center', borderStyle: 'dashed' }}>
          <HelpCircle size={28} color="#333" style={{ margin: '0 auto 14px' }} />
          <h3 style={{ fontSize: 16, fontWeight: 600, color: '#E0E0E0', marginBottom: 6 }}>Test Your Knowledge</h3>
          <p style={{ fontSize: 13.5, color: '#555', marginBottom: 20 }}>Generate a quiz to reinforce what you've learned.</p>
          <button onClick={generate} className="btn btn-primary" style={{ margin: '0 auto' }}><Sparkles size={13} /> Generate Quiz</button>
        </div>
      )}
    </div>
  )
}
