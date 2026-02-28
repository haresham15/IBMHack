'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

const CAP_QUESTIONS = [
  {
    id: 'q1', field: 'informationDensity',
    question: 'When you get instructions, do you prefer:',
    type: 'single', options: ['Just the key points', 'Moderate detail', 'Full step-by-step'],
    values: ['summary', 'moderate', 'full']
  },
  {
    id: 'q2', field: 'timeHorizon',
    question: 'How far ahead do you want deadline reminders?',
    type: 'single', options: ['24 hours ahead', '72 hours ahead', '1 week ahead', '2 weeks ahead'],
    values: ['24h', '72h', '1week', '2weeks']
  },
  {
    id: 'q3', field: 'sensoryFlags',
    question: 'Do any of these make it hard to focus? (pick all that apply)',
    type: 'multi', options: ['Loud spaces', 'Bright lighting', 'Crowded rooms', 'Open offices'],
    values: ['loud', 'bright', 'crowds', 'open']
  },
  {
    id: 'q4', field: 'supportLevel',
    question: 'When it comes to tasks, I prefer:',
    type: 'single', options: ['Just reminders', 'Step-by-step guidance', 'Help completing it'],
    values: ['reminder', 'step-by-step', 'full-agent']
  },
  {
    id: 'q6', field: 'disorders',
    question: 'Vantage can personalise your whole experience — colours, fonts, layout — to suit how your brain works best. Do any of these apply to you? (completely optional & private)',
    type: 'multi',
    options: ['ADHD', 'Autism / ASD', 'Dyslexia', 'Dyscalculia', 'Dyspraxia / DCD', 'Sensory Processing Disorder', 'Anxiety'],
    values: ['adhd', 'asd', 'dyslexia', 'dyscalculia', 'dyspraxia', 'spd', 'anxiety'],
    optional: true
  },
  {
    id: 'q5', field: 'displayName', question: 'What should Vantage call you?',
    type: 'text', options: null, values: null
  }
]

