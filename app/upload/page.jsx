'use client'
import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import LoadingStages from '@/components/LoadingStages'
import Navbar from '@/components/Navbar'
import ErrorState from '@/components/ErrorState'

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

  async function handleAnalyse() {
    if (!file) return
    setIsProcessing(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const uploadRes = await fetch('/api/syllabus/upload', { method: 'POST', body: formData })
      const { syllabusId } = await uploadRes.json()

      const capRaw = localStorage.getItem('vantage_cap')
      const capProfile = capRaw ? JSON.parse(capRaw) : {}

      const translateRes = await fetch('/api/syllabus/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ syllabusId, capProfile })
      })
      const result = await translateRes.json()

      localStorage.setItem('vantage_tasks', JSON.stringify(result.tasks))

      const existing = JSON.parse(localStorage.getItem('vantage_syllabi') || '[]')
      existing.push({ id: syllabusId, courseName: result.courseName, uploadedAt: new Date().toISOString() })
      localStorage.setItem('vantage_syllabi', JSON.stringify(existing))

      router.push('/syllabus/' + syllabusId)
    } catch {
      setError('Something went wrong. Please try again.')
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
          <div style={{ marginBottom: '20px' }}>
            <ErrorState message={error} onRetry={() => setError(null)} />
          </div>
        )}

        {/* Drop zone */}
        <div
          onClick={() => document.getElementById('file-input').click()}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          style={{
            height: '500px', border: `2px ${isDragging ? 'solid' : 'dashed'} #0F62FE`,
            borderRadius: '12px', cursor: 'pointer',
            backgroundColor: isDragging ? '#0F62FE' : '#FFFFFF',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: '12px', transition: 'background 200ms, border 200ms'
          }}>
          <input id="file-input" type="file" accept=".pdf" style={{ display: 'none' }}
            onChange={e => handleFile(e.target.files[0])} />

          {file ? (
            <>
              <span style={{ fontSize: '48px' }}>✅</span>
              <span style={{ fontWeight: '600', color: '#161616', fontSize: '16px' }}>{file.name}</span>
              <span style={{ color: '#525252', fontSize: '14px' }}>{formatSize(file.size)}</span>
            </>
          ) : isDragging ? (
            <>
              <span style={{ fontSize: '48px' }}>📂</span>
              <span style={{ color: '#FFFFFF', fontSize: '16px', fontWeight: '600' }}>Drop it here!</span>
            </>
          ) : (
            <>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#0F62FE" strokeWidth="1.5">
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
            width: '100%', height: '52px', marginTop: '20px',
            backgroundColor: file ? '#0F62FE' : '#C6C6C6',
            color: '#FFFFFF', border: 'none', borderRadius: '8px',
            fontSize: '18px', fontWeight: '600', cursor: file ? 'pointer' : 'not-allowed',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
          }}>
          ✨ Analyse with Vantage
        </button>
      </div>
    </>
  )
}
