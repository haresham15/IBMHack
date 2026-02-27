'use client'
import { useState } from 'react'

const PRIORITY_COLORS = { high: '#DA1E28', medium: '#B28600', low: '#198038' }
const PRIORITY_BG = { high: '#FFF1F1', medium: '#FFF8E1', low: '#F0FFF4' }

function formatDueDate(dueDate) {
  if (!dueDate) return 'Due date TBD'
  const d = new Date(dueDate + 'T00:00:00')
  const today = new Date(); today.setHours(0,0,0,0)
  const diffDays = Math.round((d - today) / 86400000)
  const label = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  if (diffDays < 0) return `⚠ Overdue — ${label}`
  if (diffDays === 0) return '🔴 Due today'
  if (diffDays === 1) return '🟠 Due tomorrow'
  if (diffDays <= 7) return `🟡 Due ${label}`
  return `📅 Due ${label}`
}

function formatTime(minutes) {
  if (!minutes) return ''
  if (minutes >= 60) return `~${Math.round(minutes / 60 * 10) / 10} hr`
  return `~${minutes} min`
}

export default function TaskCard({ task, onComplete }) {
  const [stepsOpen, setStepsOpen] = useState(false)
  const [hovered, setHovered] = useState(false)
  const color = PRIORITY_COLORS[task.priority] || '#525252'
  const bg = PRIORITY_BG[task.priority] || '#F4F4F4'

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        borderLeft: `4px solid ${color}`,
        padding: '18px 20px',
        boxShadow: hovered ? '0 8px 24px rgba(0,0,0,0.12)' : '0 2px 8px rgba(0,0,0,0.07)',
        transform: hovered ? 'translateY(-2px)' : 'none',
        transition: 'transform 150ms ease, box-shadow 150ms ease',
        opacity: task.completed ? 0.55 : 1,
        position: 'relative',
        overflow: 'hidden'
      }}>

      {/* Priority accent corner */}
      <div style={{
        position: 'absolute', top: 0, right: 0, width: '56px', height: '56px',
        background: `radial-gradient(circle at top right, ${bg}, transparent)`,
        borderRadius: '0 12px 0 0', pointerEvents: 'none'
      }} />

      {/* Checkbox */}
      <input type="checkbox" checked={!!task.completed}
        onChange={() => onComplete && onComplete(task.id)}
        style={{ position: 'absolute', top: '18px', right: '18px', width: '18px', height: '18px', cursor: 'pointer', accentColor: '#0F62FE' }}
      />

      {/* Title + badge */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '10px', paddingRight: '32px' }}>
        <span style={{
          fontWeight: '600', fontSize: '15px', color: '#161616', lineHeight: 1.4,
          textDecoration: task.completed ? 'line-through' : 'none', flex: 1
        }}>{task.title}</span>
        <span style={{
          backgroundColor: color, color: '#FFFFFF',
          fontSize: '10px', borderRadius: '20px', padding: '3px 9px',
          fontWeight: '700', whiteSpace: 'nowrap', textTransform: 'uppercase',
          letterSpacing: '0.5px', flexShrink: 0
        }}>{task.priority}</span>
      </div>

      {/* Description */}
      <p style={{ color: '#525252', fontSize: '14px', lineHeight: 1.7, margin: '0 0 12px 0' }}>
        {task.plainEnglishDescription}
      </p>

      {/* Steps */}
      {task.steps && task.steps.length > 0 && (
        <div style={{ marginBottom: '12px' }}>
          <button onClick={() => setStepsOpen(o => !o)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0F62FE', fontSize: '13px', padding: 0, fontWeight: '500' }}>
            {stepsOpen ? '▾ Hide steps' : '▸ Show steps'}
          </button>
          <div style={{ maxHeight: stepsOpen ? '400px' : '0', overflow: 'hidden', transition: 'max-height 300ms ease' }}>
            <ol style={{ margin: '10px 0 0 0', paddingLeft: '20px', color: '#525252', fontSize: '13px', lineHeight: 1.7 }}>
              {task.steps.map((s, i) => <li key={i} style={{ marginBottom: '4px' }}>{s}</li>)}
            </ol>
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', color: '#6F6F6F', paddingTop: '10px', borderTop: '1px solid #F4F4F4' }}>
        <span style={{ fontWeight: '500' }}>{formatDueDate(task.dueDate)}</span>
        {task.confidence === 'low' && (
          <span style={{ backgroundColor: '#FFF8E1', color: '#B28600', fontSize: '11px', borderRadius: '4px', padding: '2px 7px', fontWeight: '500' }}>⚠ Verify date</span>
        )}
        {task.estimatedMinutes && (
          <span style={{ marginLeft: 'auto' }}>🕐 {formatTime(task.estimatedMinutes)}</span>
        )}
      </div>
    </div>
  )
}
