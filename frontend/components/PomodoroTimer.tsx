'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { pomodoroApi } from '@/lib/api'
import { Play, Pause, Square, Check } from 'lucide-react'

interface PomodoroTimerProps {
  taskId: number
  onComplete: () => void
}

export default function PomodoroTimer({ taskId, onComplete }: PomodoroTimerProps) {
  const [minutes, setMinutes] = useState(25)
  const [seconds, setSeconds] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const handleComplete = useCallback(async () => {
    setIsRunning(false)
    setIsCompleted(true)
    try {
      // Find the active session and complete it
      const sessionsResponse = await pomodoroApi.getAll(taskId)
      const activeSession = sessionsResponse.data.find(
        (s) => s.started_at && !s.completed_at
      )
      if (activeSession) {
        await pomodoroApi.complete(activeSession.id)
      }
    } catch (error) {
      console.error('Failed to complete pomodoro:', error)
    }
  }, [taskId])

  useEffect(() => {
    if (isRunning && !isCompleted) {
      intervalRef.current = setInterval(() => {
        setSeconds((prev) => {
          if (prev > 0) {
            return prev - 1
          } else if (minutes > 0) {
            setMinutes((prev) => prev - 1)
            return 59
          } else {
            handleComplete()
            return 0
          }
        })
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRunning, minutes, seconds, isCompleted, handleComplete])

  const handleStart = () => {
    setIsRunning(true)
  }

  const handlePause = () => {
    setIsRunning(false)
  }

  const handleStop = () => {
    setIsRunning(false)
    setMinutes(25)
    setSeconds(0)
    setIsCompleted(false)
    onComplete()
  }

  const formatTime = (m: number, s: number) => {
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  const progress = ((25 * 60 - (minutes * 60 + seconds)) / (25 * 60)) * 100

  return (
    <div className="bg-gradient-to-br from-primary-600/20 to-primary-800/20 rounded-lg p-8 border border-primary-500/50">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-6">🍅 Pomodoro Timer</h2>
        
        <div className="relative w-64 h-64 mx-auto mb-8">
          <svg className="transform -rotate-90 w-64 h-64">
            <circle
              cx="128"
              cy="128"
              r="120"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-gray-700"
            />
            <circle
              cx="128"
              cy="128"
              r="120"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 120}`}
              strokeDashoffset={`${2 * Math.PI * 120 * (1 - progress / 100)}`}
              className="text-primary-500 transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-5xl font-bold text-white mb-2">
                {formatTime(minutes, seconds)}
              </div>
              <div className="text-gray-400 text-sm">
                {isCompleted ? 'Completed!' : isRunning ? 'Working...' : 'Ready'}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center space-x-4">
          {!isCompleted ? (
            <>
              {!isRunning ? (
                <button
                  onClick={handleStart}
                  className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg transition-colors"
                >
                  <Play size={20} />
                  <span>Start</span>
                </button>
              ) : (
                <button
                  onClick={handlePause}
                  className="flex items-center space-x-2 bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-3 rounded-lg transition-colors"
                >
                  <Pause size={20} />
                  <span>Pause</span>
                </button>
              )}
              <button
                onClick={handleStop}
                className="flex items-center space-x-2 bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg transition-colors"
              >
                <Square size={20} />
                <span>Stop</span>
              </button>
            </>
          ) : (
            <button
              onClick={handleStop}
              className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors"
            >
              <Check size={20} />
              <span>Done</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
