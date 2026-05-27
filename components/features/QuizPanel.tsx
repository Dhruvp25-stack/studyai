'use client'

import { useState, useEffect } from 'react'
import { useApp } from '@/app/(dashboard)/dashboard/layout'
import { createClient } from '@/lib/supabase'
import type { QuizQuestion } from '@/types'
import { HelpCircle, Sparkles, CheckCircle, XCircle, Trophy, RefreshCw } from 'lucide-react'

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
  }, [activeDoc?.id])

  const resetQuiz = () => {
    setCurrent(0)
    setSelected(null)
    setAnswers([])
    setShowResult(false)
    setQuizDone(false)
  }

  const loadQuestions = async () => {
    if (!activeDoc) return
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('quiz_questions')
      .select('*')
      .eq('document_id', activeDoc.id)
      .order('created_at')
    if (data && data.length > 0) {
      setQuestions(data as QuizQuestion[])
      setAnswers(new Array(data.length).fill(null))
    }
    setLoading(false)
  }

  const generateQuiz = async () => {
    if (!activeDoc) return
    setGenerating(true)
    setError('')
    resetQuiz()

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

      const toInsert = data.result.map((q: Omit<QuizQuestion, 'id' | 'document_id' | 'user_id' | 'created_at'>) => ({
        document_id: activeDoc.id,
        user_id: user!.id,
        question: q.question,
        options: q.options,
        correct_answer: q.correct_answer,
        explanation: q.explanation,
      }))

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
      setCurrent(c => c + 1)
      setSelected(answers[current + 1])
      setShowResult(answers[current + 1] !== null)
    }
  }

  const score = answers.filter((a, i) => a === questions[i]?.correct_answer).length

  if (!activeDoc) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#FF0088]/10 flex items-center justify-center mb-4">
          <HelpCircle size={28} className="text-[#FF0088]" />
        </div>
        <h2 className="font-display font-bold text-xl text-white mb-2">No Document Selected</h2>
        <p className="text-[#9090D0]">Upload or select a document to take a quiz</p>
      </div>
    )
  }

  if (quizDone) {
    const pct = Math.round((score / questions.length) * 100)
    return (
      <div className="max-w-2xl mx-auto animate-fade-in-up">
        <div className="card p-10 text-center">
          <div className="w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6" style={{
            background: pct >= 80 ? 'linear-gradient(135deg, rgba(0,255,136,0.2), rgba(0,255,136,0.1))' :
              pct >= 60 ? 'linear-gradient(135deg, rgba(255,238,0,0.2), rgba(255,184,0,0.1))' :
              'linear-gradient(135deg, rgba(255,0,136,0.2), rgba(255,0,136,0.1))',
            border: `2px solid ${pct >= 80 ? '#00FF88' : pct >= 60 ? '#FFEE00' : '#FF0088'}20`
          }}>
            <Trophy size={36} style={{ color: pct >= 80 ? '#00FF88' : pct >= 60 ? '#FFEE00' : '#FF0088' }} />
          </div>
          <h2 className="font-display font-bold text-3xl text-white mb-2">
            Quiz Complete!
          </h2>
          <p className="text-[#9090D0] mb-6">You answered {score} out of {questions.length} correctly</p>

          <div className="text-6xl font-display font-extrabold mb-2" style={{
            color: pct >= 80 ? '#00FF88' : pct >= 60 ? '#FFEE00' : '#FF0088'
          }}>
            {pct}%
          </div>
          <p className="text-[#9090D0] mb-8">
            {pct >= 80 ? '🎉 Excellent! You really know this material!' :
             pct >= 60 ? '👍 Good job! Keep reviewing the tough parts.' :
             '📚 Keep studying! Practice makes perfect.'}
          </p>

          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              ['Correct', score, '#00FF88'],
              ['Wrong', questions.length - score, '#FF4444'],
              ['Total', questions.length, '#9090D0'],
            ].map(([label, val, color]) => (
              <div key={String(label)} className="glass rounded-xl p-4">
                <div className="font-display font-bold text-2xl mb-1" style={{ color: color as string }}>{val}</div>
                <div className="text-[#9090D0] text-xs">{label}</div>
              </div>
            ))}
          </div>

          <button onClick={resetQuiz} className="btn-secondary flex items-center gap-2 mx-auto">
            <RefreshCw size={14} />
            Retake Quiz
          </button>
        </div>

        {/* Answer review */}
        <div className="mt-6 space-y-3">
          <h3 className="text-[#6060A0] text-xs font-semibold uppercase tracking-wider">Answer Review</h3>
          {questions.map((q, i) => {
            const isCorrect = answers[i] === q.correct_answer
            return (
              <div key={q.id} className={`card p-4 border ${isCorrect ? 'border-[#00FF88]/20 bg-[#00FF88]/04' : 'border-red-500/20 bg-red-500/04'}`}>
                <div className="flex items-start gap-3">
                  {isCorrect ? <CheckCircle size={16} className="text-[#00FF88] mt-0.5 flex-shrink-0" /> : <XCircle size={16} className="text-red-400 mt-0.5 flex-shrink-0" />}
                  <div>
                    <p className="text-white text-sm mb-1">{q.question}</p>
                    <p className="text-[#00FF88] text-xs">✓ {q.options[q.correct_answer]}</p>
                    {!isCorrect && answers[i] !== null && (
                      <p className="text-red-400 text-xs">✗ You chose: {q.options[answers[i]!]}</p>
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

  return (
    <div className="max-w-2xl mx-auto animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#FF0088]/15 flex items-center justify-center">
            <HelpCircle size={16} className="text-[#FF0088]" />
          </div>
          <h1 className="font-display font-bold text-2xl text-white">Quiz Mode</h1>
        </div>
        <button
          onClick={generateQuiz}
          disabled={generating}
          className="btn-primary flex items-center gap-2 text-sm py-2 px-4"
          style={{ background: 'linear-gradient(135deg, #FF0088, #CC0066)' }}
        >
          {generating ? <span className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin" /> : <Sparkles size={14} />}
          {generating ? 'Generating...' : questions.length > 0 ? 'New Quiz' : 'Generate Quiz'}
        </button>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
      )}

      {loading || generating ? (
        <div className="card p-8 text-center">
          <div className="w-12 h-12 border-2 border-t-transparent border-[#FF0088] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#9090D0]">{generating ? 'Crafting quiz questions with Gemini AI...' : 'Loading...'}</p>
        </div>
      ) : questions.length > 0 ? (
        <>
          {/* Progress */}
          <div className="flex items-center gap-3 mb-6">
            <div className="progress-bar flex-1 h-1.5">
              <div className="progress-fill h-full" style={{
                width: `${((current + 1) / questions.length) * 100}%`,
                background: 'linear-gradient(90deg, #FF0088, #CC0066)'
              }} />
            </div>
            <span className="text-[#9090D0] text-xs font-mono">{current + 1}/{questions.length}</span>
          </div>

          {/* Question */}
          <div className="card p-6 mb-4">
            <div className="flex items-center gap-2 mb-4">
              <span className="px-2 py-0.5 rounded-full bg-[#FF0088]/10 text-[#FF0088] text-xs border border-[#FF0088]/20">
                Q{current + 1}
              </span>
            </div>
            <p className="font-display font-semibold text-xl text-white leading-relaxed">
              {questions[current]?.question}
            </p>
          </div>

          {/* Options */}
          <div className="space-y-3 mb-6">
            {questions[current]?.options.map((opt, i) => {
              let cls = 'quiz-option'
              if (showResult) {
                if (i === questions[current].correct_answer) cls += ' correct'
                else if (i === selected) cls += ' incorrect'
              }
              return (
                <button
                  key={i}
                  className={cls}
                  onClick={() => handleAnswer(i)}
                  disabled={showResult}
                >
                  <span className="font-mono text-xs mr-3 opacity-60">{String.fromCharCode(65 + i)}.</span>
                  {opt}
                </button>
              )
            })}
          </div>

          {/* Explanation */}
          {showResult && (
            <div className={`p-4 rounded-xl mb-4 border ${selected === questions[current]?.correct_answer ? 'bg-[#00FF88]/08 border-[#00FF88]/20' : 'bg-red-500/08 border-red-500/20'}`}>
              <div className="flex items-center gap-2 mb-2">
                {selected === questions[current]?.correct_answer
                  ? <CheckCircle size={16} className="text-[#00FF88]" />
                  : <XCircle size={16} className="text-red-400" />}
                <span className={`text-sm font-medium ${selected === questions[current]?.correct_answer ? 'text-[#00FF88]' : 'text-red-400'}`}>
                  {selected === questions[current]?.correct_answer ? 'Correct!' : 'Incorrect'}
                </span>
              </div>
              <p className="text-[#C0C0E0] text-sm">{questions[current]?.explanation}</p>
            </div>
          )}

          {showResult && (
            <button onClick={handleNext} className="btn-primary w-full" style={{ background: 'linear-gradient(135deg, #FF0088, #CC0066)' }}>
              {current === questions.length - 1 ? 'See Results' : 'Next Question'}
            </button>
          )}
        </>
      ) : (
        <div className="card p-10 text-center border-dashed">
          <HelpCircle size={32} className="text-[#FF0088] mx-auto mb-4 opacity-60" />
          <p className="text-[#9090D0] mb-4">Ready to test your knowledge? Generate a quiz from your document!</p>
          <button onClick={generateQuiz} className="btn-primary mx-auto" style={{ background: 'linear-gradient(135deg, #FF0088, #CC0066)' }}>
            <Sparkles size={16} className="inline mr-2" />
            Generate Quiz
          </button>
        </div>
      )}
    </div>
  )
}
