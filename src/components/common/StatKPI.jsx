import React from 'react'

export default function StatKPI({ 
  title, 
  value, 
  subtitle, 
  icon, 
  trend, 
  trendDirection = 'up', // 'up' | 'down' | 'neutral'
  color = 'cyan' // 'cyan' | 'emerald' | 'amber' | 'rose' | 'purple'
}) {
  const colorMap = {
    cyan: { bg: 'rgba(14, 165, 233, 0.12)', border: 'rgba(14, 165, 233, 0.3)', text: '#38bdf8' },
    emerald: { bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.3)', text: '#34d399' },
    amber: { bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.3)', text: '#fbbf24' },
    rose: { bg: 'rgba(244, 63, 94, 0.12)', border: 'rgba(244, 63, 94, 0.3)', text: '#fb7185' },
    purple: { bg: 'rgba(168, 85, 247, 0.12)', border: 'rgba(168, 85, 247, 0.3)', text: '#c084fc' }
  }

  const selectedColor = colorMap[color] || colorMap.cyan

  return (
    <div className="glass-card" style={{ 
      padding: '22px 24px', 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '14px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background glow accent */}
      <div style={{
        position: 'absolute',
        top: '-30px',
        right: '-30px',
        width: '110px',
        height: '110px',
        background: selectedColor.bg,
        borderRadius: '50%',
        filter: 'blur(30px)',
        pointerEvents: 'none'
      }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          {title}
        </span>
        {icon && (
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: selectedColor.bg,
            border: `1px solid ${selectedColor.border}`,
            color: selectedColor.text,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.35rem'
          }}>
            {icon}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#ffffff', fontFamily: "'Outfit', sans-serif" }}>
          {value}
        </div>
        {trend && (
          <span style={{
            fontSize: '0.82rem',
            fontWeight: 700,
            color: trendDirection === 'up' ? 'var(--success)' : trendDirection === 'down' ? 'var(--danger)' : 'var(--text-muted)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '3px'
          }}>
            {trendDirection === 'up' && '▲'}
            {trendDirection === 'down' && '▼'}
            {trend}
          </span>
        )}
      </div>

      {subtitle && (
        <div style={{ fontSize: '0.82rem', color: 'var(--text-dim)', marginTop: '-4px' }}>
          {subtitle}
        </div>
      )}
    </div>
  )
}
