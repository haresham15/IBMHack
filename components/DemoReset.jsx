'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function DemoReset() {
  const router = useRouter()
  useEffect(() => {
    function handleKey(e) {
      if (e.ctrlKey && e.shiftKey && e.key === 'R') {
        e.preventDefault()
        Object.keys(localStorage).filter(k => k.startsWith('vantage_')).forEach(k => localStorage.removeItem(k))
        console.log('Demo reset — localStorage cleared')
        router.push('/onboarding')
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [router])
  return null
}
