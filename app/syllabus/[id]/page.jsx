'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import TaskCard from '@/components/TaskCard'
import Navbar from '@/components/Navbar'
import { createClient } from '@/lib/supabase/client'

const FILTERS = ['All', 'Due This Week', 'High Priority']
const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 }

function isThisWeek(dateStr) {
  if (!dateStr) return false
  const d = new Date(dateStr + 'T00:00:00')
  const now = new Date()
  const week = new Date(now)
  week.setDate(now.getDate() + 7)
  return d >= now && d <= week
}

function sortByDue(tasks) {
  return [...tasks].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1
    if (!a.dueDate && !b.dueDate) return (PRIORITY_ORDER[a.priority] ?? 1) - (PRIORITY_ORDER[b.priority] ?? 1)
    if (!a.dueDate) return 1
    if (!b.dueDate) return -1
    return new Date(a.dueDate) - new Date(b.dueDate)
  })
}

export default function SyllabusPage() {
  const { id } = useParams()
  const [tasks, setTasks] = useState([])
  const [syllabus, setSyllabus] = useState(null)
  const [activeFilter, setActiveFilter] = useState('All')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    async function loadData() {
      const { data: sylRow } = await supabase
        .from('syllabi')
        .select('*')
        .eq('id', id)
        .maybeSingle()

      if (sylRow) {
        setSyllabus({
          id: sylRow.id,
          courseName: sylRow.course_name,
          instructor: sylRow.instructor,
          term: sylRow.term
        })
      }

      const { data: taskRows } = await supabase
        .from('tasks')
        .select('*')
        .eq('syllabus_id', id)

      if (taskRows) {
        setTasks(taskRows.map(t => ({
          id: t.id,
          title: t.title,
          plainEnglishDescription: t.plain_english_description,
          dueDate: t.due_date,
          priority: t.priority,
          estimatedMinutes: t.estimated_minutes,
          confidence: t.confidence,
          steps: t.steps,
          type: t.type,
          completed: t.completed
        })))
      }

      setLoading(false)
    }

    loadData()
  }, [id])

  async function handleComplete(tid) {
    const supabase = createClient()
    const task = tasks.find(t => t.id === tid)
    if (!task) return
    const next = !task.completed
    setTasks(prev => prev.map(t => t.id === tid ? { ...t, completed: next } : t))
    await supabase.from('tasks').update({ completed: next }).eq('id', tid)
  }

  const filtered = sortByDue(tasks.filter(t => {
    if (activeFilter === 'Due This Week') return isThisWeek(t.dueDate)
    if (activeFilter === 'High Priority') return t.priority === 'high'
    return true
  }))

  if (loading) return null

  if (tasks.length === 0) {
    return (
      <>
        <Navbar showNav={true} />
        <div style={{ paddingTop: '48px', fontFamily: 'IBM Plex Sans, sans-serif', minHeight: '100vh', backgroundColor: '#F4F4F4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>&#x1F4C2;</div>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#161616', marginBottom: '8px' }}>No tasks found</h2>
            <p style={{ color: '#525252', fontSize: '14px', marginBottom: '24px' }}>Upload a syllabus to generate your personalised task list.</p>
            <a href="/upload" style={{
              backgroundColor: '#4A90C4', color: '#FFFFFF', border: 'none',
              borderRadius: '8px', padding: '12px 24px', fontSize: '15px',
              fontWeight: '600', textDecoration: 'none', display: 'inline-block'
            }}>Upload a Syllabus</a>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Navbar showNav={true} />
      <div style={{ paddingTop: '48px', fontFamily: 'IBM Plex Sans, sans-serif', minHeight: '100vh', backgroundColor: '#F4F4F4' }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(180deg, #3a85b8 0%, #DAEEFB 100%)',
          padding: '28px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'
        }}>
          <div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#FFFFFF' }}>
              {syllabus?.courseName || 'Course Syllabus'}
            </div>
            <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)', marginTop: '4px' }}>
              {syllabus?.instructor} {syllabus?.term ? `• ${syllabus.term}` : ''}
            </div>
          </div>
          <a href={`/api/syllabus/${id}/original`} target="_blank" rel="noreferrer"
            style={{
              backgroundColor: 'rgba(255,255,255,0.9)', color: '#3a85b8',
              border: 'none', borderRadius: '6px', padding: '8px 16px',
              fontSize: '14px', fontWeight: '600', textDecoration: 'none',
              display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap'
            }}>
            &#x1F517; View Original PDF
          </a>
        </div>

        {/* Filter tabs */}
        <div style={{ backgroundColor: '#FFFFFF', padding: '12px 32px', display: 'flex', gap: '8px', borderBottom: '1px solid #E0E0E0' }}>
          {FILTERS.map(f => (
            <button key={f} onClick={() => setActiveFilter(f)} style={{
              border: '1px solid #4A90C4',
              backgroundColor: activeFilter === f ? '#4A90C4' : '#FFFFFF',
              color: activeFilter === f ? '#FFFFFF' : '#4A90C4',
              borderRadius: '20px', padding: '6px 16px', cursor: 'pointer', fontSize: '14px', fontWeight: '500'
            }}>{f}</button>
          ))}
        </div>

        {/* Tasks grid */}
        <div style={{
          maxWidth: '900px', margin: '0 auto', padding: '24px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
          gap: '16px'
        }}>
          {filtered.map(task => (
            <TaskCard key={task.id} task={task} onComplete={handleComplete} />
          ))}
          {filtered.length === 0 && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', color: '#525252', padding: '40px' }}>
              No tasks match this filter.
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', color: '#525252', fontSize: '12px', padding: '16px', borderTop: '1px solid #E0E0E0' }}>
          Powered by IBM Granite and WatsonX • IBM SkillsBuild Hackathon 2025
        </div>
      </div>
    </>
  )
}
