"use client"

import { useState, useEffect } from "react"
import { usePathname, useSearchParams } from "next/navigation"

export default function PageLoading() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    setIsLoading(true)
    setProgress(0)

    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval)
          return 90
        }
        return prev + Math.random() * 15
      })
    }, 100)

    const timeout = setTimeout(() => {
      setProgress(100)
      setTimeout(() => {
        setIsLoading(false)
        setProgress(0)
      }, 200)
    }, 300)

    return () => {
      clearInterval(progressInterval)
      clearTimeout(timeout)
    }
  }, [pathname, searchParams])

  if (!isLoading) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] h-1 bg-transparent">
      <div 
        className="h-full bg-gradient-to-r from-primary via-primary to-primary/80 transition-all duration-200 ease-out shadow-lg shadow-primary/50"
        style={{ 
          width: `${progress}%`,
          boxShadow: '0 0 10px var(--primary), 0 0 5px var(--primary)'
        }}
      />
    </div>
  )
}
