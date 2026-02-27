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
  const [typeError, setTypeError] = useState(false)
  const [uploadError, setUploadError] = useState(null)
  const [translateError, setTranslateError] = useState(null)
  const [savedSyllabusId, setSavedSyllabusId] = useState(null)
  const [checkmarkKey, setCheckmarkKey] = useState(0)

  function handleFile(f) {
    if (!f) return
    if (f.type !== 'application/pdf') {
      setTypeError(true)
      return
    }
    setTypeError(false)
    setUploadError(null)
    setTranslateError(null)
    setSavedSyllabusId(null)
    setFile(f)
    setCheckmarkKey(k => k + 1)
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

  async function runTranslate(id, capProfile) {
    setTranslateError(null)
    try {
      const res = await fetch('/api/syllabus/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ syllabusId: id, capProfile })
      })
      const result = await res.json()
      if (!res.ok || result.error === 'AI_ERROR' || !result.tasks) throw new Error('AI_ERROR')

      localStorage.setItem('vantage_tasks', JSON.stringify(result.tasks))
      const existing = JSON.parse(localStorage.getItem('vantage_syllabi') || '[]')
      existing.push({
        id,
        courseName: result.courseName,
        instructor: result.instructor,
        term: result.term,
        uploadedAt: new Date().toISOString()
      })
      localStorage.setItem('vantage_syllabi', JSON.stringify(existing))
      router.push('/syllabus/' + id)
    } catch {
      setTranslateError('Granite processing failed. Please try again.')
      setIsProcessing(false)
    }
  }

  async function handleAnalyse() {
    if (!file) return

    const capRaw = localStorage.getItem('vantage_cap')
    if (!capRaw) {
      router.push('/onboarding')
      return
    }

    setIsProcessing(true)
    setUploadError(null)
    setTranslateError(null)

    let id = savedSyllabusId

    if (!id) {
      try {
        const formData = new FormData()
        formData.append('file', file)
        const res = await fetch('/api/syllabus/upload', { method: 'POST', body: formData })
        if (!res.ok) throw new Error('upload failed')
        const data = await res.json()
        id = data.syllabusId
        setSavedSyllabusId(id)
      } catch {
        setUploadError('Upload failed. Please try again.')
        setIsProcessing(false)
        return
      }
    }

    await runTranslate(id, JSON.parse(localStorage.getItem('vantage_cap')))
  }

  async function retryTranslate() {
    const capRaw = localStorage.getItem('vantage_cap')
    if (!capRaw || !savedSyllabusId) return
    setIsProcessing(true)
    await runTranslate(savedSyllabusId, JSON.parse(capRaw))
  }

  async function retryUpload() {
    setSavedSyllabusId(null)
    setUploadError(null)
    await handleAnalyse()
  }

  return (
    <>
      <style>{`
        @keyframes checkPop {
          0%   { transform: scale(0); opacity: 0; }
          70%  { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        .check-anim { animation: checkPop 400ms ease-out forwards; }
        .analyse-btn:active:not(:disabled) { transform: scale(0.97); }
      `}</style>

      <Navbar showNav={true} />
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

        {uploadError && (
          <div style={{ marginBottom: '20px' }}>
            <ErrorState message={uploadError} onRetry={retryUpload} />
          </div>
        )}

        {translateError && (
          <div style={{ marginBottom: '20px' }}>
            <ErrorState message={translateError} onRetry={retryTranslate} />
          </div>
        )}

        {/* Drop zone */}
        <div
          onClick={() => document.getElementById('file-input').click()}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          style={{
            height: '480px',
            border: `2px ${isDragging ? 'solid' : 'dashed'} #0F62FE`,
            borderRadius: '12px',
            cursor: 'pointer',
            backgroundColor: isDragging ? '#0F62FE' : '#FFFFFF',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: '12px', transition: 'background 200ms, border 200ms'
          }}>
          <input
            id="file-input" type="file" accept=".pdf"
            style={{ display: 'none' }}
            onChange={e => handleFile(e.target.files[0])}
          />

          {file ? (
            <>
              <div key={checkmarkKey} className="check-anim" style={{ fontSize: '72px', lineHeight: 1 }}>✅</div>
              <span style={{ fontWeight: '600', color: '#161616', fontSize: '16px' }}>{file.name}</span>
              <span style={{ color: '#525252', fontSize: '14px' }}>{formatSize(file.size)}</span>
            </>
          ) : isDragging ? (
            <>
              <span style={{ fontSize: '72px' }}>📂</span>
              <span style={{ color: '#FFFFFF', fontSize: '18px', fontWeight: '600' }}>Drop it here!</span>
            </>
          ) : (
            <>
              <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="#0F62FE" strokeWidth="1.5">
                <path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M8 12l4-4 4 4M12 8v8" />
              </svg>
              <span style={{ color: '#525252', fontSize: '16px' }}>Drag your syllabus PDF here</span>
              <span style={{ color: '#0F62FE', fontSize: '14px', textDecoration: 'underline' }}>or click to browse</span>
            </>
          )}
        </div>

        {typeError && (
          <p style={{ color: '#DA1E28', fontSize: '14px', marginTop: '10px' }}>
            Only PDF files are accepted. Please upload a .pdf file.
          </p>
        )}

        <button
          className="analyse-btn"
          onClick={handleAnalyse}
          disabled={!file}
          style={{
            width: '100%', height: '56px', marginTop: '20px',
            backgroundColor: file ? '#0F62FE' : '#C6C6C6',
            color: '#FFFFFF', border: 'none', borderRadius: '8px',
            fontSize: '18px', fontWeight: '600',
            cursor: file ? 'pointer' : 'not-allowed',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            transition: 'transform 100ms'
          }}>
          ✨ Analyse with Vantage
        </button>

        {/* IBM Footer */}
        <div style={{ textAlign: 'center', color: '#525252', fontSize: '11px', padding: '12px', borderTop: '1px solid #E0E0E0', marginTop: '40px' }}>
          Powered by IBM Granite &amp; WatsonX • IBM SkillsBuild Hackathon 2025
        </div>
      </div>
    </>
  )
}
