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
      top: 0,
      left: 0,
      right: 0,
      zIndex: 10000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      background: 'rgba(2, 6, 23, 0.78)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)'
    }}>
      {/* Backdrop click to close */}
      <div 
        style={{ position: 'absolute', inset: 0 }} 
        onClick={onClose} 
      />

      <div className="glass-card animate-slide-up" style={{
        position: 'relative',
        width: '100%',
        maxWidth,
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 10001,
        border: '1px solid rgba(56, 189, 248, 0.28)',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8), 0 0 40px rgba(14, 165, 233, 0.15)'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-glass)',
          background: 'rgba(15, 23, 42, 0.6)'
        }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff' }}>{title}</h3>
          <button 
            type="button" 
            onClick={onClose} 
            className="btn-icon" 
            style={{ width: '32px', height: '32px', fontSize: '1.1rem' }}
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
            padding: '16px 24px',
            borderTop: '1px solid var(--border-glass)',
            background: 'rgba(15, 23, 42, 0.6)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px'
          }}>
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
