import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, loading, user } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        width: '100vw',
        background: 'var(--bg-dark)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '20px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Ambient glow background */}
        <div style={{
          position: 'absolute',
          width: '320px',
          height: '320px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(14, 165, 233, 0.18) 0%, transparent 70%)',
          filter: 'blur(40px)',
          animation: 'pulseGlow 2.5s infinite'
        }} />

        <div style={{
          width: '56px',
          height: '56px',
          border: '4px solid rgba(14, 165, 233, 0.2)',
          borderTopColor: 'var(--primary-light)',
          borderRadius: '50%',
          animation: 'spin 0.85s linear infinite',
          boxShadow: '0 0 24px rgba(14, 165, 233, 0.4)'
        }} />

        <div style={{
          fontSize: '1.05rem',
          fontWeight: 600,
          color: 'var(--text-main)',
          letterSpacing: '0.03em',
          textShadow: '0 0 16px rgba(14, 165, 233, 0.4)'
        }}>
          Đang xác thực phiên WMS Enterprise...
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}
