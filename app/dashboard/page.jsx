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

function sortByDue(tasks) {
  return [...tasks].sort((a, b) => {
    if (!a.dueDate && !b.dueDate) return 0
    if (!a.dueDate) return 1
    if (!b.dueDate) return -1
    return new Date(a.dueDate) - new Date(b.dueDate)
  })
}

export default function DashboardPage() {
  const router = useRouter()
  const [capProfile, setCapProfile] = useState(null)
  const [alert, setAlert] = useState(null)
  const [tasks, setTasks] = useState([])
  const [completed, setCompleted] = useState([])
  const [syllabi, setSyllabi] = useState([])

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

  return (
    <>
      <Navbar />
      <div style={{ paddingTop: '48px', fontFamily: 'IBM Plex Sans, sans-serif', minHeight: '100vh', backgroundColor: '#F4F4F4' }}>
        {/* Greeting bar */}
        <div style={{
          background: 'linear-gradient(135deg, #0F62FE, #001D6C)',
          color: '#FFFFFF', padding: '24px 32px'
        }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
            Good {timeOfDay()}, {capProfile.displayName}.
          </div>
          <div style={{ fontSize: '14px', color: '#93C5FD', marginTop: '4px' }}>{formatDate()}</div>
        </div>

        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '24px 24px' }}>
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
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎓</div>
              <div style={{ fontWeight: 'bold', fontSize: '18px', color: '#161616', marginBottom: '12px' }}>
                Upload your first syllabus
              </div>
              <div style={{ color: '#525252', marginBottom: '24px' }}>
                Vantage will turn it into a personalised task list.
              </div>
              <button onClick={() => router.push('/upload')} style={{
                backgroundColor: '#0F62FE', color: '#FFFFFF', border: 'none',
                borderRadius: '8px', padding: '12px 28px', fontSize: '15px',
                fontWeight: '600', cursor: 'pointer'
              }}>Upload a Syllabus</button>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <h2 style={{ margin: 0, fontSize: '18px', color: '#161616' }}>Upcoming Tasks</h2>
                <span style={{
                  backgroundColor: '#0F62FE', color: '#FFFFFF',
                  borderRadius: '12px', padding: '2px 10px', fontWeight: 'bold', fontSize: '13px'
                }}>{tasks.length}</span>
              </div>
              {sortByDue(tasksWithCompleted).map(task => (
                <TaskCard key={task.id} task={task} onComplete={handleComplete} />
              ))}
            </div>
          )}

          {/* Syllabi list */}
          {syllabi.length > 0 && (
            <div style={{ marginTop: '32px' }}>
              <h2 style={{ fontSize: '18px', color: '#161616', marginBottom: '12px' }}>My Syllabi</h2>
              {syllabi.map(s => (
                <div key={s.id} onClick={() => router.push(`/syllabus/${s.id}`)}
                  style={{
                    backgroundColor: '#FFFFFF', borderRadius: '8px',
                    padding: '16px 20px', marginBottom: '8px',
                    cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                  }}>
                  <span style={{ fontWeight: '600', color: '#161616' }}>{s.courseName}</span>
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
