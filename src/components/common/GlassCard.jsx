import React from 'react'

export default function GlassCard({ 
  children, 
  className = '', 
  interactive = false, 
  onClick, 
  style = {} 
}) {
  const baseClass = interactive ? 'glass-card-interactive' : 'glass-card'
  return (
    <div 
      className={`${baseClass} ${className}`} 
      onClick={onClick} 
      style={style}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </div>
  )
}
