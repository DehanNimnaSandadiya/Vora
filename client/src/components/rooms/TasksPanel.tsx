import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Plus, X, CheckCircle2, Circle, Loader2 } from 'lucide-react'
import { useSocket } from '@/hooks/useSocket'
import api from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/useToast'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface Task {
  _id: string
  roomId: string
  text: string
  createdBy: {
    _id: string
    name: string
    email: string
    avatar: string | null
  }
  assignedTo: {
    _id: string
    name: string
    email: string
    avatar: string | null
  } | null
  status: 'todo' | 'doing' | 'done'
  createdAt: string
}

interface TasksPanelProps {
  roomId: string
}

export function TasksPanel({ roomId }: TasksPanelProps) {
  const { socket, isConnected } = useSocket()
  const { user } = useAuth()
  const { toast } = useToast()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [newTaskText, setNewTaskText] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    if (!roomId) return

    const fetchTasks = async () => {
      try {
        setLoading(true)
        const response = await api.get(`/rooms/${roomId}/tasks`)
        setTasks(response.data.tasks || [])
      } catch (err: any) {
        toast({
          title: 'Error',
          description: err.response?.data?.message || 'Couldn\'t load tasks',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }

    fetchTasks()
  }, [roomId, toast])

  useEffect(() => {
    if (!socket) return

    const handleTaskUpdate = (data: { action: string; task?: Task; taskId?: string }) => {
      if (data.action === 'create' && data.task) {
        setTasks((prev) => [data.task!, ...prev])
      } else if (data.action === 'update' && data.task) {
        setTasks((prev) =>
          prev.map((t) => (t._id === data.task!._id ? data.task! : t))
        )
      } else if (data.action === 'delete' && data.taskId) {
        setTasks((prev) => prev.filter((t) => t._id !== data.taskId))
      }
    }

    socket.on('tasks:updated', handleTaskUpdate)

    return () => {
      socket.off('tasks:updated', handleTaskUpdate)
    }
  }, [socket])

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTaskText.trim() || isCreating) return

    try {
      setIsCreating(true)
      await api.post(`/rooms/${roomId}/tasks`, {
        text: newTaskText.trim(),
      })
      setNewTaskText('')
      toast({
        title: 'Task added',
        description: 'Your task has been added',
      })
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Couldn\'t create task',
        variant: 'destructive',
      })
    } finally {
      setIsCreating(false)
    }
  }

  const handleUpdateStatus = async (taskId: string, status: 'todo' | 'doing' | 'done') => {
    try {
      await api.patch(`/rooms/${roomId}/tasks/${taskId}`, { status })
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Couldn\'t update task',
        variant: 'destructive',
      })
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    try {
      await api.delete(`/rooms/${roomId}/tasks/${taskId}`)
      toast({
        title: 'Task deleted',
        description: 'Task removed',
      })
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Couldn\'t delete task',
        variant: 'destructive',
      })
    }
  }

  const groupedTasks = {
    todo: tasks.filter((t) => t.status === 'todo'),
    doing: tasks.filter((t) => t.status === 'doing'),
    done: tasks.filter((t) => t.status === 'done'),
  }

  if (loading) {
    return (
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle>Tasks</CardTitle>
        <CardDescription>Collaborative task management</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleCreateTask} className="flex gap-2">
          <Input
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
            placeholder="Add a task..."
            className="rounded-2xl"
            maxLength={500}
            disabled={isCreating || !isConnected}
          />
          <Button
            type="submit"
            size="icon"
            disabled={!newTaskText.trim() || isCreating || !isConnected}
            className="rounded-2xl"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </form>

        <div className="grid grid-cols-3 gap-3">
          {(['todo', 'doing', 'done'] as const).map((status) => (
            <div key={status} className="space-y-2">
              <div className="flex items-center gap-2 pb-2 border-b">
                {status === 'todo' && <Circle className="h-4 w-4 text-muted-foreground" />}
                {status === 'doing' && <Loader2 className="h-4 w-4 text-yellow-400" />}
                {status === 'done' && <CheckCircle2 className="h-4 w-4 text-green-400" />}
                <span className="text-sm font-medium capitalize">{status}</span>
                <Badge variant="outline" className="ml-auto rounded-2xl text-xs">
                  {groupedTasks[status].length}
                </Badge>
              </div>
              <div className="space-y-2 min-h-[200px] max-h-[400px] overflow-y-auto">
                {groupedTasks[status].map((task) => (
                  <div
                    key={task._id}
                    className="p-3 rounded-2xl border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm flex-1">{task.text}</p>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 rounded-2xl"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-2xl">
                          <DropdownMenuItem
                            onClick={() => handleUpdateStatus(task._id, 'todo')}
                            className="rounded-2xl"
                            disabled={task.status === 'todo'}
                          >
                            Move to Todo
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleUpdateStatus(task._id, 'doing')}
                            className="rounded-2xl"
                            disabled={task.status === 'doing'}
                          >
                            Move to Doing
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleUpdateStatus(task._id, 'done')}
                            className="rounded-2xl"
                            disabled={task.status === 'done'}
                          >
                            Move to Done
                          </DropdownMenuItem>
                          {(task.createdBy._id === user?.id || task.roomId === user?.id) && (
                            <>
                              <div className="h-px bg-border my-1" />
                              <DropdownMenuItem
                                onClick={() => handleDeleteTask(task._id)}
                                className="rounded-2xl text-destructive"
                              >
                                Delete
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    {task.assignedTo && (
                      <div className="mt-2 flex items-center gap-1">
                        <span className="text-xs text-muted-foreground">
                          Assigned to {task.assignedTo.name}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
                {groupedTasks[status].length === 0 && (
                  <div className="text-center text-xs text-muted-foreground py-8">
                    No tasks
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

