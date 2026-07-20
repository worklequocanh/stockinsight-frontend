import React, { useEffect } from 'react'
import { createPortal } from 'react-dom'

export default function Modal({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  maxWidth = '600px',
  footer = null 
}) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'auto'
    }
    return () => {
      document.body.style.overflow = 'auto'
    }
  }, [isOpen])

  if (!isOpen) return null

  return createPortal(
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      zIndex: 10000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      background: 'rgba(15, 23, 42, 0.40)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)'
    }}>
      {/* Backdrop click to close */}
      <div style={{ position: 'absolute', inset: 0 }} onClick={onClose} />

      <div className="animate-slide-up" style={{
        position: 'relative',
        width: '100%',
        maxWidth,
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 10001,
        background: 'var(--bg-surface)',
        borderRadius: '24px',
        border: '1.5px solid var(--border-light)',
        boxShadow: 'var(--shadow-xl)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '18px 24px',
          borderBottom: '1.5px solid var(--border-light)',
          background: 'var(--bg-surface-elevated)'
        }}>
          <h3 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>{title}</h3>
          <button 
            type="button" 
            onClick={onClose} 
            className="btn-icon" 
            style={{ width: '32px', height: '32px', fontSize: '1rem' }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={{
          padding: '24px',
          overflowY: 'auto',
          flex: 1
        }}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div style={{
            padding: '14px 24px',
            borderTop: '1.5px solid var(--border-light)',
            background: 'var(--bg-surface-elevated)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '10px'
          }}>
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
