'use client'

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'
import { pomodoroApi } from '@/lib/api'

type SessionType = 'work' | 'short_break' | 'long_break'

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
  sessionType: SessionType // Type of current session
  completedPomodoros: number // Number of completed work sessions
}

interface PomodoroContextType {
  state: PomodoroState
  startTimer: (taskId: number, taskTitle: string) => Promise<void>
  pauseTimer: () => void
  resumeTimer: () => void
  skipTimer: () => Promise<void>
  stopTimer: () => void
  hasActiveTimer: boolean
}

const PomodoroContext = createContext<PomodoroContextType | undefined>(undefined)

const STORAGE_KEY = 'pomodoro-timer-state'
const WORK_DURATION = 25 // minutes
const SHORT_BREAK_DURATION = 5 // minutes
const LONG_BREAK_DURATION = 15 // minutes
const POMODOROS_BEFORE_LONG_BREAK = 4

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
                minutes: WORK_DURATION,
                seconds: 0,
                isRunning: false,
                isCompleted: false,
                sessionId: null,
                startTime: null,
                elapsedSeconds: 0,
                sessionType: 'work' as SessionType,
                completedPomodoros: parsed.completedPomodoros || 0,
              }
            }
            
            // Total elapsed time = previous elapsed + additional time (if running)
            const totalElapsed = (parsed.elapsedSeconds || 0) + additionalElapsed
            
            return {
              ...parsed,
              minutes: Math.floor(remainingSeconds / 60),
              seconds: remainingSeconds % 60,
              isRunning: false, // Always restore as paused
              startTime: parsed.startTime || Date.now(),
              elapsedSeconds: totalElapsed,
              sessionType: parsed.sessionType || 'work',
              completedPomodoros: parsed.completedPomodoros || 0,
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
      minutes: WORK_DURATION,
      seconds: 0,
      isRunning: false,
      isCompleted: false,
      sessionId: null,
      startTime: null,
      elapsedSeconds: 0,
      sessionType: 'work' as SessionType,
      completedPomodoros: 0,
    }
  })

  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const stateRef = useRef(state)
  
  // Keep stateRef in sync with state
  useEffect(() => {
    stateRef.current = state
  }, [state])

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

  // Detect logout and pause timer when auth token is removed
  useEffect(() => {
    if (typeof window === 'undefined') return

    const checkAuthToken = () => {
      const authToken = localStorage.getItem('auth_token')
      // If token is removed and timer is running, pause it
      if (!authToken && state.isRunning && state.taskId !== null) {
        setState((prev) => {
          // Update session with elapsed time when pausing
          if (prev.sessionId && prev.elapsedSeconds > 0) {
            const elapsedMinutes = Math.ceil(prev.elapsedSeconds / 60)
            pomodoroApi.update(prev.sessionId, {
              actual_duration_minutes: elapsedMinutes
            }).catch((error) => {
              console.error('Failed to update pomodoro session on logout:', error)
            })
          }
          return { ...prev, isRunning: false }
        })
      }
    }

    // Check periodically to detect logout (storage events only fire in other windows)
    const interval = setInterval(checkAuthToken, 500)

    return () => {
      clearInterval(interval)
    }
  }, [state.isRunning, state.taskId, state.sessionId, state.elapsedSeconds])

  // Pause timer and save elapsed time to backend before page unload or visibility change
  useEffect(() => {
    const handlePauseAndSave = () => {
      // Get current state from ref (synchronous access)
      const currentState = stateRef.current
      
      // Pause timer if it's running by saving state with isRunning: false
      if (currentState.isRunning && (currentState.taskId !== null || currentState.sessionType !== 'work')) {
        // Save paused state directly to localStorage (synchronous)
        const pausedState = {
          ...currentState,
          isRunning: false,
          savedAt: new Date().toISOString(),
        }
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(pausedState))
        } catch (e) {
          // Ignore localStorage errors
        }

        // Update session with elapsed time when pausing
        if (currentState.sessionId && currentState.elapsedSeconds > 0) {
          const elapsedMinutes = Math.ceil(currentState.elapsedSeconds / 60)
          // Synchronous fetch to ensure it completes before page unload
          fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/pomodoro/${currentState.sessionId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ actual_duration_minutes: elapsedMinutes }),
            keepalive: true, // Keep request alive even after page unload
          }).catch(() => {
            // Ignore errors on unload
          })
        }
      } else if (currentState.sessionId && currentState.elapsedSeconds > 0) {
        // Save elapsed time even if not running
        const elapsedMinutes = Math.ceil(currentState.elapsedSeconds / 60)
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/pomodoro/${currentState.sessionId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ actual_duration_minutes: elapsedMinutes }),
          keepalive: true,
        }).catch(() => {
          // Ignore errors on unload
        })
      }
    }

    // Handle page unload
    window.addEventListener('beforeunload', handlePauseAndSave)
    
    // Handle visibility change (tab switch, minimize, etc.)
    const handleVisibilityChange = () => {
      if (document.hidden && stateRef.current.isRunning) {
        handlePauseAndSave()
        // Also update state to pause
        setState((prev) => ({ ...prev, isRunning: false }))
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      window.removeEventListener('beforeunload', handlePauseAndSave)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, []) // Empty deps - we use stateRef to get current state synchronously

  // Timer logic
  useEffect(() => {
    if (state.isRunning && !state.isCompleted && (state.taskId !== null || state.sessionType !== 'work')) {
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
            // Timer completed - transition to next session type
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
            
            // Determine next session type
            let nextSessionType: SessionType = 'work'
            let nextDuration = WORK_DURATION
            let newCompletedPomodoros = prev.completedPomodoros || 0
            
            if (prev.sessionType === 'work') {
              // After work, take a break
              newCompletedPomodoros = (prev.completedPomodoros || 0) + 1
              if (newCompletedPomodoros % POMODOROS_BEFORE_LONG_BREAK === 0) {
                nextSessionType = 'long_break'
                nextDuration = LONG_BREAK_DURATION
              } else {
                nextSessionType = 'short_break'
                nextDuration = SHORT_BREAK_DURATION
              }
            } else {
              // After break, return to work
              nextSessionType = 'work'
              nextDuration = WORK_DURATION
            }
            
            return { 
              ...prev, 
              isRunning: false, 
              isCompleted: true,
              elapsedSeconds: 0,
              minutes: nextDuration,
              seconds: 0,
              sessionType: nextSessionType,
              completedPomodoros: newCompletedPomodoros,
              sessionId: null,
              taskId: nextSessionType === 'work' ? prev.taskId : null,
              taskTitle: nextSessionType === 'work' ? prev.taskTitle : null,
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
  }, [state.isRunning, state.isCompleted, state.taskId, state.sessionType])


  const startTimer = useCallback(async (taskId: number, taskTitle: string) => {
    // Don't start if there's already an active timer
    if (state.taskId !== null && !state.isCompleted && state.sessionType === 'work') {
      console.warn('Timer already active for task', state.taskId)
      return
    }

    try {
      const sessionType = state.isCompleted && state.sessionType !== 'work' 
        ? state.sessionType 
        : 'work'
      
      const duration = sessionType === 'work' 
        ? WORK_DURATION 
        : sessionType === 'long_break' 
        ? LONG_BREAK_DURATION 
        : SHORT_BREAK_DURATION

      // Create a new session (only for work sessions, breaks don't need task_id)
      let sessionId: number | null = null
      if (sessionType === 'work') {
        const response = await pomodoroApi.create({
          task_id: taskId,
          duration_minutes: duration,
          session_type: 'work',
        })
        sessionId = response.data.id
        await pomodoroApi.start(sessionId)
      }

      const startTime = Date.now()

      setState({
        taskId: sessionType === 'work' ? taskId : null,
        taskTitle: sessionType === 'work' ? taskTitle : null,
        minutes: duration,
        seconds: 0,
        isRunning: true,
        isCompleted: false,
        sessionId,
        startTime,
        elapsedSeconds: 0,
        sessionType,
        completedPomodoros: state.completedPomodoros || 0,
      })
    } catch (error) {
      console.error('Failed to start pomodoro:', error)
      throw error
    }
  }, [state.taskId, state.isCompleted, state.sessionType, state.completedPomodoros])

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
      // Can resume if there's an active timer (work or break)
      if (!prev.isCompleted && (prev.taskId !== null || prev.sessionType !== 'work')) {
        return { ...prev, isRunning: true }
      }
      // If completed, start the next session
      if (prev.isCompleted) {
        if (prev.sessionType === 'work') {
          // After work completion, start break
          const nextSessionType = (prev.completedPomodoros || 0) % POMODOROS_BEFORE_LONG_BREAK === 0
            ? 'long_break' as SessionType
            : 'short_break' as SessionType
          const nextDuration = nextSessionType === 'long_break' ? LONG_BREAK_DURATION : SHORT_BREAK_DURATION
          return {
            ...prev,
            isRunning: true,
            isCompleted: false,
            minutes: nextDuration,
            seconds: 0,
            sessionType: nextSessionType,
            elapsedSeconds: 0,
            taskId: null,
            taskTitle: null,
            sessionId: null,
          }
        } else {
          // After break, need taskId to start work - can't auto-resume
          return prev
        }
      }
      return prev
    })
  }, [])

  const skipTimer = useCallback(async () => {
    // Complete current session and move to next
    if (state.sessionId) {
      try {
        if (state.elapsedSeconds > 0) {
          const elapsedMinutes = Math.ceil(state.elapsedSeconds / 60)
          await pomodoroApi.update(state.sessionId, {
            actual_duration_minutes: elapsedMinutes
          })
          await pomodoroApi.complete(state.sessionId)
        }
      } catch (error) {
        console.error('Failed to skip pomodoro:', error)
      }
    }

    // Determine next session type
    let nextSessionType: SessionType = 'work'
    let nextDuration = WORK_DURATION
    let newCompletedPomodoros = state.completedPomodoros || 0
    let nextTaskId = state.taskId
    let nextTaskTitle = state.taskTitle

    if (state.sessionType === 'work') {
      // After work, take a break
      newCompletedPomodoros = (state.completedPomodoros || 0) + 1
      if (newCompletedPomodoros % POMODOROS_BEFORE_LONG_BREAK === 0) {
        nextSessionType = 'long_break'
        nextDuration = LONG_BREAK_DURATION
      } else {
        nextSessionType = 'short_break'
        nextDuration = SHORT_BREAK_DURATION
      }
      nextTaskId = null
      nextTaskTitle = null
    } else {
      // After break, return to work (keep same task if available)
      nextSessionType = 'work'
      nextDuration = WORK_DURATION
    }

    setState({
      taskId: nextTaskId,
      taskTitle: nextTaskTitle,
      minutes: nextDuration,
      seconds: 0,
      isRunning: false,
      isCompleted: false,
      sessionId: null,
      startTime: null,
      elapsedSeconds: 0,
      sessionType: nextSessionType,
      completedPomodoros: newCompletedPomodoros,
    })
  }, [state])

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
      minutes: WORK_DURATION,
      seconds: 0,
      isRunning: false,
      isCompleted: false,
      sessionId: null,
      startTime: null,
      elapsedSeconds: 0,
      sessionType: 'work',
      completedPomodoros: 0,
    })

    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [state.sessionId, state.elapsedSeconds])

  const hasActiveTimer = (state.taskId !== null || state.sessionType !== 'work') && !state.isCompleted

  return (
    <PomodoroContext.Provider
      value={{
        state,
        startTimer,
        pauseTimer,
        resumeTimer,
        skipTimer,
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
