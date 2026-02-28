'use client'
import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import LoadingStages from '@/components/LoadingStages'
import Navbar from '@/components/Navbar'
import ErrorState from '@/components/ErrorState'
import { createClient } from '@/lib/supabase/client'

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

export default function UploadPage() {
  const router = useRouter()

  // Multi-file queue
  const [files, setFiles] = useState([])
  const [isDragging, setIsDragging] = useState(false)
  const [typeError, setTypeError] = useState(false)

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingIndex, setProcessingIndex] = useState(null) // which file is being processed
  const [errors, setErrors] = useState([]) // per-file errors
  const [capProfile, setCapProfile] = useState(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/'); return }
      const { data: cap } = await supabase
        .from('cap_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()
      if (!cap) { router.push('/onboarding'); return }
      setCapProfile({
        displayName: cap.display_name,
        informationDensity: cap.information_density,
        timeHorizon: cap.time_horizon,
        sensoryFlags: cap.sensory_flags,
        supportLevel: cap.support_level
      })
    })
  }, [router])

  function addFiles(newFiles) {
    const pdfs = Array.from(newFiles).filter(f => {
      if (f.type !== 'application/pdf') { setTypeError(true); return false }
      return true
    })
    if (pdfs.length > 0) {
      setTypeError(false)
      setErrors([])
      setFiles(prev => {
        // Deduplicate by name
        const existing = new Set(prev.map(f => f.name))
        return [...prev, ...pdfs.filter(f => !existing.has(f.name))]
      })
    }
  }

  function removeFile(index) {
    setFiles(prev => prev.filter((_, i) => i !== index))
    setErrors(prev => prev.filter((_, i) => i !== index))
  }

  const onDrop = useCallback(e => {
    e.preventDefault()
    setIsDragging(false)
    addFiles(e.dataTransfer.files)
  }, [])

  const onDragOver = useCallback(e => { e.preventDefault(); setIsDragging(true) }, [])
  const onDragLeave = () => setIsDragging(false)

  async function uploadAndTranslate(file, index, cap) {
    // 1. Upload
    const formData = new FormData()
    formData.append('file', file)
    const uploadRes = await fetch('/api/syllabus/upload', { method: 'POST', body: formData })
    if (!uploadRes.ok) throw new Error('upload_failed')
    const { syllabusId } = await uploadRes.json()

    // 2. Translate
    const transRes = await fetch('/api/syllabus/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ syllabusId, capProfile: cap })
    })
    const result = await transRes.json()
    if (!transRes.ok || result.error === 'AI_ERROR' || !result.tasks) throw new Error('ai_failed')

    // 3. Save to Supabase
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data: sylRow, error: sylErr } = await supabase
      .from('syllabi')
      .insert({
        user_id: user.id,
        course_name: result.courseName,
        instructor: result.instructor,
        term: result.term
      })
      .select('id')
      .single()

    if (sylErr) throw new Error('db_error')

    // Link Supabase row ID → upload PDF so "View Original PDF" works
    fetch('/api/syllabus/link-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ supabaseId: sylRow.id, syllabusId })
    }).catch(() => {})

    const taskRows = result.tasks.map(t => ({
      syllabus_id: sylRow.id,
      user_id: user.id,
      title: t.title,
      plain_english_description: t.plainEnglishDescription,
      due_date: t.dueDate || null,
      priority: t.priority,
      estimated_minutes: t.estimatedMinutes,
      confidence: t.confidence,
      steps: t.steps || [],
      type: t.type,
      completed: false
    }))

    await supabase.from('tasks').insert(taskRows)
    return sylRow.id
  }

  async function handleAnalyseAll() {
    if (files.length === 0 || !capProfile) return
    setIsProcessing(true)
    setErrors(new Array(files.length).fill(null))

    for (let i = 0; i < files.length; i++) {
      setProcessingIndex(i)
      try {
        await uploadAndTranslate(files[i], i, capProfile)
      } catch (err) {
        setErrors(prev => {
          const next = [...prev]
          next[i] = err.message === 'upload_failed'
            ? 'Upload failed — check your connection and try again.'
            : err.message === 'ai_failed'
              ? 'Granite processing failed — try again.'
              : 'Something went wrong — please try again.'
          return next
        })
      }
    }

    setProcessingIndex(null)
    setIsProcessing(false)
    router.push('/dashboard')
  }

  const hasErrors = errors.some(Boolean)

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
        .file-row:hover .remove-btn { opacity: 1 !important; }
      `}</style>

      <Navbar showNav={true} />
      <LoadingStages active={isProcessing} />

      <div style={{ fontFamily: 'IBM Plex Sans, sans-serif', maxWidth: '640px', margin: '0 auto', padding: '80px 24px 40px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#161616', marginBottom: '8px' }}>
          Add Courses
        </h1>
        <p style={{ color: '#525252', marginBottom: '28px' }}>
          Upload one or more syllabus PDFs — Vantage will create a personalised task list for each class.
        </p>

        {/* Drop zone */}
        <div
          onClick={() => document.getElementById('file-input').click()}
          onDrop={onDrop} onDragOver={onDragOver} onDragLeave={onDragLeave}
          style={{
            height: files.length === 0 ? '280px' : '140px',
            border: `2px ${isDragging ? 'solid' : 'dashed'} #0F62FE`,
            borderRadius: '12px', cursor: 'pointer',
            backgroundColor: isDragging ? '#EFF4FF' : '#FAFAFA',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: '10px', transition: 'background 200ms, border 200ms, height 300ms'
          }}>
          <input
            id="file-input" type="file" accept=".pdf" multiple
            style={{ display: 'none' }}
            onChange={e => addFiles(e.target.files)}
          />
          {isDragging ? (
            <>
              <span style={{ fontSize: '48px' }}>&#x1F4C2;</span>
              <span style={{ color: '#0F62FE', fontSize: '16px', fontWeight: '600' }}>Drop them here!</span>
            </>
          ) : (
            <>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#0F62FE" strokeWidth="1.5">
                <path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M8 12l4-4 4 4M12 8v8" />
              </svg>
              <span style={{ color: '#525252', fontSize: '15px' }}>
                {files.length === 0 ? 'Drag your syllabus PDFs here' : 'Drag more PDFs to add'}
              </span>
              <span style={{ color: '#0F62FE', fontSize: '13px', textDecoration: 'underline' }}>or click to browse</span>
            </>
          )}
        </div>

        {typeError && (
          <p style={{ color: '#DA1E28', fontSize: '14px', marginTop: '10px' }}>Only PDF files are accepted.</p>
        )}

        {/* File queue */}
        {files.length > 0 && (
          <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '13px', fontWeight: '600', color: '#525252', marginBottom: '4px' }}>
              {files.length} syllabus{files.length > 1 ? 'es' : ''} queued
            </div>
            {files.map((f, i) => (
              <div
                key={f.name + i}
                className="file-row"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  backgroundColor: errors[i] ? '#FFF5F5' : processingIndex === i ? '#EFF4FF' : '#FFFFFF',
                  border: `1px solid ${errors[i] ? '#DA1E28' : processingIndex === i ? '#0F62FE' : '#E0E0E0'}`,
                  borderRadius: '8px', padding: '12px 14px',
                  transition: 'all 200ms'
                }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                  <span style={{ fontSize: '22px', flexShrink: 0 }}>
                    {errors[i] ? '❌' : processingIndex === i ? '⏳' : '📄'}
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: '600', color: '#161616', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {f.name}
                    </div>
                    <div style={{ fontSize: '12px', color: errors[i] ? '#DA1E28' : '#525252', marginTop: '2px' }}>
                      {errors[i] || (processingIndex === i ? 'Processing with Granite…' : formatSize(f.size))}
                    </div>
                  </div>
                </div>
                {!isProcessing && (
                  <button
                    className="remove-btn"
                    onClick={e => { e.stopPropagation(); removeFile(i) }}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: '#525252', fontSize: '18px', opacity: 0,
                      transition: 'opacity 150ms', flexShrink: 0, padding: '4px 8px'
                    }}
                    title="Remove"
                  >×</button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Analyse button */}
        <button
          className="analyse-btn"
          onClick={handleAnalyseAll}
          disabled={files.length === 0 || !capProfile || isProcessing}
          style={{
            width: '100%', height: '56px', marginTop: '24px',
            backgroundColor: files.length > 0 && capProfile && !isProcessing ? '#0F62FE' : '#C6C6C6',
            color: '#FFFFFF', border: 'none', borderRadius: '8px',
            fontSize: '18px', fontWeight: '600',
            cursor: files.length > 0 && capProfile && !isProcessing ? 'pointer' : 'not-allowed',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'transform 100ms'
          }}>
          {isProcessing
            ? `✨ Analysing ${processingIndex !== null ? `(${processingIndex + 1}/${files.length})` : ''}…`
            : `✨ Analyse with Vantage${files.length > 1 ? ` (${files.length} courses)` : ''}`}
        </button>

        {hasErrors && !isProcessing && (
          <p style={{ color: '#DA1E28', fontSize: '13px', marginTop: '12px', textAlign: 'center' }}>
            Some syllabi failed to process. Remove them or try again.
          </p>
        )}

        {/* Footer */}
        <div style={{ textAlign: 'center', color: '#525252', fontSize: '11px', padding: '12px', borderTop: '1px solid #E0E0E0', marginTop: '40px' }}>
          Powered by IBM Granite &amp; WatsonX • IBM SkillsBuild Hackathon 2025
        </div>
      </div>
    </>
  )
}
