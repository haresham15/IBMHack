'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import TaskCard from '@/components/TaskCard'
import Navbar from '@/components/Navbar'
import { createClient } from '@/lib/supabase/client'
import { useUIConfig } from '@/lib/useUIConfig'

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
  const [activeTab, setActiveTab] = useState(null)

  // ── ML Theme ──────────────────────────────────────────────────────────────
  const { theme } = useUIConfig(capProfile)

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

      const capObj = {
        displayName: cap.display_name,
        informationDensity: cap.information_density,
        timeHorizon: cap.time_horizon,
        sensoryFlags: cap.sensory_flags,
        supportLevel: cap.support_level,
        disorders: cap.disorders || [],
      }
      setCapProfile(capObj)

      const { data: syllabusRows } = await supabase
        .from('syllabi')
        .select('*')
        .eq('user_id', user.id)
        .order('uploaded_at', { ascending: false })

      if (syllabusRows && syllabusRows.length > 0) {
        const mapped = syllabusRows.map(s => ({
          id: s.id, courseName: s.course_name,
          instructor: s.instructor, term: s.term, uploadedAt: s.uploaded_at
        }))
        setSyllabi(mapped)
        setActiveTab(mapped[0].id)

        const { data: taskRows } = await supabase
          .from('tasks').select('*')
          .in('syllabus_id', syllabusRows.map(s => s.id))

        if (taskRows) {
          setTasks(taskRows.map(t => ({
            id: t.id, syllabusId: t.syllabus_id,
            title: t.title, plainEnglishDescription: t.plain_english_description,
            dueDate: t.due_date, priority: t.priority,
            estimatedMinutes: t.estimated_minutes, confidence: t.confidence,
            steps: t.steps, type: t.type, completed: t.completed
          })))
        }
      }

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

  // ── Theme-derived values ──────────────────────────────────────────────────
  const minTarget = theme.largeTargets ? '52px' : '44px'
  const motionCSS = theme.reduceMotion
    ? '@media (prefers-reduced-motion: no-preference) { * { transition-duration: 0ms !important; animation-duration: 0ms !important; } }'
    : ''

  return (
    <>
      <style>{`
        :root {
          --bg:       ${theme.bg};
          --bg-alt:   ${theme.bgAlt};
          --text:     ${theme.text};
          --accent:   ${theme.accent};
          --surface:  ${theme.surface};
          --border:   ${theme.border};
          --subtext:  ${theme.subtext};
          --font:     ${theme.fontFamily};
          --fz-body:  ${theme.fontSize};
          --fz-head:  ${theme.fontSizeH};
          --fz-small: ${theme.fontSizeS};
          --lh:       ${theme.lineHeight};
          --min-tap:  ${minTarget};
        }
        body { background: var(--bg); color: var(--text); font-family: var(--font); }
        .course-tab {
          border: none; cursor: pointer; font-family: var(--font);
          font-size: var(--fz-small); font-weight: 600;
          padding: 10px 20px; white-space: nowrap;
          transition: background 150ms, color 150ms, border-bottom 150ms;
          border-bottom: 3px solid transparent;
          background: transparent; min-height: var(--min-tap);
          color: var(--subtext);
        }
        .course-tab:hover:not(.active-tab) { background: color-mix(in srgb, var(--accent) 8%, transparent); color: var(--accent); }
        .active-tab { color: var(--accent); border-bottom: 3px solid var(--accent); background: color-mix(in srgb, var(--accent) 6%, transparent); }
        ${motionCSS}
      `}</style>

      <Navbar showNav={true} />
      <div style={{ paddingTop: '48px', fontFamily: 'var(--font)', minHeight: '100vh', backgroundColor: 'var(--bg)' }}>


        {/* Agent Alert */}

        {/* Empty state */}
        {syllabi.length === 0 ? (
          <div style={{ maxWidth: '900px', margin: '32px auto', padding: '0 24px' }}>
            <div style={{
              backgroundColor: 'var(--surface)', borderRadius: '12px',
              padding: '56px 48px', textAlign: 'center',
              border: '1px solid var(--border)', boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
            }}>
              <div style={{ fontSize: '56px', marginBottom: '16px' }}>&#x1F393;</div>
              <div style={{ fontWeight: 'bold', fontSize: 'var(--fz-head)', color: 'var(--text)', marginBottom: '12px' }}>
                Upload your first syllabus
              </div>
              <div style={{ color: 'var(--subtext)', marginBottom: '24px', fontSize: 'var(--fz-body)', lineHeight: 'var(--lh)' }}>
                Vantage will turn it into a personalised task list.
              </div>
              <button onClick={() => router.push('/upload')} style={{
                backgroundColor: 'var(--accent)', color: '#FFFFFF', border: 'none',
                borderRadius: '8px', padding: '12px 28px', fontSize: 'var(--fz-body)',
                fontWeight: '600', cursor: 'pointer', minHeight: 'var(--min-tap)'
              }}>Upload a Syllabus</button>
            </div>
          </div>
        ) : (
          <>
            {/* Course tab bar */}
            <div style={{
              backgroundColor: 'var(--surface)', borderBottom: '1px solid var(--border)',
              overflowX: 'auto', display: 'flex', alignItems: 'stretch', paddingLeft: '16px'
            }}>
              {syllabi.map(s => (
                <button key={s.id}
                  className={`course-tab${activeTab === s.id ? ' active-tab' : ''}`}
                  onClick={() => setActiveTab(s.id)}>
                  {s.courseName}
                </button>
              ))}
              <button className="course-tab"
                onClick={() => router.push('/upload')}
                style={{ color: 'var(--accent)', marginLeft: '4px' }}>
                + Add Course
              </button>
            </div>

            {activeSyllabus && (
              <div style={{ maxWidth: '900px', margin: '0 auto', padding: '24px' }}>

                {/* Course meta */}
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                  marginBottom: '20px', flexWrap: 'wrap', gap: '12px'
                }}>
                  <div>
                    <h2 style={{ margin: 0, fontSize: 'var(--fz-head)', fontWeight: 'bold', color: 'var(--text)' }}>
                      {activeSyllabus.courseName}
                    </h2>
                    <div style={{ fontSize: 'var(--fz-small)', color: 'var(--subtext)', marginTop: '4px', lineHeight: 'var(--lh)' }}>
                      {[activeSyllabus.instructor, activeSyllabus.term].filter(Boolean).join(' · ')}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    {tabTasks.length > 0 && (
                      <div style={{
                        backgroundColor: completedCount === tabTasks.length
                          ? 'color-mix(in srgb, #198038 15%, transparent)'
                          : 'color-mix(in srgb, var(--accent) 10%, transparent)',
                        color: completedCount === tabTasks.length ? '#198038' : 'var(--accent)',
                        borderRadius: '12px', padding: '4px 12px',
                        fontSize: 'var(--fz-small)', fontWeight: '600'
                      }}>
                        {completedCount}/{tabTasks.length} done
                      </div>
                    )}
                    <button onClick={() => router.push(`/syllabus/${activeSyllabus.id}`)} style={{
                      background: 'none', border: `1px solid var(--accent)`,
                      color: 'var(--accent)', borderRadius: '6px',
                      padding: '6px 14px', cursor: 'pointer',
                      fontSize: 'var(--fz-small)', fontWeight: '600',
                      minHeight: 'var(--min-tap)'
                    }}>View all tasks →</button>
                  </div>
                </div>

                {/* Time horizon label */}
                <div style={{ fontSize: 'var(--fz-small)', color: 'var(--subtext)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px', lineHeight: 'var(--lh)' }}>
                  <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#198038' }} />
                  Upcoming within your {capProfile.timeHorizon} time horizon
                </div>

                {/* Task grid */}
                {tabTasks.length === 0 ? (
                  <div style={{
                    backgroundColor: 'var(--surface)', borderRadius: '8px',
                    padding: '40px', textAlign: 'center', color: 'var(--subtext)',
                    border: '1px solid var(--border)'
                  }}>
                    No tasks due in your current time window. &#x1F389;
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: theme.raw?.font_size === 'xl' ? '1fr' : 'repeat(auto-fill, minmax(340px, 1fr))', gap: theme.raw?.font_size === 'xl' ? '16px' : '12px' }}>
                    {tabTasks.map(task => (
                      <TaskCard key={task.id} task={task} onComplete={handleComplete} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        <div style={{ textAlign: 'center', color: 'var(--subtext)', fontSize: '11px', padding: '12px', borderTop: '1px solid var(--border)', marginTop: '32px' }}>
          Powered by IBM Granite &amp; WatsonX • IBM SkillsBuild Hackathon 2026
        </div>

        {/* Fixed sign out button */}
        <button onClick={handleSignOut} style={{
          position: 'fixed', bottom: '20px', right: '20px', zIndex: 50,
          background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--subtext)',
          borderRadius: '8px', padding: '8px 16px', fontSize: '12px',
          fontWeight: '500', cursor: 'pointer', transition: 'all 150ms',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)' }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--subtext)' }}
        >Sign out</button>
      </div>
    </>
  )
}
