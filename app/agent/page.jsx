'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'

const TOTAL_STEPS = 4

export default function AgentPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [responses, setResponses] = useState({ studentId: '', gradYear: '', financialChange: '' })
  const [textInput, setTextInput] = useState('')

  function handleNext(field, value) {
    if (field) setResponses(r => ({ ...r, [field]: value }))
    setTextInput('')
    setStep(s => s + 1)
  }

  function handleBack() {
    setStep(s => s - 1)
  }

  function downloadSummary() {
    const content = [
      'FAFSA Verification Form — Vantage Summary',
      '==========================================',
      `Student ID: ${responses.studentId}`,
      `Expected Graduation Year: ${responses.gradYear}`,
      `Financial Situation Change: ${responses.financialChange}`,
      '',
      `Generated: ${new Date().toLocaleString()}`
    ].join('\n')
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'vantage-fafsa-summary.txt'; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      <Navbar />
      <div style={{
        paddingTop: '48px', fontFamily: 'IBM Plex Sans, sans-serif',
        minHeight: '100vh', backgroundColor: '#F4F4F4'
      }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '32px 24px' }}>
          {/* Progress bar */}
          <div style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
              {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                <div key={i} style={{
                  flex: 1, height: '6px', borderRadius: '3px',
                  backgroundColor: i < step ? '#0F62FE' : '#E0E0E0',
                  transition: 'background 300ms'
                }} />
              ))}
            </div>
            <div style={{ fontSize: '13px', color: '#525252' }}>
              {step < TOTAL_STEPS ? `Step ${step} of ${TOTAL_STEPS}` : 'Complete'}
            </div>
          </div>

          {/* Chat-style layout */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Step 0 */}
            {step === 0 && (
              <>
                <div style={{
                  backgroundColor: '#F4F4F4', borderRadius: '12px 12px 12px 0',
                  padding: '16px 20px', fontSize: '15px', lineHeight: 1.6, color: '#161616'
                }}>
                  Your FAFSA verification form needs 4 pieces of information.
                  I will ask for them one at a time. Take your time — there is no rush.
                </div>
                <button onClick={() => setStep(1)} style={{
                  alignSelf: 'flex-start', backgroundColor: '#0F62FE', color: '#FFFFFF',
                  border: 'none', borderRadius: '8px', padding: '10px 24px',
                  fontSize: '15px', fontWeight: '600', cursor: 'pointer'
                }}>Let&apos;s start →</button>
              </>
            )}

            {/* Step 1 */}
            {step === 1 && (
              <>
                <div style={{
                  backgroundColor: '#F4F4F4', borderRadius: '12px 12px 12px 0',
                  padding: '16px 20px', fontSize: '15px', color: '#161616'
                }}>What is your student ID number?</div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input type="text" value={textInput}
                    onChange={e => setTextInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && textInput.trim() && handleNext('studentId', textInput.trim())}
                    placeholder="Student ID..."
                    style={{ flex: 1, border: '2px solid #0F62FE', borderRadius: '8px', padding: '10px 14px', fontSize: '15px', outline: 'none' }} />
                  <button onClick={() => textInput.trim() && handleNext('studentId', textInput.trim())} style={{
                    backgroundColor: '#0F62FE', color: '#FFFFFF', border: 'none',
                    borderRadius: '8px', padding: '10px 20px', cursor: 'pointer', fontSize: '14px'
                  }}>Next →</button>
                </div>
                <button onClick={handleBack} style={{ alignSelf: 'flex-start', background: 'none', border: 'none', color: '#525252', cursor: 'pointer', fontSize: '14px' }}>← Back</button>
              </>
            )}

            {/* Step 2 */}
            {step === 2 && (
              <>
                <div style={{
                  backgroundColor: '#F4F4F4', borderRadius: '12px 12px 12px 0',
                  padding: '16px 20px', fontSize: '15px', color: '#161616'
                }}>What is your expected graduation year?</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {['2025', '2026', '2027', '2028'].map(y => (
                    <button key={y} onClick={() => handleNext('gradYear', y)} style={{
                      border: '2px solid #0F62FE', color: '#0F62FE', backgroundColor: '#FFFFFF',
                      borderRadius: '20px', padding: '8px 20px', cursor: 'pointer', fontSize: '14px'
                    }}>{y}</button>
                  ))}
                </div>
                <button onClick={handleBack} style={{ alignSelf: 'flex-start', background: 'none', border: 'none', color: '#525252', cursor: 'pointer', fontSize: '14px' }}>← Back</button>
              </>
            )}

            {/* Step 3 */}
            {step === 3 && (
              <>
                <div style={{
                  backgroundColor: '#F4F4F4', borderRadius: '12px 12px 12px 0',
                  padding: '16px 20px', fontSize: '15px', color: '#161616'
                }}>Have you had any changes to your financial situation this year?</div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {['Yes', 'No'].map(opt => (
                    <button key={opt} onClick={() => handleNext('financialChange', opt)} style={{
                      border: '2px solid #0F62FE', color: '#0F62FE', backgroundColor: '#FFFFFF',
                      borderRadius: '20px', padding: '8px 24px', cursor: 'pointer', fontSize: '14px'
                    }}>{opt}</button>
                  ))}
                </div>
                <button onClick={handleBack} style={{ alignSelf: 'flex-start', background: 'none', border: 'none', color: '#525252', cursor: 'pointer', fontSize: '14px' }}>← Back</button>
              </>
            )}

            {/* Step 4 — Completion */}
            {step === 4 && (
              <>
                <div style={{
                  backgroundColor: '#F4F4F4', borderRadius: '12px 12px 12px 0',
                  padding: '16px 20px', fontSize: '15px', color: '#161616'
                }}>All done! Here is your summary:</div>

                <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#FFFFFF', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                  <tbody>
                    {[
                      ['Student ID', responses.studentId],
                      ['Expected Graduation', responses.gradYear],
                      ['Financial Change', responses.financialChange]
                    ].map(([label, value]) => (
                      <tr key={label}>
                        <td style={{ padding: '12px 16px', fontWeight: '600', color: '#525252', fontSize: '14px', borderBottom: '1px solid #E0E0E0', width: '40%' }}>{label}</td>
                        <td style={{ padding: '12px 16px', color: '#161616', fontSize: '14px', borderBottom: '1px solid #E0E0E0' }}>{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <button onClick={downloadSummary} style={{
                    backgroundColor: '#0F62FE', color: '#FFFFFF', border: 'none',
                    borderRadius: '8px', padding: '12px 24px', cursor: 'pointer',
                    fontSize: '14px', fontWeight: '600'
                  }}>⬇ Download completed form</button>
                  <button onClick={() => router.push('/dashboard')} style={{
                    backgroundColor: '#FFFFFF', color: '#0F62FE',
                    border: '2px solid #0F62FE', borderRadius: '8px',
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
