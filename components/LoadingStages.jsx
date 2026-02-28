'use client'
import { useState, useEffect } from 'react'

const STAGES = [
  '📄  Reading your syllabus...',
  '🧠  IBM Granite is extracting assignments and deadlines...',
  '✨  Personalising for your learning style...'
]

const WIDTHS = ['20%', '55%', '85%', '100%']

export default function LoadingStages({ active }) {
  const [stage, setStage] = useState(0)

  useEffect(() => {
    if (!active) { setStage(0); return }
    const interval = setInterval(() => {
      setStage(s => (s < STAGES.length - 1 ? s + 1 : s))
    }, 3000)
    return () => clearInterval(interval)
  }, [active])

  if (!active) return null

  return (
    <div style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(255,255,255,0.95)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      zIndex: 999
    }}>
      {/* Progress bar */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: '3px', backgroundColor: '#F4F4F4' }}>
        <div style={{
          height: '100%', backgroundColor: '#4A90C4',
          width: WIDTHS[stage], transition: 'width 800ms ease-in-out'
        }} />
      </div>
      <p style={{ color: '#4A90C4', fontSize: '17px', fontWeight: 'bold', textAlign: 'center', padding: '0 32px' }}>
        {STAGES[stage]}
      </p>
    </div>
  )
}
