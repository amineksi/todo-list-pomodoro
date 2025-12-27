'use client'

import { useEffect, useState } from 'react'
import { statsApi, DashboardStats } from '@/lib/api'
import { Clock, CheckCircle2, Circle, PlayCircle, TrendingUp } from 'lucide-react'

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadStats()
    // Refresh stats every 30 seconds
    const interval = setInterval(loadStats, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadStats = async () => {
    try {
      setError(null)
      const response = await statsApi.getDashboard()
      setStats(response.data)
    } catch (err: any) {
      console.error('Failed to load stats:', err)
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to load statistics'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400 mb-4">Error: {error}</p>
        <button
          onClick={loadStats}
          className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg"
        >
          Retry
        </button>
      </div>
    )
  }

  if (!stats) {
    return <div className="text-center text-gray-400">No statistics available</div>
  }

  const { task_stats, pomodoro_stats } = stats

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-gray-400">Overview of your productivity</p>
      </div>

      {/* Task Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Tasks"
          value={task_stats.total_tasks}
          icon={<CheckCircle2 className="w-6 h-6" />}
          color="blue"
        />
        <StatCard
          title="Completed"
          value={task_stats.completed_tasks}
          icon={<CheckCircle2 className="w-6 h-6" />}
          color="green"
        />
        <StatCard
          title="In Progress"
          value={task_stats.in_progress_tasks}
          icon={<PlayCircle className="w-6 h-6" />}
          color="yellow"
        />
        <StatCard
          title="To Do"
          value={task_stats.todo_tasks}
          icon={<Circle className="w-6 h-6" />}
          color="gray"
        />
      </div>

      {/* Completion Rate */}
      <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">Task Completion Rate</h2>
          <span className="text-2xl font-bold text-primary-400">
            {task_stats.completion_rate.toFixed(1)}%
          </span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-4">
          <div
            className="bg-primary-500 h-4 rounded-full transition-all duration-500"
            style={{ width: `${task_stats.completion_rate}%` }}
          ></div>
        </div>
      </div>

      {/* Pomodoro Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          title="Total Sessions"
          value={pomodoro_stats.total_sessions}
          icon={<Clock className="w-6 h-6" />}
          color="purple"
        />
        <StatCard
          title="Sessions Today"
          value={pomodoro_stats.sessions_today}
          icon={<TrendingUp className="w-6 h-6" />}
          color="pink"
        />
        <StatCard
          title="Work Minutes Today"
          value={`${pomodoro_stats.work_minutes_today} min`}
          icon={<Clock className="w-6 h-6" />}
          color="orange"
        />
      </div>

      {/* Overall Stats */}
      <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
        <h2 className="text-xl font-semibold text-white mb-4">Overall Statistics</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-gray-400 text-sm">Total Work Time</p>
            <p className="text-2xl font-bold text-white">
              {Math.floor(pomodoro_stats.total_work_minutes / 60)}h {pomodoro_stats.total_work_minutes % 60}m
            </p>
          </div>
          <div>
            <p className="text-gray-400 text-sm">Avg Session Duration</p>
            <p className="text-2xl font-bold text-white">
              {pomodoro_stats.average_session_duration.toFixed(1)} min
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

interface StatCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  color: string
}

function StatCard({ title, value, icon, color }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
    green: 'bg-green-500/20 text-green-400 border-green-500/50',
    yellow: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
    gray: 'bg-gray-500/20 text-gray-400 border-gray-500/50',
    purple: 'bg-purple-500/20 text-purple-400 border-purple-500/50',
    pink: 'bg-pink-500/20 text-pink-400 border-pink-500/50',
    orange: 'bg-orange-500/20 text-orange-400 border-orange-500/50',
  }

  return (
    <div className={`bg-gray-800/50 rounded-lg p-6 border ${colorClasses[color as keyof typeof colorClasses]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm mb-1">{title}</p>
          <p className="text-3xl font-bold text-white">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color as keyof typeof colorClasses]}`}>
          {icon}
        </div>
      </div>
    </div>
  )
}
