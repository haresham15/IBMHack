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
  const [syllabi, setSyllabi] = useState([])
  const [hoveredSyllabus, setHoveredSyllabus] = useState(null)

  useEffect(() => {
    const supabase = createClient()

    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }

      // Load CAP profile
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

      // Load syllabi
      const { data: syllabusRows } = await supabase
        .from('syllabi')
        .select('*')
        .eq('user_id', user.id)
        .order('uploaded_at', { ascending: false })

      if (syllabusRows) {
        setSyllabi(syllabusRows.map(s => ({
          id: s.id,
          courseName: s.course_name,
          instructor: s.instructor,
          term: s.term,
          uploadedAt: s.uploaded_at
        })))

        // Load tasks for all syllabi
        const syllabusIds = syllabusRows.map(s => s.id)
        if (syllabusIds.length > 0) {
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

  const filteredTasks = sortByDue(filterByTimeHorizon(tasks, capProfile.timeHorizon))

  return (
    <>
      <Navbar showNav={true} />
      <div style={{ paddingTop: '48px', fontFamily: 'IBM Plex Sans, sans-serif', minHeight: '100vh', backgroundColor: '#F4F4F4' }}>

        {/* Greeting bar */}
        <div style={{
          background: 'linear-gradient(135deg, #0F62FE, #001D6C)',
          color: '#FFFFFF',
          padding: '28px 32px',
          borderRadius: '0 0 12px 12px',
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
              <div style={{ fontSize: '56px', marginBottom: '16px' }}>&#x1F393;</div>
              <div style={{ fontWeight: 'bold', fontSize: '18px', color: '#161616', marginBottom: '12px' }}>
                Upload your first syllabus
              </div>
              <div style={{ color: '#525252', marginBottom: '24px' }}>
                Vantage will turn it into a personalised task list.
              </div>
              <button aria-label="Navigate to upload a syllabus page" onClick={() => router.push('/upload')} style={{
                backgroundColor: '#0F62FE', color: '#FFFFFF', border: 'none',
                borderRadius: '8px', padding: '12px 28px', fontSize: '15px',
                fontWeight: '600', cursor: 'pointer'
              }}>Upload a Syllabus</button>
            </div>
          ) : (
            <>
              {/* Upcoming Tasks */}
              <div style={{ marginBottom: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#0F62FE' }}>
                    Upcoming Tasks
                  </h2>
                  <span style={{
                    backgroundColor: '#0F62FE', color: '#FFFFFF',
                    borderRadius: '12px', padding: '2px 10px',
                    fontWeight: 'bold', fontSize: '13px'
                  }}>{filteredTasks.length}</span>
                </div>
                <div style={{ fontSize: '13px', color: '#525252', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#198038' }} />
                  Filtered to your {capProfile.timeHorizon} time horizon
                </div>

                {filteredTasks.length === 0 ? (
                  <div style={{
                    backgroundColor: '#FFFFFF', borderRadius: '8px',
                    padding: '32px', textAlign: 'center', color: '#525252',
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
                    role="button"
                    tabIndex={0}
                    aria-label={`View parsed tasks for ${s.courseName}`}
                    onClick={() => router.push(`/syllabus/${s.id}`)}
                    onKeyDown={e => { if (e.key === 'Enter') router.push(`/syllabus/${s.id}`) }}
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
                      &#x2192; View
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* IBM Footer */}
        <div style={{ textAlign: 'center', color: '#525252', fontSize: '11px', padding: '12px', borderTop: '1px solid #E0E0E0', marginTop: '32px' }}>
          Powered by IBM Granite &amp; WatsonX • IBM SkillsBuild Hackathon 2025
        </div>
      </div>
    </>
  )
}
