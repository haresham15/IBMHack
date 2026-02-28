'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { jsPDF } from 'jspdf'

const TOTAL_STEPS = 4

export default function AgentPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [responses, setResponses] = useState({
    studentId: '',
    gradYear: '',
    financialChange: '',
    dependencyStatus: ''
  })
  const [textInput, setTextInput] = useState('')
  const [formMeta, setFormMeta] = useState({ formName: 'FAFSA Verification', estimatedMinutes: 8 })

  useEffect(() => {
    fetch('/api/agent')
      .then(r => r.json())
      .then(data => {
        if (data.formName) setFormMeta({ formName: data.formName, estimatedMinutes: data.estimatedMinutes ?? 8 })
      })
      .catch(() => {})
  }, [])

  // Restore text input when going back to step 1
  useEffect(() => {
    if (step === 1) setTextInput(responses.studentId)
    else setTextInput('')
  }, [step, responses.studentId])

  function handleNext(field, value) {
    if (field) setResponses(r => ({ ...r, [field]: value }))
    setStep(s => s + 1)
  }

  function handleBack() {
    const prevStep = step - 1
    if (prevStep === 1) setTextInput(responses.studentId || '')
    setStep(prevStep)
  }

  function downloadSummary() {
    const content = [
      'Vantage — Form Completion Summary',
      '===================================',
      `Form: ${formMeta.formName}`,
      '',
      `Student ID:           ${responses.studentId}`,
      `Expected Graduation:  ${responses.gradYear}`,
      `Financial Change:     ${responses.financialChange}`,
      `Dependency Status:    ${responses.dependencyStatus}`,
      '',
      `Completed: ${new Date().toLocaleString()}`
    ].join('\n')
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'vantage-form-summary.txt'; a.click()
    URL.revokeObjectURL(url)
  }

  const bubbleStyle = {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px 12px 12px 0',
    padding: '16px 20px',
    fontSize: '15px',
    lineHeight: 1.6,
    color: '#161616',
    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
    maxWidth: '480px'
  }

  const chipStyle = (active) => ({
    border: `2px solid #4A90C4`,
    color: active ? '#FFFFFF' : '#4A90C4',
    backgroundColor: active ? '#4A90C4' : '#FFFFFF',
    borderRadius: '20px', padding: '8px 24px',
    cursor: 'pointer', fontSize: '14px', fontWeight: '500'
  })

  const backBtn = (
    <button onClick={handleBack} style={{
      alignSelf: 'flex-start', background: 'none', border: 'none',
      color: '#525252', cursor: 'pointer', fontSize: '14px', marginTop: '4px'
    }}>← Back</button>
  )

  return (
    <>
      <Navbar showNav={true} />
      <div style={{
        paddingTop: '48px', fontFamily: 'IBM Plex Sans, sans-serif',
        minHeight: '100vh', backgroundColor: '#F4F4F4'
      }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '32px 24px' }}>

          {/* Progress bar */}
          <div style={{ marginBottom: '28px' }}>
            <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
              {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                <div key={i} style={{
                  flex: 1, height: '6px', borderRadius: '3px',
                  backgroundColor: i < step ? '#4A90C4' : '#E0E0E0',
                  transition: 'background 300ms'
                }} />
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '13px', color: '#525252' }}>
                {step < TOTAL_STEPS ? `Step ${step} of ${TOTAL_STEPS}` : 'Complete'}
              </div>
              <div style={{ fontSize: '13px', color: '#525252' }}>
                {formMeta.formName} • ~{formMeta.estimatedMinutes} min
              </div>
            </div>
          </div>

          {/* Chat layout */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Step 0 — Intro */}
            {step === 0 && (
              <>
                <div style={bubbleStyle}>
                  Your {formMeta.formName} form needs {TOTAL_STEPS} pieces of information.
                  I&apos;ll ask for them one at a time. Take your time — there&apos;s no rush.
                </div>
                <button onClick={() => setStep(1)} style={{
                  alignSelf: 'flex-start', backgroundColor: '#4A90C4', color: '#FFFFFF',
                  border: 'none', borderRadius: '8px', padding: '10px 24px',
                  fontSize: '15px', fontWeight: '600', cursor: 'pointer'
                }}>Let&apos;s start →</button>
              </>
            )}

            {/* Step 1 — Student ID */}
            {step === 1 && (
              <>
                <div style={bubbleStyle}>What is your student ID number?</div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={textInput}
                    onChange={e => setTextInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && textInput.trim() && handleNext('studentId', textInput.trim())}
                    placeholder="Student ID..."
                    autoFocus
                    style={{
                      flex: 1, border: '2px solid #4A90C4', borderRadius: '8px',
                      padding: '10px 14px', fontSize: '15px', outline: 'none'
                    }}
                  />
                  <button
                    onClick={() => textInput.trim() && handleNext('studentId', textInput.trim())}
                    style={{
                      backgroundColor: '#4A90C4', color: '#FFFFFF', border: 'none',
                      borderRadius: '8px', padding: '10px 20px', cursor: 'pointer', fontSize: '14px'
                    }}>Next →</button>
                </div>
                {backBtn}
              </>
            )}

            {/* Step 2 — Graduation year */}
            {step === 2 && (
              <>
                <div style={bubbleStyle}>What is your expected graduation year?</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {['2025', '2026', '2027', '2028'].map(y => (
                    <button key={y} onClick={() => handleNext('gradYear', y)} style={chipStyle(responses.gradYear === y)}>
                      {y}
                    </button>
                  ))}
                </div>
                {backBtn}
              </>
            )}

            {/* Step 3 — Financial change */}
            {step === 3 && (
              <>
                <div style={bubbleStyle}>Have you had any changes to your financial situation this year?</div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {['Yes', 'No'].map(opt => (
                    <button key={opt} onClick={() => handleNext('financialChange', opt)} style={chipStyle(responses.financialChange === opt)}>
                      {opt}
                    </button>
                  ))}
                </div>
                {backBtn}
              </>
            )}

            {/* Step 4 — Dependency status */}
            {step === 4 && (
              <>
                <div style={bubbleStyle}>What is your dependency status for this academic year?</div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {['Dependent', 'Independent'].map(opt => (
                    <button key={opt} onClick={() => handleNext('dependencyStatus', opt)} style={chipStyle(responses.dependencyStatus === opt)}>
                      {opt}
                    </button>
                  ))}
                </div>
                {backBtn}
              </>
            )}

            {/* Step 5 — Completion */}
            {step === 5 && (
              <>
                <div style={bubbleStyle}>All done! Here&apos;s your summary:</div>

                <table style={{
                  width: '100%', borderCollapse: 'collapse', backgroundColor: '#FFFFFF',
                  borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                }}>
                  <tbody>
                    {[
                      ['Student ID', responses.studentId],
                      ['Expected Graduation', responses.gradYear],
                      ['Financial Change', responses.financialChange],
                      ['Dependency Status', responses.dependencyStatus]
                    ].map(([label, value]) => (
                      <tr key={label}>
                        <td style={{
                          padding: '12px 16px', fontWeight: '600', color: '#525252',
                          fontSize: '14px', borderBottom: '1px solid #E0E0E0', width: '40%'
                        }}>{label}</td>
                        <td style={{
                          padding: '12px 16px', color: '#161616',
                          fontSize: '14px', borderBottom: '1px solid #E0E0E0'
                        }}>{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <button onClick={downloadSummary} style={{
                    backgroundColor: '#4A90C4', color: '#FFFFFF', border: 'none',
                    borderRadius: '8px', padding: '12px 24px', cursor: 'pointer',
                    fontSize: '14px', fontWeight: '600'
                  }}>⬇ Download completed form</button>
                  <button onClick={() => router.push('/dashboard')} style={{
                    backgroundColor: '#FFFFFF', color: '#4A90C4',
                    border: '2px solid #4A90C4', borderRadius: '8px',
                    padding: '12px 24px', cursor: 'pointer', fontSize: '14px', fontWeight: '600'
                  }}>Back to Dashboard</button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
