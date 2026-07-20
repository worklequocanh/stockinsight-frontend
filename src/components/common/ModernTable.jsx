import React, { useEffect, useState } from 'react'
import TableEmpty from '../TableEmpty'

export default function ModernTable({
  columns,
  data = [],
  loading = false,
  keyField = 'id',
  onRowClick,
  emptyMessage = 'Không có dữ liệu hiển thị',
  mobileCardRender, // Optional custom render function for mobile card
  searchSlot = null,
  actionSlot = null
}) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  if (loading) {
    return (
      <div className="glass-panel" style={{ borderRadius: 20, padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {searchSlot || actionSlot ? (
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 8 }}>
            <div style={{ width: 200, height: 38, background: 'rgba(255,255,255,0.06)', borderRadius: 12 }} />
            <div style={{ width: 120, height: 38, background: 'rgba(255,255,255,0.06)', borderRadius: 12 }} />
          </div>
        ) : null}
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} style={{
            height: 54,
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: 12,
            border: '1px solid rgba(255, 255, 255, 0.04)',
            animation: 'pulseGlow 2s infinite'
          }} />
        ))}
      </div>
    )
  }

  return (
    <div className="glass-panel" style={{ borderRadius: 20, overflow: 'hidden', border: '1px solid var(--border-glass)' }}>
      {/* Top Controls Toolbar */}
      {(searchSlot || actionSlot) && (
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid var(--border-glass)',
          background: 'rgba(15, 23, 42, 0.45)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 16,
          flexWrap: 'wrap'
        }}>
          <div style={{ flex: '1 1 240px' }}>
            {searchSlot}
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            {actionSlot}
          </div>
        </div>
      )}

      {data.length === 0 ? (
        <div style={{ padding: '40px 20px' }}>
          <TableEmpty message={emptyMessage} />
        </div>
      ) : isMobile ? (
        /* Mobile / Tablet Cards View */
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {data.map((row, idx) => {
            const key = row[keyField] || idx
            if (mobileCardRender) {
              return (
                <div key={key} onClick={() => onRowClick && onRowClick(row)}>
                  {mobileCardRender(row)}
                </div>
              )
            }
            return (
              <div 
                key={key} 
                className="glass-card" 
                onClick={() => onRowClick && onRowClick(row)}
                style={{ 
                  padding: '16px', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '10px',
                  cursor: onRowClick ? 'pointer' : 'default'
                }}
              >
                {columns.map(col => (
                  <div key={col.key || col.dataIndex} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                      {col.title}:
                    </span>
                    <span style={{ fontSize: '0.88rem', color: 'var(--text-main)', textAlign: 'right', fontWeight: 500 }}>
                      {col.render ? col.render(row[col.dataIndex], row) : row[col.dataIndex]}
                    </span>
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      ) : (
        /* Desktop Table View */
        <div style={{ overflowX: 'auto', width: '100%' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--bg-surface-elevated)', borderBottom: '1px solid var(--border-glass)' }}>
                {columns.map(col => (
                  <th key={col.key || col.dataIndex} style={{
                    padding: '16px 20px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    width: col.width || 'auto',
                    textAlign: col.align || 'left'
                  }}>
                    {col.title}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, idx) => {
                const key = row[keyField] || idx
                return (
                  <tr 
                    key={key} 
                    onClick={() => onRowClick && onRowClick(row)}
                    style={{ 
                      borderBottom: idx === data.length - 1 ? 'none' : '1px solid rgba(255, 255, 255, 0.04)',
                      transition: 'background 0.15s ease',
                      cursor: onRowClick ? 'pointer' : 'default'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(56, 189, 248, 0.06)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    {columns.map(col => (
                      <td key={col.key || col.dataIndex} style={{
                        padding: '16px 20px',
                        fontSize: '0.92rem',
                        color: 'var(--text-main)',
                        textAlign: col.align || 'left'
                      }}>
                        {col.render ? col.render(row[col.dataIndex], row) : row[col.dataIndex]}
                      </td>
                    ))}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