export default function OnboardingPage() {
  const router = useRouter()
  const [messages, setMessages] = useState([])
  const [questionIndex, setQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState([])
  const [isComplete, setIsComplete] = useState(false)
  const [showTyping, setShowTyping] = useState(false)
  const [multiSelected, setMultiSelected] = useState([])
  const [textInput, setTextInput] = useState('')
  const [apiError, setApiError] = useState(null)
  const [retryAnswers, setRetryAnswers] = useState(null)
  const bottomRef = useRef(null)

  useEffect(() => {
    setTimeout(() => {
      setShowTyping(true)
      setTimeout(() => {
        setShowTyping(false)
        setMessages([{ role: 'vantage', text: CAP_QUESTIONS[0].question }])
      }, 600)
    }, 400)
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, showTyping])

  function addVantageMessage(text) {
    return new Promise(resolve => {
      setShowTyping(true)
      setTimeout(() => {
        setShowTyping(false)
        setMessages(m => [...m, { role: 'vantage', text }])
        resolve()
      }, 600)
    })
  }

  async function submitCAP(allAnswers) {
    setApiError(null)
    try {
      const res = await fetch('/api/cap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: allAnswers })
      })
      if (!res.ok) throw new Error('API error ' + res.status)
      const data = await res.json()
      if (data.error) throw new Error(data.message || 'Failed to save profile')
      const name = allAnswers.find(a => a.questionId === 'q5')?.answer || 'there'
      await addVantageMessage(`Perfect! I have saved your profile, ${name}. Your Vantage experience is ready.`)
      setTimeout(() => router.push('/dashboard'), 1200)
    } catch {
      setApiError('Could not save your profile. Please try again.')
      setRetryAnswers(allAnswers)
      setIsComplete(false)
    }
  }

  async function handleAnswer(value, displayText) {
    const q = CAP_QUESTIONS[questionIndex]
    setMessages(m => [...m, { role: 'user', text: displayText }])
    const newAnswers = [...answers, { questionId: q.id, answer: value }]
    setAnswers(newAnswers)
    setMultiSelected([])
    setTextInput('')

    const nextIndex = questionIndex + 1
    if (nextIndex < CAP_QUESTIONS.length) {
      setQuestionIndex(nextIndex)
      await new Promise(r => setTimeout(r, 400))
      await addVantageMessage(CAP_QUESTIONS[nextIndex].question)
    } else {
      const name = value
      await new Promise(r => setTimeout(r, 400))
      await addVantageMessage(`Great to meet you, ${name}! Setting up your profile...`)
      setIsComplete(true)
      await submitCAP(newAnswers)
    }
  }

  function handleMultiContinue() {
    const q = CAP_QUESTIONS[questionIndex]
    const values = multiSelected
    const displayText = values.length ? values.map(v => {
      const idx = q.values.indexOf(v)
      return q.options[idx]
    }).join(', ') : 'None'
    handleAnswer(values, displayText)
  }

  const currentQ = CAP_QUESTIONS[questionIndex]

  return (
    <>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
        @keyframes dot-pulse {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
      <div style={{
        minHeight: '100vh', background: 'linear-gradient(180deg, #0F62FE 0%, #ffffff 40%)',
        fontFamily: 'IBM Plex Sans, sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center',
        position: 'relative'
      }}>
        {/* Header */}
        <div style={{ padding: '32px 24px 16px', textAlign: 'center' }}>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#FFFFFF' }}>Vantage</div>
          <div style={{ fontSize: '15px', color: '#F4F4F4', marginTop: '4px' }}>
            Let us learn how your brain works best.
          </div>
        </div>

        {/* Chat area */}
        <div style={{
          width: '100%', maxWidth: '640px', flex: 1,
          overflowY: 'auto', maxHeight: 'calc(100vh - 200px)',
          padding: '0 16px', display: 'flex', flexDirection: 'column', gap: '12px'
        }}>
          {messages.map((m, i) => (
            <div key={i} style={{
              display: 'flex',
              justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
              animation: 'fadeIn 300ms ease'
            }}>
              <div style={{
                backgroundColor: m.role === 'user' ? '#0F62FE' : '#F4F4F4',
                color: m.role === 'user' ? '#FFFFFF' : '#161616',
                borderRadius: m.role === 'user' ? '12px 12px 0 12px' : '12px 12px 12px 0',
                padding: '16px', maxWidth: '75%', fontSize: '15px', lineHeight: 1.5
              }}>{m.text}</div>
            </div>
          ))}

          {showTyping && (
            <div style={{
              display: 'flex', gap: '5px', padding: '12px 16px', backgroundColor: '#F4F4F4',
              borderRadius: '12px 12px 12px 0', width: 'fit-content', animation: 'fadeIn 200ms ease'
            }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#0F62FE',
                  animation: `dot-pulse 1.2s ease-in-out ${i * 0.2}s infinite`
                }} />
              ))}
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* API Error */}
        {apiError && (
          <div style={{ width: '100%', maxWidth: '640px', padding: '0 16px 12px' }}>
            <div style={{ backgroundColor: '#FFF5F5', border: '1px solid #DA1E28', borderRadius: '8px', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#DA1E28', fontSize: '14px' }}>&#x274C; {apiError}</span>
              <button onClick={() => { setApiError(null); submitCAP(retryAnswers) }} style={{
                backgroundColor: '#DA1E28', color: '#FFFFFF', border: 'none',
                borderRadius: '6px', padding: '6px 14px', cursor: 'pointer', fontSize: '13px'
              }}>Retry</button>
            </div>
          </div>
        )}

        {/* Input area */}
        {!isComplete && messages.length > 0 && !showTyping && !apiError && (
          <div style={{ width: '100%', maxWidth: '640px', padding: '16px', backgroundColor: '#FFFFFF' }}>
            {currentQ.type === 'single' && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {currentQ.options.map((opt, i) => (
                  <button key={i} onClick={() => handleAnswer(currentQ.values[i], opt)}
                    style={{
                      border: '2px solid #0F62FE', color: '#0F62FE',
                      background: '#FFFFFF', borderRadius: '20px',
                      padding: '8px 16px', cursor: 'pointer', fontSize: '14px',
                      transition: 'background 150ms, color 150ms'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#0F62FE'; e.currentTarget.style.color = '#FFFFFF' }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#FFFFFF'; e.currentTarget.style.color = '#0F62FE' }}>
                    {opt}
                  </button>
                ))}
              </div>
            )}

            {currentQ.type === 'multi' && (
              <div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                  {currentQ.options.map((opt, i) => {
                    const val = currentQ.values[i]
                    const selected = multiSelected.includes(val)
                    return (
                      <button key={i} onClick={() => setMultiSelected(s =>
                        s.includes(val) ? s.filter(v => v !== val) : [...s, val]
                      )} style={{
                        border: '2px solid #0F62FE',
                        backgroundColor: selected ? '#0F62FE' : '#FFFFFF',
                        color: selected ? '#FFFFFF' : '#0F62FE',
                        borderRadius: '20px', padding: '8px 16px',
                        cursor: 'pointer', fontSize: '14px'
                      }}>{opt}</button>
                    )
                  })}
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <button onClick={handleMultiContinue} style={{
                    backgroundColor: '#0F62FE', color: '#FFFFFF',
                    border: 'none', borderRadius: '20px', padding: '10px 24px',
                    cursor: 'pointer', fontSize: '14px', fontWeight: '600'
                  }}>Continue &#x2192;</button>
                  {currentQ.optional && (
                    <button onClick={() => handleAnswer([], 'Prefer not to say')} style={{
                      background: 'none', border: 'none',
                      color: '#6B6B6B', cursor: 'pointer',
                      fontSize: '13px', textDecoration: 'underline', padding: '4px'
                    }}>Skip / prefer not to say</button>
                  )}
                </div>
              </div>
            )}

            {currentQ.type === 'text' && (
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text" value={textInput}
                  onChange={e => setTextInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && textInput.trim() && handleAnswer(textInput.trim(), textInput.trim())}
                  placeholder="Your name..."
                  style={{
                    flex: 1, border: '2px solid #0F62FE', borderRadius: '8px',
                    padding: '10px 14px', fontSize: '15px', outline: 'none'
                  }} />
                <button onClick={() => textInput.trim() && handleAnswer(textInput.trim(), textInput.trim())}
                  style={{
                    backgroundColor: '#0F62FE', color: '#FFFFFF', border: 'none',
                    borderRadius: '8px', padding: '10px 20px', cursor: 'pointer', fontSize: '14px'
                  }}>Continue &#x2192;</button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}
