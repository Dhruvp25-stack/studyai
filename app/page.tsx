'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    const check = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        router.push('/dashboard')
      } else {
        router.push('/login')
      }
    }
    check()
  }, [router])

  return (
    <div className="grid-bg min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-2 border-t-transparent border-[#00FF88] rounded-full animate-spin mx-auto mb-4" />
        <p className="text-[#9090D0] font-body">Loading StudyAI...</p>
      </div>
    </div>
  )
}
