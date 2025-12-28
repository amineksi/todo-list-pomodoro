'use client'

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'
import { pomodoroApi } from '@/lib/api'

interface PomodoroState {
  taskId: number | null
  taskTitle: string | null
  minutes: number
  seconds: number
  isRunning: boolean
  isCompleted: boolean
  sessionId: number | null
  startTime: number | null // Timestamp when timer started
  elapsedSeconds: number // Total seconds elapsed (including paused time)
}

interface PomodoroContextType {
  state: PomodoroState
  startTimer: (taskId: number, taskTitle: string) => Promise<void>
  pauseTimer: () => void
  resumeTimer: () => void
  stopTimer: () => void
  hasActiveTimer: boolean
}

const PomodoroContext = createContext<PomodoroContextType | undefined>(undefined)

const STORAGE_KEY = 'pomodoro-timer-state'
const DEFAULT_DURATION = 25 // minutes

export function PomodoroProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PomodoroState>(() => {
    // Load from localStorage on mount
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          // Restore timer if it exists and is not completed
          if (!parsed.isCompleted && parsed.taskId !== null) {
            const savedAt = parsed.savedAt ? new Date(parsed.savedAt).getTime() : Date.now()
            const now = Date.now()
            
            // Only add elapsed time if timer was running when saved
            let additionalElapsed = 0
            if (parsed.isRunning) {
              additionalElapsed = Math.floor((now - savedAt) / 1000)
            }
            
            // Calculate remaining time
            let remainingSeconds = parsed.minutes * 60 + parsed.seconds - additionalElapsed
            
            if (remainingSeconds <= 0) {
              // Timer would have completed
              return {
                taskId: null,
                taskTitle: null,
                minutes: DEFAULT_DURATION,
                seconds: 0,
                isRunning: false,
                isCompleted: false,
                sessionId: null,
                startTime: null,
                elapsedSeconds: 0,
              }
            }
            
            // Total elapsed time = previous elapsed + additional time (if running)
            const totalElapsed = (parsed.elapsedSeconds || 0) + additionalElapsed
            
            return {
              ...parsed,
              minutes: Math.floor(remainingSeconds / 60),
              seconds: remainingSeconds % 60,
              isRunning: parsed.isRunning, // Keep the same running state
              startTime: parsed.startTime || Date.now(),
              elapsedSeconds: totalElapsed,
              savedAt: new Date().toISOString(), // Update savedAt for next calculation
            }
          }
        } catch (e) {
          console.error('Failed to parse saved timer state:', e)
        }
      }
    }
    return {
      taskId: null,
      taskTitle: null,
      minutes: DEFAULT_DURATION,
      seconds: 0,
      isRunning: false,
      isCompleted: false,
      sessionId: null,
      startTime: null,
      elapsedSeconds: 0,
    }
  })

  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Save to localStorage whenever state changes
  // Save frequently to preserve elapsed time even if page reloads
  useEffect(() => {
    if (typeof window !== 'undefined' && state.taskId !== null) {
      const toSave = {
        ...state,
        savedAt: new Date().toISOString(),
      }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave))
      } catch (e) {
        console.error('Failed to save timer state to localStorage:', e)
      }
    } else if (typeof window !== 'undefined' && state.taskId === null) {
      // Clear if no active timer
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [state])

  // Periodically update backend with elapsed time (every 10 seconds for better persistence)
  useEffect(() => {
    if (state.sessionId && state.elapsedSeconds > 0 && state.elapsedSeconds % 10 === 0) {
      const elapsedMinutes = Math.ceil(state.elapsedSeconds / 60)
      pomodoroApi.update(state.sessionId, {
        actual_duration_minutes: elapsedMinutes
      }).catch((error) => {
        console.error('Failed to update pomodoro elapsed time:', error)
      })
    }
  }, [state.sessionId, state.elapsedSeconds])

  // Save elapsed time to backend before page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (state.sessionId && state.elapsedSeconds > 0) {
        const elapsedMinutes = Math.ceil(state.elapsedSeconds / 60)
        // Synchronous fetch to ensure it completes before page unload
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/pomodoro/${state.sessionId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ actual_duration_minutes: elapsedMinutes }),
          keepalive: true, // Keep request alive even after page unload
        }).catch(() => {
          // Ignore errors on unload
        })
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [state.sessionId, state.elapsedSeconds])

  // Timer logic
  useEffect(() => {
    if (state.isRunning && !state.isCompleted && state.taskId !== null) {
      intervalRef.current = setInterval(() => {
        setState((prev) => {
          const newElapsed = (prev.elapsedSeconds || 0) + 1
          
          if (prev.seconds > 0) {
            return { 
              ...prev, 
              seconds: prev.seconds - 1,
              elapsedSeconds: newElapsed
            }
          } else if (prev.minutes > 0) {
            return { 
              ...prev, 
              minutes: prev.minutes - 1, 
              seconds: 59,
              elapsedSeconds: newElapsed
            }
          } else {
            // Timer completed
            if (prev.sessionId) {
              // Update session with actual duration
              pomodoroApi.update(prev.sessionId, {
                actual_duration_minutes: Math.ceil(newElapsed / 60)
              }).then(() => {
                return pomodoroApi.complete(prev.sessionId!)
              }).catch((error) => {
                console.error('Failed to complete pomodoro:', error)
              })
            }
            return { 
              ...prev, 
              isRunning: false, 
              isCompleted: true,
              elapsedSeconds: newElapsed
            }
          }
        })
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [state.isRunning, state.isCompleted, state.taskId])


  const startTimer = useCallback(async (taskId: number, taskTitle: string) => {
    // Don't start if there's already an active timer
    if (state.taskId !== null && !state.isCompleted) {
      console.warn('Timer already active for task', state.taskId)
      return
    }

    try {
      // Create a new session
      const response = await pomodoroApi.create({
        task_id: taskId,
        duration_minutes: DEFAULT_DURATION,
        session_type: 'work',
      })
      const sessionId = response.data.id

      // Start the session
      await pomodoroApi.start(sessionId)

      const startTime = Date.now()

      setState({
        taskId,
        taskTitle,
        minutes: DEFAULT_DURATION,
        seconds: 0,
        isRunning: true,
        isCompleted: false,
        sessionId,
        startTime,
        elapsedSeconds: 0,
      })
    } catch (error) {
      console.error('Failed to start pomodoro:', error)
      throw error
    }
  }, [state.taskId, state.isCompleted])

  const pauseTimer = useCallback(async () => {
    setState((prev) => {
      // Update session with elapsed time when pausing
      if (prev.sessionId && prev.elapsedSeconds > 0) {
        const elapsedMinutes = Math.ceil(prev.elapsedSeconds / 60)
        pomodoroApi.update(prev.sessionId, {
          actual_duration_minutes: elapsedMinutes
        }).catch((error) => {
          console.error('Failed to update pomodoro session:', error)
        })
      }
      return { ...prev, isRunning: false }
    })
  }, [])

  const resumeTimer = useCallback(() => {
    setState((prev) => {
      if (prev.taskId !== null && !prev.isCompleted) {
        return { ...prev, isRunning: true }
      }
      return prev
    })
  }, [])

  const stopTimer = useCallback(async () => {
    if (state.sessionId) {
      try {
        // Update session with final elapsed time
        if (state.elapsedSeconds > 0) {
          const elapsedMinutes = Math.ceil(state.elapsedSeconds / 60)
          await pomodoroApi.update(state.sessionId, {
            actual_duration_minutes: elapsedMinutes
          })
        }
      } catch (error) {
        console.error('Failed to stop pomodoro:', error)
      }
    }

    setState({
      taskId: null,
      taskTitle: null,
      minutes: DEFAULT_DURATION,
      seconds: 0,
      isRunning: false,
      isCompleted: false,
      sessionId: null,
      startTime: null,
      elapsedSeconds: 0,
    })

    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [state.sessionId, state.elapsedSeconds])

  const hasActiveTimer = state.taskId !== null && !state.isCompleted

  return (
    <PomodoroContext.Provider
      value={{
        state,
        startTimer,
        pauseTimer,
        resumeTimer,
        stopTimer,
        hasActiveTimer,
      }}
    >
      {children}
    </PomodoroContext.Provider>
  )
}

export function usePomodoro() {
  const context = useContext(PomodoroContext)
  if (context === undefined) {
    throw new Error('usePomodoro must be used within a PomodoroProvider')
  }
  return context
}
