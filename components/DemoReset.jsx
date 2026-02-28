'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function DemoReset() {
  const router = useRouter()
  useEffect(() => {
    async function handleKey(e) {
      if (e.ctrlKey && e.shiftKey && e.key === 'R') {
        e.preventDefault()
        const supabase = createClient()
        await supabase.auth.signOut()
        console.log('Demo reset — signed out')
        router.push('/')
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [router])
  return null
}
