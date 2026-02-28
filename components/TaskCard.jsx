'use client'
import { useState, useCallback } from 'react'
import { useStoredUIConfig } from '@/lib/useUIConfig'

const PRIORITY_COLORS = {
  high: '#DA1E28',
  medium: '#7D5A00',
  low: '#198038'
}

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 }

function formatDueDate(dueDate, noTimers) {
  if (!dueDate) return 'Ongoing'
  const d = new Date(dueDate + 'T00:00:00')
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const diffDays = Math.round((d - today) / 86400000)

  // no_timers: use relative language only, no specific dates
  if (noTimers) {
    if (diffDays < 0) return 'Past due'
    if (diffDays === 0) return 'Due today'
    if (diffDays === 1) return 'Due tomorrow'
    if (diffDays <= 7) return 'Due this week'
    if (diffDays <= 14) return 'Due next week'
    return 'Due later this term'
  }

  return 'Due ' + d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

function spokenText(task) {
  return `${task.title}. ${task.plainEnglishDescription ?? ''} Due: ${task.dueDate ?? 'TBD'}.`
}

function formatTime(minutes) {
  if (!minutes) return ''
  if (minutes >= 60) {
    const hrs = Math.round(minutes / 30) / 2
    return `~${hrs} hr`
  }
  return `~${minutes} min`
}

export { PRIORITY_ORDER }

export default function TaskCard({ task, onComplete }) {
  const theme = useStoredUIConfig()
  const [stepsOpen, setStepsOpen] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [speaking, setSpeaking] = useState(false)

  const borderColor = PRIORITY_COLORS[task.priority] || '#525252'
  const isMinimal = theme.infoMinimal           // info_density: minimal
  const bigTap = theme.largeTargets           // large_targets: true
  const showProg = theme.progressBars           // progress_bars: true
  const noTimers = theme.noTimers               // no_timers: true
  const noMotion = theme.reduceMotion           // motion: off/reduced
  const showSpeak = theme.readAloud              // read_aloud: true

  const handleSpeak = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const utt = new SpeechSynthesisUtterance(spokenText(task))
      utt.rate = 0.9
      utt.onstart = () => setSpeaking(true)
      utt.onend = () => setSpeaking(false)
      window.speechSynthesis.speak(utt)
    }
  }, [task])

  const progressPct = (task.steps?.length > 0 && stepsOpen) ? 0 : task.completed ? 100 : 0

  return (
    <div
      onMouseEnter={() => !noMotion && setHovered(true)}
      onMouseLeave={() => !noMotion && setHovered(false)}
      style={{
        backgroundColor: 'var(--surface, #FFFFFF)',
        borderRadius: bigTap ? '12px' : '8px',
        border: `1px solid var(--border, #E0E0E0)`,
        borderLeft: `5px solid ${borderColor}`,
        padding: bigTap ? '20px' : '16px',
        marginBottom: '12px',
        boxShadow: hovered ? '0 4px 16px rgba(0,0,0,0.12)' : '0 2px 8px rgba(0,0,0,0.06)',
        transform: hovered && !noMotion ? 'translateY(-2px)' : 'none',
        transition: noMotion ? 'none' : 'transform 150ms ease, box-shadow 150ms ease',
        opacity: task.completed ? 0.5 : 1,
        position: 'relative',
        fontFamily: 'var(--font, IBM Plex Sans, sans-serif)',
      }}>

      {/* Progress bar (progress_bars: true) */}
      {showProg && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
          backgroundColor: 'var(--border, #E0E0E0)', borderRadius: '8px 8px 0 0', overflow: 'hidden'
        }}>
          <div style={{
            width: task.completed ? '100%' : '0%',
            height: '100%',
            backgroundColor: borderColor,
            transition: 'width 600ms ease'
          }} />
        </div>
      )}

      {/* Large toggle checkbox (large_targets: true) vs standard checkbox */}
      {bigTap ? (
        <button
          onClick={() => onComplete && onComplete(task.id)}
          aria-label={task.completed ? 'Mark incomplete' : 'Mark complete'}
          style={{
            position: 'absolute', top: '16px', right: '16px',
            width: '42px', height: '42px', borderRadius: '8px',
            border: `2px solid ${task.completed ? 'var(--accent, #0F62FE)' : 'var(--border, #C6C6C6)'}`,
            backgroundColor: task.completed ? 'var(--accent, #0F62FE)' : 'transparent',
            cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: noMotion ? 'none' : 'all 200ms ease',
            color: task.completed ? '#fff' : 'transparent',
            flexShrink: 0
          }}>
          {task.completed ? '✓' : ''}
        </button>
      ) : (
        <input
          type="checkbox"
          checked={!!task.completed}
          onChange={() => onComplete && onComplete(task.id)}
          style={{
            position: 'absolute', top: '16px', right: '16px',
            width: '20px', height: '20px',
            cursor: 'pointer', accentColor: 'var(--accent, #0F62FE)'
          }}
        />
      )}

      {/* Row 1: Title + Source + Priority badge */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        marginBottom: isMinimal ? '6px' : '8px',
        paddingRight: bigTap ? '56px' : '32px', flexWrap: 'wrap'
      }}>
        <span style={{
          fontWeight: 'bold',
          fontSize: 'var(--fz-body, 15px)',
          color: 'var(--text, #161616)',
          lineHeight: 'var(--lh, 1.6)',
          textDecoration: task.completed ? 'line-through' : 'none'
        }}>{task.title}</span>
        {!isMinimal && task.syllabusId && (
          <a href={`/syllabus/${task.syllabusId}`} style={{
            fontSize: 'var(--fz-small, 11px)',
            color: 'var(--accent, #0F62FE)',
            textDecoration: 'none',
            backgroundColor: 'color-mix(in srgb, var(--accent, #0F62FE) 10%, transparent)',
            padding: '2px 6px', borderRadius: '4px'
          }}>↗ View Source</a>
        )}
        <span style={{
          marginLeft: 'auto',
          backgroundColor: borderColor, color: '#FFFFFF',
          fontSize: 'var(--fz-small, 11px)', borderRadius: '12px',
          padding: '2px 8px', fontWeight: '600', whiteSpace: 'nowrap'
        }}>{task.priority}</span>
      </div>

      {/* Row 2: Description — hidden in minimal mode */}
      {!isMinimal && (
        <p style={{
          color: 'var(--subtext, #525252)',
          fontSize: 'var(--fz-body, 15px)',
          lineHeight: 'var(--lh, 1.65)',
          margin: '0 0 10px 0'
        }}>{task.plainEnglishDescription}</p>
      )}

      {/* Row 3: Steps — hidden in minimal mode */}
      {!isMinimal && task.steps && task.steps.length > 0 && (
        <div style={{ marginBottom: '10px' }}>
          <button onClick={() => setStepsOpen(o => !o)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--accent, #0F62FE)',
            fontSize: 'var(--fz-small, 13px)', padding: 0
          }}>
            {stepsOpen ? '▾ Hide steps' : '▸ Show steps'}
          </button>
          <div style={{ maxHeight: stepsOpen ? '500px' : '0', overflow: 'hidden', transition: noMotion ? 'none' : 'max-height 300ms ease' }}>
            <ol style={{
              margin: '8px 0 0 0', paddingLeft: '20px',
              color: 'var(--subtext, #525252)',
              fontSize: 'var(--fz-small, 14px)',
              lineHeight: 'var(--lh, 1.5)'
            }}>
              {task.steps.map((s, i) => <li key={i}>{s}</li>)}
            </ol>
          </div>
        </div>
      )}

      {/* Row 4: Due date / read-aloud / time */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        fontSize: 'var(--fz-small, 13px)', color: 'var(--subtext, #525252)',
        flexWrap: 'wrap'
      }}>
        <span style={{ fontWeight: noTimers ? '600' : 'normal' }}>
          {noTimers ? '🗓' : '📅'} {formatDueDate(task.dueDate, noTimers)}
        </span>
        {!isMinimal && !noTimers && task.confidence === 'low' && (
          <span style={{ backgroundColor: '#FFF3CD', color: '#B28600', fontSize: 'var(--fz-small, 12px)', borderRadius: '4px', padding: '2px 8px' }}>
            ⚠ Verify date
          </span>
        )}
        {!isMinimal && task.estimatedMinutes && (
          <span>🕐 {formatTime(task.estimatedMinutes)}</span>
        )}

        {/* Read-aloud button (read_aloud: true) */}
        {showSpeak && (
          <button
            onClick={handleSpeak}
            title="Read this task aloud"
            style={{
              marginLeft: 'auto', background: 'none',
              border: `1px solid var(--border, #C6C6C6)`,
              borderRadius: '6px', padding: '3px 8px',
              cursor: 'pointer', fontSize: '14px',
              color: speaking ? 'var(--accent, #0F62FE)' : 'var(--subtext, #525252)',
              transition: 'color 150ms'
            }}>
            {speaking ? '🔊' : '🔈'}
          </button>
        )}
      </div>
    </div>
  )
}
