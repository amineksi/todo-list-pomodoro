'use client'

import { useEffect, useState } from 'react'
import { tasksApi, Task } from '@/lib/api'
import { Plus, Trash2, Edit2, Play, Clock } from 'lucide-react'
import { usePomodoro } from '@/contexts/PomodoroContext'

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const { startTimer, hasActiveTimer, state } = usePomodoro()

  useEffect(() => {
    loadTasks()
  }, [])

  const loadTasks = async () => {
    try {
      setError(null)
      const response = await tasksApi.getAll()
      setTasks(response.data)
    } catch (err: any) {
      console.error('Failed to load tasks:', err)
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to load tasks'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTask = async (taskData: Partial<Task>) => {
    try {
      await tasksApi.create(taskData)
      await loadTasks()
      setShowAddModal(false)
    } catch (err: any) {
      console.error('Failed to create task:', err)
      const errorMessage = err.response?.data?.detail || err.message || 'Unknown error'
      alert(`Failed to create task: ${errorMessage}`)
    }
  }

  const handleUpdateTask = async (id: number, taskData: Partial<Task>) => {
    try {
      await tasksApi.update(id, taskData)
      await loadTasks()
      setEditingTask(null)
    } catch (err: any) {
      console.error('Failed to update task:', err)
      alert(`Failed to update task: ${err.message || 'Unknown error'}`)
    }
  }

  const handleDeleteTask = async (id: number) => {
    if (!confirm('Are you sure you want to delete this task?')) return
    try {
      await tasksApi.delete(id)
      await loadTasks()
    } catch (err: any) {
      console.error('Failed to delete task:', err)
      alert(`Failed to delete task: ${err.message || 'Unknown error'}`)
    }
  }

  const handleStartPomodoro = async (taskId: number) => {
    try {
      const task = tasks.find(t => t.id === taskId)
      const taskTitle = task?.title || `Task #${taskId}`
      await startTimer(taskId, taskTitle)
      await loadTasks() // Refresh to update task status
    } catch (err: any) {
      console.error('Failed to start pomodoro:', err)
      alert(`Failed to start pomodoro: ${err.message || 'Unknown error'}`)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done':
        return 'bg-green-500/20 text-green-400 border-green-500/50'
      case 'in_progress':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50'
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/50'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500/20 text-red-400'
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-400'
      default:
        return 'bg-blue-500/20 text-blue-400'
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
          onClick={loadTasks}
          className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Tasks</h1>
          <p className="text-gray-400">Manage your tasks and start pomodoro sessions</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={20} />
          <span>New Task</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onEdit={setEditingTask}
            onDelete={handleDeleteTask}
            onStartPomodoro={handleStartPomodoro}
            isTimerActive={hasActiveTimer && state.taskId === task.id}
            hasOtherTimerActive={hasActiveTimer && state.taskId !== task.id}
            getStatusColor={getStatusColor}
            getPriorityColor={getPriorityColor}
          />
        ))}
      </div>

      {tasks.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <p className="text-lg mb-2">No tasks yet</p>
          <p>Create your first task to get started!</p>
        </div>
      )}

      {showAddModal && (
        <TaskModal
          onClose={() => setShowAddModal(false)}
          onSave={handleCreateTask}
        />
      )}

      {editingTask && (
        <TaskModal
          task={editingTask}
          onClose={() => setEditingTask(null)}
          onSave={(data) => handleUpdateTask(editingTask.id, data)}
        />
      )}
    </div>
  )
}

interface TaskCardProps {
  task: Task
  onEdit: (task: Task) => void
  onDelete: (id: number) => void
  onStartPomodoro: (id: number) => void
  isTimerActive: boolean
  hasOtherTimerActive: boolean
  getStatusColor: (status: string) => string
  getPriorityColor: (priority: string) => string
}

function TaskCard({
  task,
  onEdit,
  onDelete,
  onStartPomodoro,
  isTimerActive,
  hasOtherTimerActive,
  getStatusColor,
  getPriorityColor,
}: TaskCardProps) {
  return (
    <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-white mb-2">{task.title}</h3>
          {task.description && (
            <p className="text-gray-400 text-sm mb-3">{task.description}</p>
          )}
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => onEdit(task)}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={() => onDelete(task.id)}
            className="p-2 text-gray-400 hover:text-red-400 transition-colors"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="flex items-center space-x-2 mb-4">
        <span className={`px-2 py-1 rounded text-xs border ${getStatusColor(task.status)}`}>
          {task.status.replace('_', ' ')}
        </span>
        <span className={`px-2 py-1 rounded text-xs ${getPriorityColor(task.priority)}`}>
          {task.priority}
        </span>
      </div>

      <button
        onClick={() => onStartPomodoro(task.id)}
        disabled={isTimerActive || task.status === 'done' || hasOtherTimerActive}
        className={`w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
          isTimerActive
            ? 'bg-green-600 text-white cursor-not-allowed'
            : task.status === 'done' || hasOtherTimerActive
            ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
            : 'bg-primary-600 hover:bg-primary-700 text-white'
        }`}
      >
        {isTimerActive ? (
          <>
            <Clock size={18} />
            <span>Timer Active</span>
          </>
        ) : hasOtherTimerActive ? (
          <>
            <Clock size={18} />
            <span>Another Timer Running</span>
          </>
        ) : (
          <>
            <Play size={18} />
            <span>Start Pomodoro</span>
          </>
        )}
      </button>
    </div>
  )
}

interface TaskModalProps {
  task?: Task
  onClose: () => void
  onSave: (data: Partial<Task>) => void
}

function TaskModal({ task, onClose, onSave }: TaskModalProps) {
  const [title, setTitle] = useState(task?.title || '')
  const [description, setDescription] = useState(task?.description || '')
  const [status, setStatus] = useState(task?.status || 'todo')
  const [priority, setPriority] = useState(task?.priority || 'medium')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      alert('Title is required')
      return
    }
    onSave({ title, description, status, priority })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md border border-gray-700" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-bold text-white mb-4">
          {task ? 'Edit Task' : 'New Task'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-500"
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-500"
              >
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
          <div className="flex space-x-3">
            <button
              type="submit"
              className="flex-1 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              {task ? 'Update' : 'Create'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
