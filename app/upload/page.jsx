'use client'
import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import LoadingStages from '@/components/LoadingStages'
import Navbar from '@/components/Navbar'

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

export default function UploadPage() {
  const router = useRouter()
  const [file, setFile] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState(null)
  const [syllabusId, setSyllabusId] = useState(null)

  function handleFile(f) {
    if (!f) return
    if (f.type !== 'application/pdf') {
      setError('Only PDF files are accepted. Please upload a .pdf file.')
      return
    }
    setError(null)
    setFile(f)
  }

  const onDrop = useCallback(e => {
    e.preventDefault()
    setIsDragging(false)
    handleFile(e.dataTransfer.files[0])
  }, [])

  const onDragOver = useCallback(e => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const onDragLeave = () => setIsDragging(false)

  async function runTranslate(sid) {
    const capRaw = localStorage.getItem('vantage_cap')
    if (!capRaw) { router.push('/onboarding'); return }
    const capProfile = JSON.parse(capRaw)

    const translateRes = await fetch('/api/syllabus/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ syllabusId: sid, capProfile })
    })
    const result = await translateRes.json()
    if (result.error) throw new Error(result.message || 'AI processing failed.')

    localStorage.setItem('vantage_tasks', JSON.stringify(result.tasks))
    const existing = JSON.parse(localStorage.getItem('vantage_syllabi') || '[]')
    existing.push({
      id: sid,
      courseName: result.courseName || 'Uploaded Syllabus',
      instructor: result.instructor,
      term: result.term,
      policies: result.policies,
      importantDates: result.importantDates,
      uploadedAt: new Date().toISOString()
    })
    localStorage.setItem('vantage_syllabi', JSON.stringify(existing))
    router.push('/syllabus/' + sid)
  }

  async function handleAnalyse() {
    if (!file) return
    setIsProcessing(true)
    setError(null)
    setSyllabusId(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const uploadRes = await fetch('/api/syllabus/upload', { method: 'POST', body: formData })
      const uploadData = await uploadRes.json()
      if (uploadData.error) throw new Error(uploadData.message || 'Upload failed.')
      const sid = uploadData.syllabusId
      setSyllabusId(sid)
      await runTranslate(sid)
    } catch (e) {
      setError(e.message || 'Something went wrong. Please try again.')
      setIsProcessing(false)
    }
  }

  async function handleRetryTranslate() {
    if (!syllabusId) return
    setIsProcessing(true)
    setError(null)
    try {
      await runTranslate(syllabusId)
    } catch (e) {
      setError('AI processing failed. Try again.')
      setIsProcessing(false)
    }
  }

  return (
    <>
      <Navbar />
      <LoadingStages active={isProcessing} />
      <div style={{
        fontFamily: 'IBM Plex Sans, sans-serif',
        maxWidth: '640px', margin: '0 auto', padding: '80px 24px 40px'
      }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#161616', marginBottom: '8px' }}>
          Upload a Syllabus
        </h1>
        <p style={{ color: '#525252', marginBottom: '32px' }}>
          Vantage will read it and create a personalised task list for you.
        </p>

        {error && (
          <div style={{
            backgroundColor: '#FFF5F5', border: '1px solid #DA1E28', borderRadius: '8px',
            padding: '12px 16px', marginBottom: '20px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <span style={{ color: '#DA1E28', fontSize: '14px' }}>❌ {error}</span>
            <button
              onClick={syllabusId ? handleRetryTranslate : () => setError(null)}
              style={{
                backgroundColor: '#DA1E28', color: '#FFFFFF', border: 'none',
                borderRadius: '6px', padding: '6px 14px', cursor: 'pointer', fontSize: '13px'
              }}>
              {syllabusId ? 'Retry AI' : 'Dismiss'}
            </button>
          </div>
        )}

        {/* Drop zone */}
        <div
          onClick={() => document.getElementById('file-input').click()}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          style={{
            height: '480px', border: `2px ${isDragging ? 'solid' : 'dashed'} #0F62FE`,
            borderRadius: '12px', cursor: 'pointer',
            backgroundColor: isDragging ? '#0F62FE' : '#FFFFFF',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: '12px', transition: 'background 200ms, border 200ms'
          }}>
          <input id="file-input" type="file" accept=".pdf" style={{ display: 'none' }}
            onChange={e => handleFile(e.target.files[0])} />

          {file ? (
            <>
              <span style={{ fontSize: '48px', animation: 'checkIn 400ms ease' }}>✅</span>
              <span style={{ fontWeight: '600', color: '#161616', fontSize: '16px' }}>{file.name}</span>
              <span style={{ color: '#525252', fontSize: '14px' }}>{formatSize(file.size)}</span>
            </>
          ) : isDragging ? (
            <>
              <span style={{ fontSize: '72px' }}>📂</span>
              <span style={{ color: '#FFFFFF', fontSize: '16px', fontWeight: '600' }}>Drop it here!</span>
            </>
          ) : (
            <>
              <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="#0F62FE" strokeWidth="1.5">
                <path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M8 12l4-4 4 4M12 8v8"/>
              </svg>
              <span style={{ color: '#525252', fontSize: '16px' }}>Drag your syllabus PDF here</span>
              <span style={{ color: '#0F62FE', fontSize: '14px', textDecoration: 'underline' }}>or click to browse</span>
            </>
          )}
        </div>

        {/* Analyse button */}
        <button
          onClick={handleAnalyse}
          disabled={!file}
          style={{
            width: '100%', height: '56px', marginTop: '20px',
            backgroundColor: file ? '#0F62FE' : '#C6C6C6',
            color: '#FFFFFF', border: 'none', borderRadius: '8px',
            fontSize: '18px', fontWeight: '600', cursor: file ? 'pointer' : 'not-allowed',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            transition: 'transform 100ms',
          }}
          onMouseDown={e => { if (file) e.currentTarget.style.transform = 'scale(0.97)' }}
          onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)' }}>
          ✨ Analyse with Vantage
        </button>
      </div>
    </>
  )
}
