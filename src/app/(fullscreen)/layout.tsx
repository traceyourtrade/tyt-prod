"use client"

import "../globals.css"

export default function FullscreenLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      overflow: 'hidden',
      background: 'var(--background)'
    }}>
      {children}
    </div>
  )
}
