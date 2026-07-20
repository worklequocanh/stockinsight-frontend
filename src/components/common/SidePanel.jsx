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
          background: 'rgba(15, 23, 42, 0.35)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
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
          borderLeft: '1.5px solid var(--border-light)',
          boxShadow: '-8px 0 32px rgba(15, 23, 42, 0.10)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 10001
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 26px',
          borderBottom: '1.5px solid var(--border-light)',
          background: 'var(--bg-surface)',
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
            <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '1.25rem', margin: 0, color: 'var(--text-main)', fontWeight: 800, letterSpacing: '-0.02em' }}>
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
            padding: '14px 26px',
            borderTop: '1.5px solid var(--border-light)',
            background: 'var(--bg-surface-elevated)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '10px',
            flexShrink: 0
          }}>
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
