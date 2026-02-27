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

function filterByTimeHorizon(tasks, timeHorizon) {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const days = { '24h': 1, '72h': 3, '1week': 7, '2weeks': 14 }[timeHorizon] ?? 7
  const cutoff = new Date(now)
  cutoff.setDate(now.getDate() + days)
  return tasks.filter(t => {
    if (!t.dueDate) return true
    const due = new Date(t.dueDate + 'T00:00:00')
    return due <= cutoff // includes overdue
  })
}

function sortByDue(tasks) {
  return [...tasks].sort((a, b) => {
    if (!a.dueDate && !b.dueDate) return 0
    if (!a.dueDate) return 1
    if (!b.dueDate) return -1
    return new Date(a.dueDate) - new Date(b.dueDate)
  })
}

function formatUploadDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function DashboardPage() {
  const router = useRouter()
  const [capProfile, setCapProfile] = useState(null)
  const [alert, setAlert] = useState(null)
  const [tasks, setTasks] = useState([])
  const [completed, setCompleted] = useState([])
  const [syllabi, setSyllabi] = useState([])
  const [hoveredSyllabus, setHoveredSyllabus] = useState(null)

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
  const filteredTasks = sortByDue(filterByTimeHorizon(tasksWithCompleted, capProfile.timeHorizon))

  return (
    <>
      <Navbar showNav={true} />
      <div style={{ paddingTop: '48px', fontFamily: 'IBM Plex Sans, sans-serif', minHeight: '100vh', backgroundColor: '#F4F4F4' }}>

        {/* Greeting bar */}
        <div style={{
          background: 'linear-gradient(135deg, #0F62FE, #001D6C)',
          color: '#FFFFFF',
          padding: '28px 32px',
          borderRadius: '0 0 12px 12px'
        }}>
          <div style={{ fontSize: '28px', fontWeight: 'bold' }}>
            Good {timeOfDay()}, {capProfile.displayName}.
          </div>
          <div style={{ fontSize: '14px', color: '#93C5FD', marginTop: '4px' }}>{formatDate()}</div>
        </div>

        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '24px' }}>

          {/* Agent Alert */}
          {alert && (
            <div style={{ marginBottom: '24px' }}>
              <AgentAlert alert={alert} onAction={() => router.push('/agent')} />
            </div>
          )}

          {/* Empty state — no syllabi yet */}
          {syllabi.length === 0 ? (
            <div style={{
              backgroundColor: '#FFFFFF', borderRadius: '12px',
              padding: '56px 48px', textAlign: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
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
                fontWeight: '600', cursor: 'pointer'
              }}>Upload a Syllabus</button>
            </div>
          ) : (
            <>
              {/* Upcoming Tasks */}
              <div style={{ marginBottom: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                  <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#0F62FE' }}>
                    Upcoming Tasks
                  </h2>
                  <span style={{
                    backgroundColor: '#0F62FE', color: '#FFFFFF',
                    borderRadius: '12px', padding: '2px 10px',
                    fontWeight: 'bold', fontSize: '13px'
                  }}>{filteredTasks.length}</span>
                </div>

                {filteredTasks.length === 0 ? (
                  <div style={{
                    backgroundColor: '#FFFFFF', borderRadius: '8px',
                    padding: '32px', textAlign: 'center', color: '#525252',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
                  }}>
                    No tasks due in your current time window. 🎉
                  </div>
                ) : (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                    gap: '12px'
                  }}>
                    {filteredTasks.map(task => (
                      <TaskCard key={task.id} task={task} onComplete={handleComplete} />
                    ))}
                  </div>
                )}
              </div>

              {/* My Syllabi */}
              <div>
                <h2 style={{ margin: '0 0 12px', fontSize: '18px', fontWeight: 'bold', color: '#161616' }}>
                  My Syllabi
                </h2>
                {syllabi.map(s => (
                  <div
                    key={s.id}
                    onClick={() => router.push(`/syllabus/${s.id}`)}
                    onMouseEnter={() => setHoveredSyllabus(s.id)}
                    onMouseLeave={() => setHoveredSyllabus(null)}
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '8px',
                      padding: '16px 20px',
                      marginBottom: '8px',
                      cursor: 'pointer',
                      border: `1px solid ${hoveredSyllabus === s.id ? '#0F62FE' : '#E0E0E0'}`,
                      boxShadow: hoveredSyllabus === s.id
                        ? '0 2px 8px rgba(15,98,254,0.12)'
                        : '0 1px 4px rgba(0,0,0,0.06)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      transition: 'border 150ms, box-shadow 150ms'
                    }}>
                    <div>
                      <div style={{ fontWeight: '600', color: '#161616', fontSize: '15px' }}>
                        {s.courseName}
                      </div>
                      <div style={{ fontSize: '13px', color: '#525252', marginTop: '2px' }}>
                        {[s.term, s.uploadedAt ? `Uploaded ${formatUploadDate(s.uploadedAt)}` : null].filter(Boolean).join(' • ')}
                      </div>
                    </div>
                    <span style={{ color: '#0F62FE', fontSize: '14px', fontWeight: '600', whiteSpace: 'nowrap' }}>
                      → View
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}
