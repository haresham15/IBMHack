'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import TaskCard from '@/components/TaskCard'
import Navbar from '@/components/Navbar'

const FILTERS = ['All', 'Due This Week', 'High Priority']

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
<<<<<<< Updated upstream
    if (!a.dueDate && !b.dueDate) return 0
=======
    // Completed tasks always go last
    if (a.completed !== b.completed) return a.completed ? 1 : -1
    if (!a.dueDate && !b.dueDate) return (PRIORITY_ORDER[a.priority] ?? 1) - (PRIORITY_ORDER[b.priority] ?? 1)
>>>>>>> Stashed changes
    if (!a.dueDate) return 1
    if (!b.dueDate) return -1
    return new Date(a.dueDate) - new Date(b.dueDate)
  })
}

export default function SyllabusPage() {
  const { id } = useParams()
  const [tasks, setTasks] = useState([])
  const [syllabus, setSyllabus] = useState(null)
  const [completed, setCompleted] = useState([])
  const [activeFilter, setActiveFilter] = useState('All')

  useEffect(() => {
    const t = localStorage.getItem('vantage_tasks')
    if (t) setTasks(JSON.parse(t))

    const c = localStorage.getItem('vantage_completed')
    if (c) setCompleted(JSON.parse(c))

    const s = localStorage.getItem('vantage_syllabi')
    if (s) {
      const all = JSON.parse(s)
      setSyllabus(all.find(x => x.id === id) || null)
    }
  }, [id])

  function handleComplete(tid) {
    const next = completed.includes(tid)
      ? completed.filter(c => c !== tid)
      : [...completed, tid]
    setCompleted(next)
    localStorage.setItem('vantage_completed', JSON.stringify(next))
  }

  const tasksWithCompleted = tasks.map(t => ({ ...t, completed: completed.includes(t.id) }))

  const filtered = sortByDue(tasksWithCompleted.filter(t => {
    if (activeFilter === 'Due This Week') return isThisWeek(t.dueDate)
    if (activeFilter === 'High Priority') return t.priority === 'high'
    return true
  }))

<<<<<<< Updated upstream
=======
  const importantDates = syllabus?.importantDates || []
  const policies = syllabus?.policies || null

  if (tasks.length === 0) {
    return (
      <>
        <Navbar showNav={true} />
        <div style={{ paddingTop: '48px', fontFamily: 'IBM Plex Sans, sans-serif', minHeight: '100vh', backgroundColor: '#F4F4F4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📂</div>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#161616', marginBottom: '8px' }}>No tasks found</h2>
            <p style={{ color: '#525252', fontSize: '14px', marginBottom: '24px' }}>Upload a syllabus to generate your personalised task list.</p>
            <a href="/upload" style={{
              backgroundColor: '#0F62FE', color: '#FFFFFF', border: 'none',
              borderRadius: '8px', padding: '12px 24px', fontSize: '15px',
              fontWeight: '600', textDecoration: 'none', display: 'inline-block'
            }}>Upload a Syllabus</a>
          </div>
        </div>
      </>
    )
  }

>>>>>>> Stashed changes
  return (
    <>
      <Navbar showNav={true} />
      <div style={{ paddingTop: '48px', fontFamily: 'IBM Plex Sans, sans-serif', minHeight: '100vh', backgroundColor: '#F4F4F4' }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #0F62FE, #001D6C)',
          padding: '28px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'
        }}>
          <div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#FFFFFF' }}>
              {syllabus?.courseName || 'Course Syllabus'}
            </div>
            <div style={{ fontSize: '14px', color: '#93C5FD', marginTop: '4px' }}>
              {syllabus?.instructor} {syllabus?.term ? `• ${syllabus.term}` : ''}
            </div>
          </div>
          <a href={`/api/syllabus/${id}/original`} target="_blank" rel="noreferrer"
            style={{
              backgroundColor: '#FFFFFF', color: '#0F62FE',
              border: 'none', borderRadius: '6px', padding: '8px 16px',
              fontSize: '14px', fontWeight: '600', textDecoration: 'none',
              display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap'
            }}>
            🔗 View Original PDF
          </a>
        </div>

        {/* Filter tabs */}
        <div style={{ backgroundColor: '#FFFFFF', padding: '12px 32px', display: 'flex', gap: '8px', borderBottom: '1px solid #E0E0E0' }}>
          {FILTERS.map(f => (
            <button key={f} onClick={() => setActiveFilter(f)} style={{
              border: '1px solid #0F62FE',
              backgroundColor: activeFilter === f ? '#0F62FE' : '#FFFFFF',
              color: activeFilter === f ? '#FFFFFF' : '#0F62FE',
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

        {/* Policies section */}
        {syllabus?.policies && (
          <div style={{ maxWidth: '900px', margin: '0 auto 32px', padding: '0 24px' }}>
            <div style={{
              backgroundColor: '#F4F4F4', borderRadius: '8px', padding: '20px',
              border: '1px solid #E0E0E0'
            }}>
              <h3 style={{ margin: '0 0 12px', fontSize: '16px', color: '#161616' }}>Course Policies</h3>
              {syllabus.policies.attendance && (
                <p style={{ margin: '0 0 6px', fontSize: '14px', color: '#525252' }}>
                  <strong>Attendance:</strong> {syllabus.policies.attendance}
                </p>
              )}
              {syllabus.policies.lateWork && (
                <p style={{ margin: 0, fontSize: '14px', color: '#525252' }}>
                  <strong>Late Work:</strong> {syllabus.policies.lateWork}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ textAlign: 'center', color: '#525252', fontSize: '12px', padding: '16px', borderTop: '1px solid #E0E0E0' }}>
          Powered by IBM Granite and WatsonX • IBM SkillsBuild Hackathon 2025
        </div>
      </div>
    </>
  )
}
