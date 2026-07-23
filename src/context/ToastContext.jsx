import React, { createContext, useContext, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const ToastContext = createContext(null)

const TOAST_STYLES = {
  success: {
    border: '#22c55e',
    dot: '#22c55e',
    glow: 'rgba(34, 197, 94, 0.4)',
    icon: '✓',
  },
  error: {
    border: '#f43f5e',
    dot: '#f43f5e',
    glow: 'rgba(244, 63, 94, 0.4)',
    icon: '✕',
  },
  warning: {
    border: '#f59e0b',
    dot: '#f59e0b',
    glow: 'rgba(245, 158, 11, 0.4)',
    icon: '⚠',
  },
  info: {
    border: '#0ea5e9',
    dot: '#0ea5e9',
    glow: 'rgba(14, 165, 233, 0.4)',
    icon: 'ℹ',
  },
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const showToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now().toString()
    setToasts((prev) => [...prev, { id, message, type }])

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, duration)
  }, [])

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Toast Container — fixed bottom-right */}
      <div
        style={{
          position: 'fixed',
          bottom: 28,
          right: 28,
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          pointerEvents: 'none',
          maxWidth: 420,
          width: '100%',
        }}
      >
        <AnimatePresence initial={false}>
          {toasts.map((t) => {
            const style = TOAST_STYLES[t.type] || TOAST_STYLES.info
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, x: 60, scale: 0.92 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 60, scale: 0.9, transition: { duration: 0.2 } }}
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                style={{
                  pointerEvents: 'auto',
                  background: 'rgba(15, 23, 42, 0.92)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderLeft: `3px solid ${style.border}`,
                  borderRadius: '10px',
                  padding: '12px 16px',
                  boxShadow: `0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.04), inset 0 1px 0 rgba(255,255,255,0.05)`,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                  cursor: 'pointer',
                  minWidth: '280px',
                }}
                onClick={() => removeToast(t.id)}
              >
                {/* Icon badge */}
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '8px',
                    background: `${style.border}1A`,
                    border: `1px solid ${style.border}40`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    fontSize: '0.8rem',
                    color: style.border,
                    fontWeight: 700,
                    boxShadow: `0 0 12px ${style.glow}`,
                    marginTop: 1,
                  }}
                >
                  {style.icon}
                </div>

                {/* Message */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      color: '#f1f5f9',
                      fontSize: '0.9rem',
                      fontWeight: 500,
                      lineHeight: 1.5,
                      wordBreak: 'break-word',
                    }}
                  >
                    {t.message}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 2 }}>
                    Nhấn để đóng
                  </div>
                </div>

                {/* Close × */}
                <div
                  style={{
                    color: '#475569',
                    fontSize: '1rem',
                    lineHeight: 1,
                    flexShrink: 0,
                    paddingTop: 2,
                  }}
                >
                  ×
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}
