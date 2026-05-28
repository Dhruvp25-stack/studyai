// FILE LOCATION: app/(auth)/login/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Brain, BookOpen, Zap, BarChart2, MessageCircle } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [message, setMessage]   = useState('')
  const router = useRouter()

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError(''); setMessage('')
    const supabase = createClient()

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email, password,
        options: { emailRedirectTo: `${window.location.origin}/dashboard` },
      })
      if (error) setError(error.message)
      else setMessage('Check your email for a confirmation link!')
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
      else { router.push('/dashboard'); router.refresh() }
    }
    setLoading(false)
  }

  const features = [
    { icon: BookOpen,     label: 'PDF Summaries',    color: '#4F8EF7' },
    { icon: Zap,          label: 'Smart Flashcards',  color: '#6EE7B7' },
    { icon: BarChart2,    label: 'Quiz Mode',          color: '#FBBF24' },
    { icon: MessageCircle,label: 'AI Tutor Chat',      color: '#A78BFA' },
  ]

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: '#0F0F0F' }}>

      {/* ── Left panel ── */}
      <div style={{
        width: '44%', padding: '48px 56px',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        borderRight: '1px solid #1E1E1E',
      }} className="hidden lg:flex">

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 9,
            background: '#4F8EF7', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Brain size={18} color="#fff" />
          </div>
          <span style={{ fontWeight: 700, fontSize: 17, color: '#F2F2F2', letterSpacing: '-0.3px' }}>
            StudyAI
          </span>
        </div>

        {/* Hero */}
        <div>
          <h1 style={{
            fontSize: 42, fontWeight: 700, lineHeight: 1.15,
            color: '#F2F2F2', letterSpacing: '-1px', marginBottom: 16,
          }}>
            Study smarter<br />
            <span style={{ color: '#4F8EF7' }}>with AI.</span>
          </h1>
          <p style={{ color: '#666', fontSize: 15, lineHeight: 1.65, marginBottom: 40, maxWidth: 340 }}>
            Upload any PDF and instantly get summaries, flashcards, quizzes, and a personal AI tutor.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {features.map(({ icon: Icon, label, color }) => (
              <div key={label} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '11px 14px', borderRadius: 9,
                background: '#181818', border: '1px solid #242424',
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 7,
                  background: color + '18',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={14} color={color} />
                </div>
                <span style={{ fontSize: 13, color: '#AAAAAA', fontWeight: 500 }}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        <p style={{ fontSize: 12, color: '#444' }}>© 2025 StudyAI</p>
      </div>

      {/* ── Right panel (form) ── */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 24px',
      }}>
        <div style={{ width: '100%', maxWidth: 380 }} className="fade-up">

          {/* Mobile logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 32 }}
            className="flex lg:hidden">
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: '#4F8EF7', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Brain size={16} color="#fff" />
            </div>
            <span style={{ fontWeight: 700, fontSize: 16, color: '#F2F2F2' }}>StudyAI</span>
          </div>

          {/* Heading */}
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#F2F2F2', letterSpacing: '-0.4px', marginBottom: 4 }}>
            {isSignUp ? 'Create an account' : 'Welcome back'}
          </h2>
          <p style={{ fontSize: 13.5, color: '#666', marginBottom: 28 }}>
            {isSignUp ? 'Start your AI study journey today' : 'Sign in to continue studying'}
          </p>

          {/* Alerts */}
          {error && (
            <div style={{
              padding: '10px 14px', borderRadius: 8, marginBottom: 16,
              background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)',
              color: '#F87171', fontSize: 13,
            }}>
              {error}
            </div>
          )}
          {message && (
            <div style={{
              padding: '10px 14px', borderRadius: 8, marginBottom: 16,
              background: 'rgba(110,231,183,0.08)', border: '1px solid rgba(110,231,183,0.2)',
              color: '#6EE7B7', fontSize: 13,
            }}>
              {message}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleAuth}>
            <div style={{ marginBottom: 14 }}>
              <label className="label">Email</label>
              <input
                type="email" required value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="input"
              />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label className="label">Password</label>
              <input
                type="password" required minLength={6} value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input"
              />
            </div>

            <button
              type="submit" disabled={loading}
              className="btn btn-primary"
              style={{ width: '100%', padding: '10px 16px', fontSize: 14 }}
            >
              {loading ? (
                <>
                  <span style={{
                    width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block',
                  }} className="spin" />
                  {isSignUp ? 'Creating account…' : 'Signing in…'}
                </>
              ) : (
                isSignUp ? 'Create Account' : 'Sign In'
              )}
            </button>
          </form>

          {/* Switch mode */}
          <div style={{
            marginTop: 24, paddingTop: 20, borderTop: '1px solid #222',
            textAlign: 'center', fontSize: 13, color: '#666',
          }}>
            {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
            <button
              onClick={() => { setIsSignUp(!isSignUp); setError(''); setMessage('') }}
              style={{ color: '#4F8EF7', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer' }}
            >
              {isSignUp ? 'Sign in' : 'Sign up'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
