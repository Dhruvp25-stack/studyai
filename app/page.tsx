'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Zap, Brain, Sparkles, BookOpen } from 'lucide-react'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const urlError = searchParams.get('error')
    if (urlError) setError(urlError)
  }, [searchParams])

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    const supabase = createClient()

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` }
      })
      if (error) {
        setError(error.message)
      } else {
        setMessage('Check your email for a confirmation link, then come back and sign in!')
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError(error.message)
      } else {
        router.push('/dashboard')
        router.refresh()
      }
    }
    setLoading(false)
  }

  const features = [
    { icon: BookOpen, label: 'PDF Upload & Extraction', color: '#00FF88' },
    { icon: Brain, label: 'AI Summaries', color: '#0088FF' },
    { icon: Zap, label: 'Smart Flashcards', color: '#FFEE00' },
    { icon: Sparkles, label: 'Interactive Quizzes', color: '#FF0088' },
  ]

  return (
    <div className="grid-bg min-h-screen flex">
      {/* Left Panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12 relative overflow-hidden">
        <div className="absolute top-20 left-20 w-64 h-64 bg-[#00FF88] rounded-full opacity-[0.06] blur-3xl pointer-events-none" />
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-[#0088FF] rounded-full opacity-[0.05] blur-3xl pointer-events-none" />

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#00FF88] flex items-center justify-center">
            <Brain size={20} className="text-[#0A0A0F]" />
          </div>
          <span className="font-display font-bold text-xl text-white">StudyAI</span>
        </div>

        <div className="space-y-6">
          <div>
            <h1 className="font-display font-extrabold text-5xl leading-tight text-white mb-4">
              Learn Anything<br />
              <span className="text-gradient-green">10x Faster</span>
            </h1>
            <p className="text-[#9090D0] text-lg leading-relaxed max-w-md">
              Upload your PDFs and let Gemini AI transform them into summaries, flashcards, quizzes, and more.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {features.map(({ icon: Icon, label, color }) => (
              <div key={label} className="glass flex items-center gap-3 px-4 py-3 rounded-xl">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: color + '20' }}>
                  <Icon size={16} style={{ color }} />
                </div>
                <span className="text-sm text-[#C0C0E0] font-medium">{label}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-8">
            {[['10x', 'Faster Learning'], ['AI', 'Powered'], ['∞', 'Documents']].map(([num, label]) => (
              <div key={label}>
                <div className="font-display font-extrabold text-2xl text-gradient-green">{num}</div>
                <div className="text-[#9090D0] text-sm">{label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-[#6060A0] text-sm">© 2024 StudyAI. All rights reserved.</div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-6 relative">
        <div className="w-full max-w-md animate-fade-in-up">
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-[#00FF88] flex items-center justify-center">
              <Brain size={18} className="text-[#0A0A0F]" />
            </div>
            <span className="font-display font-bold text-lg text-white">StudyAI</span>
          </div>

          <div className="card p-8">
            <h2 className="font-display font-bold text-2xl text-white mb-1">
              {isSignUp ? 'Create account' : 'Welcome back'}
            </h2>
            <p className="text-[#9090D0] text-sm mb-8">
              {isSignUp ? 'Start your AI-powered study journey' : 'Sign in to continue studying'}
            </p>

            {error && (
              <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}
            {message && (
              <div className="mb-4 px-4 py-3 rounded-xl bg-[#00FF88]/10 border border-[#00FF88]/20 text-[#00FF88] text-sm">
                {message}
              </div>
            )}

            <form onSubmit={handleAuth} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#C0C0E0] mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#C0C0E0] mb-2">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="input-field"
                />
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-t-transparent border-[#0A0A0F] rounded-full animate-spin" />
                    {isSignUp ? 'Creating account...' : 'Signing in...'}
                  </span>
                ) : (
                  isSignUp ? 'Create Account' : 'Sign In'
                )}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-[#252540] text-center">
              <p className="text-[#9090D0] text-sm">
                {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                <button
                  onClick={() => { setIsSignUp(!isSignUp); setError(''); setMessage('') }}
                  className="text-[#00FF88] font-medium hover:underline"
                >
                  {isSignUp ? 'Sign in' : 'Sign up'}
                </button>
              </p>
            </div>
          </div>

          {isSignUp && (
            <div className="mt-4 px-4 py-3 rounded-xl bg-[#0088FF]/10 border border-[#0088FF]/20 text-[#9090D0] text-xs text-center">
              💡 After signing up, check your email and click the confirmation link, then sign in here.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="grid-bg min-h-screen" />}>
      <LoginForm />
    </Suspense>
  )
}
