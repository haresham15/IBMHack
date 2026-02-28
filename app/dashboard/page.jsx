'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AgentAlert from '@/components/AgentAlert'
import TaskCard from '@/components/TaskCard'
import Navbar from '@/components/Navbar'
import { createClient } from '@/lib/supabase/client'

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
    return due <= cutoff
  })
}

function sortByDue(tasks) {
  return [...tasks].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1
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
  const [syllabi, setSyllabi] = useState([])
  const [activeTab, setActiveTab] = useState(null) // syllabus id

  useEffect(() => {
    const supabase = createClient()

    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser()
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

      const { data: syllabusRows } = await supabase
        .from('syllabi')
        .select('*')
        .eq('user_id', user.id)
        .order('uploaded_at', { ascending: false })

      if (syllabusRows && syllabusRows.length > 0) {
        const mapped = syllabusRows.map(s => ({
          id: s.id,
          courseName: s.course_name,
          instructor: s.instructor,
          term: s.term,
          uploadedAt: s.uploaded_at
        }))
        setSyllabi(mapped)
        setActiveTab(mapped[0].id)

        const syllabusIds = syllabusRows.map(s => s.id)
        const { data: taskRows } = await supabase
          .from('tasks')
          .select('*')
          .in('syllabus_id', syllabusIds)

        if (taskRows) {
          setTasks(taskRows.map(t => ({
            id: t.id,
            syllabusId: t.syllabus_id,
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
      }

      fetch('/api/agent').then(r => r.json()).then(setAlert).catch(() => { })
    }

    loadData()
  }, [router])

  async function handleComplete(id) {
    const supabase = createClient()
    const task = tasks.find(t => t.id === id)
    if (!task) return
    const next = !task.completed
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: next } : t))
    await supabase.from('tasks').update({ completed: next }).eq('id', id)
  }

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  if (!capProfile) return null

  const activeSyllabus = syllabi.find(s => s.id === activeTab)
  const tabTasks = activeTab
    ? sortByDue(filterByTimeHorizon(tasks.filter(t => t.syllabusId === activeTab), capProfile.timeHorizon))
    : []

  const completedCount = tabTasks.filter(t => t.completed).length
  const totalCount = tabTasks.length

  return (
    <>
      <style>{`
        .course-tab {
          border: none;
          cursor: pointer;
          font-family: 'IBM Plex Sans', sans-serif;
          font-size: 14px;
          font-weight: 600;
          padding: 10px 20px;
          white-space: nowrap;
          transition: background 150ms, color 150ms, border-bottom 150ms;
          border-bottom: 3px solid transparent;
          background: transparent;
        }
        .course-tab:hover:not(.active-tab) {
          background: rgba(15,98,254,0.07);
          color: #0F62FE;
        }
        .active-tab {
          color: #0F62FE;
          border-bottom: 3px solid #0F62FE;
          background: rgba(15,98,254,0.06);
        }
        .add-tab {
          color: #0F62FE;
          font-size: 13px;
          font-weight: 600;
        }
      `}</style>

      <Navbar showNav={true} />
      <div style={{ paddingTop: '48px', fontFamily: 'IBM Plex Sans, sans-serif', minHeight: '100vh', backgroundColor: '#F4F4F4' }}>

        {/* Greeting bar */}
        <div style={{
          background: 'linear-gradient(135deg, #0F62FE, #001D6C)',
          color: '#FFFFFF',
          padding: '28px 32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ fontSize: '28px', fontWeight: 'bold' }}>
              Good {timeOfDay()}, {capProfile.displayName}.
            </div>
            <div style={{ fontSize: '14px', color: '#93C5FD', marginTop: '4px' }}>{formatDate()}</div>
          </div>
          <button
            onClick={handleSignOut}
            style={{
              background: 'rgba(255,255,255,0.15)',
              border: '1px solid rgba(255,255,255,0.3)',
              color: '#FFFFFF',
              borderRadius: '6px',
              padding: '8px 16px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '500'
            }}
          >
            Sign out
          </button>
        </div>

        {/* Agent Alert */}
        {alert && (
          <div style={{ maxWidth: '900px', margin: '16px auto 0', padding: '0 24px' }}>
            <AgentAlert alert={alert} onAction={() => router.push('/agent')} />
          </div>
        )}

        {/* Empty state */}
        {syllabi.length === 0 ? (
          <div style={{ maxWidth: '900px', margin: '32px auto', padding: '0 24px' }}>
            <div style={{
              backgroundColor: '#FFFFFF', borderRadius: '12px',
              padding: '56px 48px', textAlign: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
            }}>
              <div style={{ fontSize: '56px', marginBottom: '16px' }}>&#x1F393;</div>
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
          </div>
        ) : (
          <>
            {/* Course tab bar */}
            <div style={{
              backgroundColor: '#FFFFFF',
              borderBottom: '1px solid #E0E0E0',
              overflowX: 'auto',
              display: 'flex',
              alignItems: 'stretch',
              paddingLeft: '16px',
              gap: '0'
            }}>
              {syllabi.map(s => (
                <button
                  key={s.id}
                  className={`course-tab${activeTab === s.id ? ' active-tab' : ''}`}
                  onClick={() => setActiveTab(s.id)}
                >
                  {s.courseName}
                </button>
              ))}
              <button
                className="course-tab add-tab"
                onClick={() => router.push('/upload')}
                style={{ marginLeft: '4px' }}
              >
                + Add Course
              </button>
            </div>

            {/* Active course content */}
            {activeSyllabus && (
              <div style={{ maxWidth: '900px', margin: '0 auto', padding: '24px' }}>

                {/* Course meta + link */}
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                  marginBottom: '20px', flexWrap: 'wrap', gap: '12px'
                }}>
                  <div>
                    <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold', color: '#161616' }}>
                      {activeSyllabus.courseName}
                    </h2>
                    <div style={{ fontSize: '13px', color: '#525252', marginTop: '4px' }}>
                      {[activeSyllabus.instructor, activeSyllabus.term].filter(Boolean).join(' · ')}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    {/* Progress pill */}
                    {totalCount > 0 && (
                      <div style={{
                        backgroundColor: completedCount === totalCount ? '#D6F0E0' : '#EFF4FF',
                        color: completedCount === totalCount ? '#198038' : '#0F62FE',
                        borderRadius: '12px', padding: '4px 12px',
                        fontSize: '13px', fontWeight: '600'
                      }}>
                        {completedCount}/{totalCount} done
                      </div>
                    )}
                    <button
                      onClick={() => router.push(`/syllabus/${activeSyllabus.id}`)}
                      style={{
                        background: 'none', border: '1px solid #0F62FE',
                        color: '#0F62FE', borderRadius: '6px',
                        padding: '6px 14px', cursor: 'pointer',
                        fontSize: '13px', fontWeight: '600'
                      }}>
                      View all tasks →
                    </button>
                  </div>
                </div>

                {/* Time horizon label */}
                <div style={{ fontSize: '13px', color: '#525252', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#198038' }} />
                  Upcoming within your {capProfile.timeHorizon} time horizon
                </div>

                {/* Task grid */}
                {tabTasks.length === 0 ? (
                  <div style={{
                    backgroundColor: '#FFFFFF', borderRadius: '8px',
                    padding: '40px', textAlign: 'center', color: '#525252',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
                  }}>
                    No tasks due in your current time window. &#x1F389;
                  </div>
                ) : (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                    gap: '12px'
                  }}>
                    {tabTasks.map(task => (
                      <TaskCard key={task.id} task={task} onComplete={handleComplete} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Footer */}
        <div style={{ textAlign: 'center', color: '#525252', fontSize: '11px', padding: '12px', borderTop: '1px solid #E0E0E0', marginTop: '32px' }}>
          Powered by IBM Granite &amp; WatsonX • IBM SkillsBuild Hackathon 2025
        </div>
      </div>
    </>
  )
}
