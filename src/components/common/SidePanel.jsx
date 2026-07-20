import React, { useEffect } from 'react'
import { createPortal } from 'react-dom'

export default function SidePanel({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  width = '480px',
  footer = null
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleKeyDown)
    } else {
      document.body.style.overflow = 'auto'
    }

    return () => {
      document.body.style.overflow = 'auto'
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return createPortal(
    <div className="side-panel-wrapper" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 10000,
      display: 'flex',
      justifyContent: 'flex-end'
    }}>
      {/* Backdrop */}
      <div
        className="side-panel-backdrop"
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(2, 6, 23, 0.78)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          transition: 'opacity 0.3s ease'
        }}
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div
        className="side-panel-drawer animate-slide-in-right"
        style={{
          position: 'relative',
          width,
          maxWidth: '96vw',
          height: '100vh',
          background: 'var(--bg-surface)',
          borderLeft: '1px solid rgba(56, 189, 248, 0.35)',
          boxShadow: '-15px 0 50px rgba(0, 0, 0, 0.85), 0 0 40px rgba(14, 165, 233, 0.18)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 10001
        }}
      >
        {/* Header */}
        <div style={{
          padding: '22px 28px',
          borderBottom: '1px solid var(--border-glass)',
          background: 'rgba(14, 21, 36, 0.65)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '16px',
          flexShrink: 0
        }}>
          <div>
            {subtitle && (
              <span className="status-pill info" style={{ marginBottom: '8px', display: 'inline-flex' }}>
                {subtitle}
              </span>
            )}
            <h2 style={{ fontSize: '1.35rem', margin: 0, color: '#ffffff', fontWeight: 800 }}>
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            title="Đóng (ESC)"
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid var(--border-glass)',
              color: 'var(--text-muted)',
              fontSize: '1.4rem',
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              flexShrink: 0
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'rgba(244, 63, 94, 0.2)'
              e.currentTarget.style.color = '#fff'
              e.currentTarget.style.borderColor = 'rgba(244, 63, 94, 0.5)'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'
              e.currentTarget.style.color = 'var(--text-muted)'
              e.currentTarget.style.borderColor = 'var(--border-glass)'
            }}
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px 28px',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div style={{
            padding: '16px 28px',
            borderTop: '1px solid var(--border-glass)',
            background: 'rgba(14, 21, 36, 0.8)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
            flexShrink: 0
          }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
