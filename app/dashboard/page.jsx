'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AgentAlert from '@/components/AgentAlert'
import TaskCard from '@/components/TaskCard'
import Navbar from '@/components/Navbar'

function timeOfDay() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}

function formatDate() {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}

function hoursFromHorizon(horizon) {
  switch (horizon) {
    case '24h': return 24
    case '72h': return 72
    case '1week': return 24 * 7
    case '2weeks': return 24 * 14
    default: return 72
  }
}

function filterByHorizon(tasks, horizon) {
  const cutoff = new Date(Date.now() + hoursFromHorizon(horizon) * 60 * 60 * 1000)
  return tasks.filter(t => {
    if (!t.dueDate) return true
    return new Date(t.dueDate + 'T00:00:00') <= cutoff
  })
}

function sortByDue(tasks) {
  const PRIO = { high: 0, medium: 1, low: 2 }
  return [...tasks].sort((a, b) => {
    if (!a.dueDate && !b.dueDate) return (PRIO[a.priority] ?? 1) - (PRIO[b.priority] ?? 1)
    if (!a.dueDate) return 1
    if (!b.dueDate) return -1
    const diff = new Date(a.dueDate) - new Date(b.dueDate)
    if (diff !== 0) return diff
    return (PRIO[a.priority] ?? 1) - (PRIO[b.priority] ?? 1)
  })
}

export default function DashboardPage() {
  const router = useRouter()
  const [capProfile, setCapProfile] = useState(null)
  const [alert, setAlert] = useState(null)
  const [tasks, setTasks] = useState([])
  const [completed, setCompleted] = useState([])
  const [syllabi, setSyllabi] = useState([])
  const [syllabusHover, setSyllabusHover] = useState(null)

  useEffect(() => {
    const cap = localStorage.getItem('vantage_cap')
    if (!cap) { router.push('/onboarding'); return }
    setCapProfile(JSON.parse(cap))

    const t = localStorage.getItem('vantage_tasks')
    if (t) setTasks(JSON.parse(t))

    const c = localStorage.getItem('vantage_completed')
    if (c) setCompleted(JSON.parse(c))

    const s = localStorage.getItem('vantage_syllabi')
    if (s) setSyllabi(JSON.parse(s))

    fetch('/api/agent').then(r => r.json()).then(setAlert).catch(() => {})
  }, [router])

  function handleComplete(id) {
    const next = completed.includes(id)
      ? completed.filter(c => c !== id)
      : [...completed, id]
    setCompleted(next)
    localStorage.setItem('vantage_completed', JSON.stringify(next))
  }

  if (!capProfile) return null

  const tasksWithCompleted = tasks.map(t => ({ ...t, completed: completed.includes(t.id) }))
  const filteredTasks = sortByDue(filterByHorizon(tasksWithCompleted, capProfile.timeHorizon))

  return (
    <>
      <Navbar />
      <div style={{ paddingTop: '48px', fontFamily: 'IBM Plex Sans, sans-serif', minHeight: '100vh', backgroundColor: '#F4F4F4' }}>
        {/* Greeting bar */}
        <div style={{
          background: 'linear-gradient(135deg, #0F62FE, #001D6C)',
          color: '#FFFFFF', padding: '28px 32px', borderRadius: '0 0 12px 12px'
        }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
            Good {timeOfDay()}, {capProfile.displayName}.
          </div>
          <div style={{ fontSize: '14px', color: '#93C5FD', marginTop: '4px' }}>{formatDate()}</div>
        </div>

        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '24px' }}>
          {/* Agent Alert */}
          {alert && (
            <div style={{ marginBottom: '20px' }}>
              <AgentAlert alert={alert} onAction={() => router.push('/agent')} />
            </div>
          )}

          {/* Tasks */}
          {tasks.length === 0 ? (
            <div style={{
              backgroundColor: '#FFFFFF', borderRadius: '12px',
              padding: '48px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
            }}>
              <div style={{ fontSize: '56px', marginBottom: '16px' }}>🎓</div>
              <div style={{ fontWeight: 'bold', fontSize: '18px', color: '#161616', marginBottom: '12px' }}>
                Upload your first syllabus
              </div>
              <div style={{ color: '#525252', marginBottom: '24px' }}>
                Vantage will turn it into a personalised task list.
              </div>
              <button onClick={() => router.push('/upload')} style={{
                backgroundColor: '#0F62FE', color: '#FFFFFF', border: 'none',
                borderRadius: '8px', padding: '12px 28px', fontSize: '15px',
                fontWeight: '600', cursor: 'pointer', width: '100%', maxWidth: '300px'
              }}>Upload a Syllabus</button>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#0F62FE' }}>
                  Upcoming Tasks
                </h2>
                <span style={{
                  backgroundColor: '#0F62FE', color: '#FFFFFF',
                  borderRadius: '12px', padding: '2px 10px', fontWeight: 'bold', fontSize: '13px'
                }}>{filteredTasks.length}</span>
              </div>
              {filteredTasks.map(task => (
                <TaskCard key={task.id} task={task} onComplete={handleComplete} />
              ))}
            </div>
          )}

          {/* Syllabi list */}
          {syllabi.length > 0 && (
            <div style={{ marginTop: '32px' }}>
              <h2 style={{ fontSize: '18px', color: '#161616', marginBottom: '12px' }}>My Syllabi</h2>
              {syllabi.map(s => (
                <div key={s.id}
                  onClick={() => router.push(`/syllabus/${s.id}`)}
                  onMouseEnter={() => setSyllabusHover(s.id)}
                  onMouseLeave={() => setSyllabusHover(null)}
                  style={{
                    backgroundColor: syllabusHover === s.id ? '#EFF4FF' : '#FFFFFF',
                    borderRadius: '8px', padding: '16px 20px', marginBottom: '8px',
                    cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    border: syllabusHover === s.id ? '1px solid #0F62FE' : '1px solid transparent',
                    transition: 'background 150ms, border 150ms'
                  }}>
                  <div>
                    <div style={{ fontWeight: '600', color: '#161616', fontSize: '15px' }}>{s.courseName}</div>
                    <div style={{ color: '#525252', fontSize: '13px', marginTop: '2px' }}>
                      {[s.term, s.uploadedAt ? new Date(s.uploadedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : null].filter(Boolean).join(' • ')}
                    </div>
                  </div>
                  <span style={{ color: '#0F62FE', fontSize: '14px' }}>View →</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
