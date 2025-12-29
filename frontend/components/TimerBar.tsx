'use client'

import { usePomodoro } from '@/contexts/PomodoroContext'
import { Play, Pause, SkipForward } from 'lucide-react'

const WORK_DURATION = 25 // minutes
const SHORT_BREAK_DURATION = 5 // minutes
const LONG_BREAK_DURATION = 15 // minutes

export default function TimerBar() {
  const { state, pauseTimer, resumeTimer, skipTimer, hasActiveTimer } = usePomodoro()

  if (!hasActiveTimer) {
    return null
  }

  const formatTime = (m: number, s: number) => {
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  const initialDuration = state.sessionType === 'work' 
    ? WORK_DURATION * 60 
    : state.sessionType === 'long_break'
    ? LONG_BREAK_DURATION * 60
    : SHORT_BREAK_DURATION * 60
  const remainingSeconds = state.minutes * 60 + state.seconds
  const progress = initialDuration > 0 ? ((initialDuration - remainingSeconds) / initialDuration) * 100 : 0

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-lg z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 flex-1">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">🍅</span>
              <div>
                <div className="text-sm font-medium">
                {state.sessionType === 'work' 
                  ? (state.taskTitle || 'Pomodoro Timer')
                  : state.sessionType === 'long_break'
                  ? 'Long Break'
                  : 'Short Break'}
              </div>
              <div className="text-xs opacity-90">
                {state.sessionType === 'work' && state.taskId 
                  ? `Task #${state.taskId} • ${Math.floor(state.elapsedSeconds / 60)}m elapsed`
                  : state.sessionType === 'work'
                  ? `${Math.floor(state.elapsedSeconds / 60)}m elapsed`
                  : `Pomodoro ${state.completedPomodoros || 0} completed`}
              </div>
              </div>
            </div>

            <div className="flex-1 max-w-xs">
              <div className="flex items-center space-x-2">
                <div className="flex-1 bg-primary-800/50 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-white h-full transition-all duration-1000"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="text-lg font-bold min-w-[60px] text-right">
                  {formatTime(state.minutes, state.seconds)}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {state.isRunning ? (
                <button
                  onClick={pauseTimer}
                  className="p-2 hover:bg-primary-800 rounded-lg transition-colors"
                  title="Pause"
                >
                  <Pause size={20} />
                </button>
              ) : (
                <button
                  onClick={resumeTimer}
                  className="p-2 hover:bg-primary-800 rounded-lg transition-colors"
                  title="Resume"
                >
                  <Play size={20} />
                </button>
              )}
              <button
                onClick={skipTimer}
                className="p-2 hover:bg-primary-800 rounded-lg transition-colors"
                title={state.sessionType === 'work' ? 'Skip to break' : 'Skip to work'}
              >
                <SkipForward size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
