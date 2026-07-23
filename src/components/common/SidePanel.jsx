import { useEffect } from 'react'
import { createPortal } from 'react-dom'

export default function SidePanel({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  width = '500px',
  footer = null
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose()
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
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 10000,
      display: 'flex',
      justifyContent: 'flex-end'
    }}>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
        }}
      />

      {/* Drawer Panel */}
      <div
        className="animate-slide-in-right"
        style={{
          position: 'relative',
          width,
          maxWidth: '96vw',
          height: '100vh',
          background: 'var(--bg-surface)',
          borderLeft: '1px solid var(--border-medium)',
          boxShadow: 'var(--shadow-xl)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 10001,
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '18px 22px',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'var(--bg-elevated)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '14px',
          flexShrink: 0,
        }}>
          <div>
            {subtitle && (
              <span className="status-pill info" style={{ marginBottom: '8px', display: 'inline-flex' }}>
                {subtitle}
              </span>
            )}
            <h2 style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: '1.1rem',
              margin: 0,
              color: 'var(--text-main)',
              fontWeight: 700,
              letterSpacing: '-0.02em'
            }}>
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            title="Đóng (ESC)"
            style={{
              background: 'var(--bg-glass)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-muted)',
              fontSize: '1.1rem',
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease',
              flexShrink: 0,
              lineHeight: 1,
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'var(--danger-bg)'
              e.currentTarget.style.color = 'var(--danger-text)'
              e.currentTarget.style.borderColor = 'var(--danger-border)'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'var(--bg-glass)'
              e.currentTarget.style.color = 'var(--text-muted)'
              e.currentTarget.style.borderColor = 'var(--border-subtle)'
            }}
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '22px 24px',
          display: 'flex',
          flexDirection: 'column',
        }}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div style={{
            padding: '12px 22px',
            borderTop: '1px solid var(--border-subtle)',
            background: 'var(--bg-elevated)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '8px',
            flexShrink: 0,
          }}>
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
