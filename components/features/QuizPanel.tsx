'use client'

import { useState, useEffect } from 'react'
import { useApp } from '@/app/(dashboard)/dashboard/layout'
import { createClient } from '@/lib/supabase'
import type { QuizQuestion } from '@/types'
import { HelpCircle, Sparkles, CheckCircle, XCircle, Trophy, RefreshCw, AlertCircle } from 'lucide-react'

const ROSE = '#FF4D7A'
const ROSE_DIM = 'rgba(255,77,122,0.08)'
const ROSE_BORDER = 'rgba(255,77,122,0.18)'

export function QuizPanel() {
  const { activeDoc, user } = useApp()
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [answers, setAnswers] = useState<(number | null)[]>([])
  const [showResult, setShowResult] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [quizDone, setQuizDone] = useState(false)

  useEffect(() => {
    if (activeDoc) loadQuestions()
    resetQuiz()
  }, [activeDoc?.id]) // eslint-disable-line

  const resetQuiz = () => {
    setCurrent(0); setSelected(null)
    setAnswers([]); setShowResult(false); setQuizDone(false)
  }

  const loadQuestions = async () => {
    if (!activeDoc) return
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('quiz_questions').select('*')
      .eq('document_id', activeDoc.id).order('created_at')
    if (data && data.length > 0) {
      setQuestions(data as QuizQuestion[])
      setAnswers(new Array(data.length).fill(null))
    }
    setLoading(false)
  }

  const generateQuiz = async () => {
    if (!activeDoc) return
    setGenerating(true); setError(''); resetQuiz()
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'quiz', content: activeDoc.content }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      const supabase = createClient()
      await supabase.from('quiz_questions').delete().eq('document_id', activeDoc.id)

      const toInsert = data.result.map(
        (q: Omit<QuizQuestion, 'id' | 'document_id' | 'user_id' | 'created_at'>) => ({
          document_id: activeDoc.id,
          user_id: user!.id,
          question: q.question,
          options: q.options,
          correct_answer: q.correct_answer,
          explanation: q.explanation,
        })
      )
      const { data: inserted } = await supabase.from('quiz_questions').insert(toInsert).select()
      if (inserted) {
        setQuestions(inserted as QuizQuestion[])
        setAnswers(new Array(inserted.length).fill(null))
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to generate quiz')
    } finally {
      setGenerating(false)
    }
  }

  const handleAnswer = (idx: number) => {
    if (selected !== null) return
    setSelected(idx)
    const newAnswers = [...answers]
    newAnswers[current] = idx
    setAnswers(newAnswers)
    setShowResult(true)
  }

  const handleNext = () => {
    if (current === questions.length - 1) {
      setQuizDone(true)
    } else {
      const next = current + 1
      setCurrent(next)
      setSelected(answers[next])
      setShowResult(answers[next] !== null)
    }
  }

  const score = answers.filter((a, i) => a === questions[i]?.correct_answer).length

  /* ── No doc ─────────────────────────────────────────────────── */
  if (!activeDoc) {
    return (
      <div className="flex flex-col items-center justify-center py-28 text-center animate-fade-in">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
          style={{ background: ROSE_DIM, border: `1px solid ${ROSE_BORDER}` }}>
          <HelpCircle size={26} style={{ color: ROSE }} />
        </div>
        <h2 className="font-display text-2xl text-[--text-primary] mb-2">No Document Selected</h2>
        <p className="text-[--text-secondary] text-sm">Upload or select a document to take a quiz</p>
      </div>
    )
  }

  /* ── Results screen ─────────────────────────────────────────── */
  if (quizDone) {
    const pct = Math.round((score / questions.length) * 100)
    const accent = pct >= 80 ? '#00E87A' : pct >= 60 ? '#FFB830' : ROSE

    return (
      <div className="max-w-2xl mx-auto animate-fade-in-up">
        <div className="card p-10 text-center mb-6">
          <div
            className="w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6"
            style={{ background: `${accent}18`, border: `2px solid ${accent}30` }}
          >
            <Trophy size={34} style={{ color: accent }} />
          </div>
          <h2 className="font-display text-3xl text-[--text-primary] mb-2">Quiz Complete!</h2>
          <p className="text-[--text-secondary] text-sm mb-6">
            You answered {score} of {questions.length} correctly
          </p>

          <div className="font-display text-6xl font-bold mb-2" style={{ color: accent }}>
            {pct}%
          </div>
          <p className="text-[--text-secondary] text-sm mb-8">
            {pct >= 80
              ? '🎉 Excellent! You really know this material!'
              : pct >= 60
              ? '👍 Good job! Keep reviewing the tough parts.'
              : '📚 Keep studying — practice makes perfect.'}
          </p>

          <div className="grid grid-cols-3 gap-3 mb-8">
            {([
              ['Correct', score, '#00E87A'],
              ['Wrong', questions.length - score, ROSE],
              ['Total', questions.length, 'var(--text-secondary)'],
            ] as const).map(([label, val, color]) => (
              <div key={label} className="glass rounded-xl p-4 border border-[--border]">
                <div className="font-display text-2xl font-bold mb-1" style={{ color }}>
                  {val}
                </div>
                <div className="text-[--text-muted] text-xs">{label}</div>
              </div>
            ))}
          </div>

          <button
            onClick={resetQuiz}
            className="btn-secondary flex items-center gap-2 mx-auto"
          >
            <RefreshCw size={13} /> Retake Quiz
          </button>
        </div>

        {/* Review */}
        <h3 className="text-[10px] font-semibold tracking-widest uppercase text-[--text-muted] mb-3 px-1">
          Answer Review
        </h3>
        <div className="space-y-2">
          {questions.map((q, i) => {
            const correct = answers[i] === q.correct_answer
            return (
              <div
                key={q.id}
                className="card p-4"
                style={{
                  borderColor: correct ? 'rgba(0,232,122,0.18)' : 'rgba(255,77,122,0.18)',
                  background: correct ? 'rgba(0,232,122,0.04)' : 'rgba(255,77,122,0.04)',
                }}
              >
                <div className="flex items-start gap-3">
                  {correct
                    ? <CheckCircle size={15} className="text-[--accent-green] mt-0.5 flex-shrink-0" />
                    : <XCircle   size={15} style={{ color: ROSE }}              className="mt-0.5 flex-shrink-0" />}
                  <div className="min-w-0">
                    <p className="text-[--text-primary] text-sm mb-1.5">{q.question}</p>
                    <p className="text-[--accent-green] text-xs">✓ {q.options[q.correct_answer]}</p>
                    {!correct && answers[i] !== null && (
                      <p className="text-xs mt-0.5" style={{ color: ROSE }}>
                        ✗ You chose: {q.options[answers[i]!]}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const busy = loading || generating

  /* ── Main quiz ──────────────────────────────────────────────── */
  return (
    <div className="max-w-2xl mx-auto animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-7">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: ROSE_DIM, border: `1px solid ${ROSE_BORDER}` }}>
            <HelpCircle size={16} style={{ color: ROSE }} />
          </div>
          <h1 className="font-display text-3xl text-[--text-primary] leading-none mt-0.5">Quiz Mode</h1>
        </div>
        <button
          onClick={generateQuiz}
          disabled={busy}
          className="btn-primary flex items-center gap-2 text-sm py-2 px-4"
          style={{ background: `linear-gradient(135deg, ${ROSE}, #CC003D)` }}
        >
          {generating
            ? <span className="w-3.5 h-3.5 border-2 border-t-transparent border-white rounded-full animate-spin" />
            : <Sparkles size={13} />}
          {generating ? 'Generating…' : questions.length > 0 ? 'New Quiz' : 'Generate Quiz'}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 mb-5 px-4 py-3 rounded-xl
          bg-[--accent-rose]/8 border border-[--accent-rose]/20 text-[--accent-rose] text-sm">
          <AlertCircle size={14} className="flex-shrink-0" /> {error}
        </div>
      )}

      {/* Loading */}
      {busy ? (
        <div className="card p-10 text-center">
          <div className="w-12 h-12 rounded-full border-2 border-t-transparent animate-spin mx-auto mb-4"
            style={{ borderColor: `${ROSE} transparent transparent transparent` }} />
          <p className="text-[--text-secondary] text-sm">
            {generating ? 'Crafting quiz questions with Gemini AI…' : 'Loading…'}
          </p>
        </div>

      ) : questions.length > 0 ? (
        <>
          {/* Progress */}
          <div className="flex items-center gap-3 mb-6">
            <div className="progress-bar flex-1 h-1">
              <div
                className="progress-fill h-full transition-all duration-500"
                style={{
                  width: `${((current + 1) / questions.length) * 100}%`,
                  background: `linear-gradient(90deg, ${ROSE}, #CC003D)`,
                }}
              />
            </div>
            <span className="text-[--text-muted] text-xs font-mono tabular-nums">
              {current + 1}/{questions.length}
            </span>
          </div>

          {/* Question card */}
          <div className="card p-6 mb-4">
            <span
              className="inline-block text-[10px] font-semibold tracking-widest uppercase
                px-2.5 py-1 rounded-full mb-4"
              style={{ background: ROSE_DIM, color: ROSE, border: `1px solid ${ROSE_BORDER}` }}
            >
              Question {current + 1}
            </span>
            <p className="font-display text-xl text-[--text-primary] leading-relaxed">
              {questions[current]?.question}
            </p>
          </div>

          {/* Options */}
          <div className="space-y-2.5 mb-5">
            {questions[current]?.options.map((opt, i) => {
              let cls = 'quiz-option'
              if (showResult) {
                if (i === questions[current].correct_answer) cls += ' correct'
                else if (i === selected) cls += ' incorrect'
              }
              return (
                <button key={i} className={cls} onClick={() => handleAnswer(i)} disabled={showResult}>
                  <span className="font-mono text-xs mr-3 opacity-50">
                    {String.fromCharCode(65 + i)}.
                  </span>
                  {opt}
                </button>
              )
            })}
          </div>

          {/* Explanation */}
          {showResult && (
            <div
              className="p-4 rounded-xl mb-5 animate-fade-in"
              style={
                selected === questions[current]?.correct_answer
                  ? { background: 'rgba(0,232,122,0.07)', border: '1px solid rgba(0,232,122,0.18)' }
                  : { background: 'rgba(255,77,122,0.07)', border: `1px solid ${ROSE_BORDER}` }
              }
            >
              <div className="flex items-center gap-2 mb-2">
                {selected === questions[current]?.correct_answer
                  ? <CheckCircle size={14} className="text-[--accent-green]" />
                  : <XCircle     size={14} style={{ color: ROSE }} />}
                <span
                  className="text-sm font-semibold"
                  style={{
                    color: selected === questions[current]?.correct_answer
                      ? 'var(--accent-green)' : ROSE,
                  }}
                >
                  {selected === questions[current]?.correct_answer ? 'Correct!' : 'Incorrect'}
                </span>
              </div>
              <p className="text-[--text-secondary] text-sm leading-relaxed">
                {questions[current]?.explanation}
              </p>
            </div>
          )}

          {showResult && (
            <button
              onClick={handleNext}
              className="btn-primary w-full"
              style={{ background: `linear-gradient(135deg, ${ROSE}, #CC003D)` }}
            >
              {current === questions.length - 1 ? 'See Results' : 'Next Question →'}
            </button>
          )}
        </>

      ) : (
        /* Empty state */
        <div className="card p-12 text-center border-dashed">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
            style={{ background: ROSE_DIM, border: `1px solid ${ROSE_BORDER}` }}>
            <HelpCircle size={24} style={{ color: ROSE }} />
          </div>
          <h3 className="font-display text-xl text-[--text-primary] mb-2">Test Your Knowledge</h3>
          <p className="text-[--text-secondary] text-sm mb-6">
            Generate a quiz to reinforce what you&apos;ve learned from this document.
          </p>
          <button
            onClick={generateQuiz}
            className="btn-primary mx-auto inline-flex items-center gap-2"
            style={{ background: `linear-gradient(135deg, ${ROSE}, #CC003D)` }}
          >
            <Sparkles size={15} /> Generate Quiz
          </button>
        </div>
      )}
    </div>
  )
}
