'use client'
import { useState } from 'react'

const PRIORITY_COLORS = {
  high: '#DA1E28',
  medium: '#7D5A00', // darkened for AA contrast with white text
  low: '#198038'
}

function formatDueDate(dueDate) {
  if (!dueDate) return 'Due date TBD'
  const d = new Date(dueDate + 'T00:00:00')
  return 'Due ' + d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

function formatTime(minutes) {
  if (!minutes) return ''
  if (minutes >= 60) {
    const hrs = Math.round(minutes / 30) / 2
    return `~${hrs} hr`
  }
  return `~${minutes} min`
}

export default function TaskCard({ task, onComplete }) {
  const [stepsOpen, setStepsOpen] = useState(false)
  const [hovered, setHovered] = useState(false)
  const borderColor = PRIORITY_COLORS[task.priority] || '#525252'

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '8px',
        borderLeft: `5px solid ${borderColor}`,
        padding: '16px',
        marginBottom: '12px',
        boxShadow: hovered
          ? '0 4px 16px rgba(0,0,0,0.12)'
          : '0 2px 8px rgba(0,0,0,0.08)',
        transform: hovered ? 'translateY(-2px)' : 'none',
        transition: 'transform 150ms ease, box-shadow 150ms ease',
        opacity: task.completed ? 0.5 : 1,
        position: 'relative'
      }}>
      {/* Checkbox */}
      <input
        type="checkbox"
        checked={!!task.completed}
        onChange={() => onComplete && onComplete(task.id)}
        style={{ position: 'absolute', top: '16px', right: '16px', width: '18px', height: '18px', cursor: 'pointer' }}
      />

      {/* Row 1: Title + Badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', paddingRight: '28px' }}>
        <span style={{
          fontWeight: 'bold', fontSize: '15px', color: '#161616',
          textDecoration: task.completed ? 'line-through' : 'none'
        }}>{task.title}</span>
        <span style={{
          marginLeft: 'auto',
          backgroundColor: borderColor, color: '#FFFFFF',
          fontSize: '11px', borderRadius: '12px', padding: '2px 8px',
          fontWeight: '600', whiteSpace: 'nowrap'
        }}>{task.priority}</span>
      </div>

      {/* Row 2: Description */}
      <p style={{ color: '#525252', fontSize: '15px', lineHeight: 1.65, margin: '0 0 10px 0' }}>
        {task.plainEnglishDescription}
      </p>

      {/* Row 3: Steps */}
      {task.steps && task.steps.length > 0 && (
        <div style={{ marginBottom: '10px' }}>
          <button
            onClick={() => setStepsOpen(o => !o)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0F62FE', fontSize: '13px', padding: 0 }}>
            {stepsOpen ? '▾ Hide steps' : '▸ Show steps'}
          </button>
          {stepsOpen && (
            <ol style={{ margin: '8px 0 0 0', paddingLeft: '20px', color: '#525252', fontSize: '14px', lineHeight: 1.5 }}>
              {task.steps.map((s, i) => <li key={i}>{s}</li>)}
            </ol>
          )}
        </div>
      )}

      {/* Row 4: Due date / confidence / time */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px', color: '#525252' }}>
        <span>📅 {formatDueDate(task.dueDate)}</span>
        {task.confidence === 'low' && (
          <span style={{
            backgroundColor: '#FFF3CD', color: '#B28600',
            fontSize: '12px', borderRadius: '4px', padding: '2px 8px'
          }}>⚠ Verify this date</span>
        )}
        {task.estimatedMinutes && (
          <span style={{ marginLeft: 'auto' }}>🕐 {formatTime(task.estimatedMinutes)}</span>
        )}
      </div>
    </div>
  )
}
