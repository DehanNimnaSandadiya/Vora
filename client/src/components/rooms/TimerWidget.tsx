import { useEffect, useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Play, Pause, RotateCcw, Clock } from 'lucide-react'
import { useSocket } from '@/hooks/useSocket'
import { useToast } from '@/hooks/useToast'

interface TimerState {
  mode: 'focus' | 'break'
  endsAt: number | null
  isRunning: boolean
  remaining: number
  durations: {
    focusMinutes: number
    breakMinutes: number
  } | null
}

interface TimerWidgetProps {
  roomId: string
  isRoomJoined?: boolean
}

const DURATION_PRESETS = [
  { focus: 15, break: 5, label: '15/5' },
  { focus: 25, break: 5, label: '25/5' },
  { focus: 50, break: 10, label: '50/10' },
]

export function TimerWidget({ roomId, isRoomJoined = true }: TimerWidgetProps) {
  const { socket, isConnected } = useSocket()
  const [timerState, setTimerState] = useState<TimerState>({
    mode: 'focus',
    endsAt: null,
    isRunning: false,
    remaining: 0,
    durations: null,
  })
  const [displayTime, setDisplayTime] = useState('00:00')
  const [isStarting, setIsStarting] = useState(false)
  const lastErrorRef = useRef<string | null>(null)
  const errorToastRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    if (!socket || !isConnected) return

    const handleSync = (state: TimerState) => {
      setTimerState(state)
    }

    const handleError = (error: { message: string }) => {
      const errorMsg = error.message || ''
      
      // Completely suppress "join the room" errors - they're expected during room join process
      if (errorMsg.includes('Not in this room') || errorMsg.includes('join the room') || errorMsg.includes('Please join')) {
        // Silently ignore these errors - they'll resolve when room join completes
        return
      }
      
      // Debounce duplicate errors (same error within 3 seconds)
      if (errorMsg === lastErrorRef.current) {
        return
      }
      lastErrorRef.current = errorMsg
      
      // Clear previous error toast timeout
      if (errorToastRef.current) {
        clearTimeout(errorToastRef.current)
      }
      
      // Show other errors (debounced, but only show once)
      errorToastRef.current = setTimeout(() => {
        toast({
          title: 'Timer error',
          description: errorMsg || 'Something went wrong',
          variant: 'destructive',
        })
        // Reset after longer delay to prevent spam
        setTimeout(() => {
          lastErrorRef.current = null
        }, 3000)
      }, 1000)
    }

    socket.on('timer:sync', handleSync)
    socket.on('error', handleError)
    
    let syncTimeout: ReturnType<typeof setTimeout> | null = null
    
    // Request sync only after room is confirmed joined with a small delay
    if (isRoomJoined) {
      syncTimeout = setTimeout(() => {
        if (socket) {
          socket.emit('timer:request-sync', { roomId })
        }
      }, 500)
    }

    return () => {
      if (syncTimeout) {
        clearTimeout(syncTimeout)
      }
      if (socket) {
        socket.off('timer:sync', handleSync)
        socket.off('error', handleError)
      }
      if (errorToastRef.current) {
        clearTimeout(errorToastRef.current)
      }
      lastErrorRef.current = null
    }
  }, [socket, isConnected, roomId, isRoomJoined, toast])

  // Update display time
  useEffect(() => {
    const updateTime = () => {
      if (timerState.isRunning && timerState.endsAt) {
        const now = Date.now()
        const remaining = Math.max(0, timerState.endsAt - now)
        
        const minutes = Math.floor(remaining / 60000)
        const seconds = Math.floor((remaining % 60000) / 1000)
        setDisplayTime(`${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`)

        if (remaining === 0) {
          setDisplayTime('00:00')
        }
      } else if (timerState.remaining > 0) {
        const minutes = Math.floor(timerState.remaining / 60000)
        const seconds = Math.floor((timerState.remaining % 60000) / 1000)
        setDisplayTime(`${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`)
      } else {
        setDisplayTime('00:00')
      }
    }

    updateTime()
    const interval = setInterval(updateTime, 100)

    return () => clearInterval(interval)
  }, [timerState])

  const handleStart = async (focusMinutes: number, breakMinutes: number) => {
    if (isStarting) return // Prevent multiple simultaneous starts
    
    if (!socket || !isConnected) {
      toast({
        title: 'Not connected',
        description: 'Please wait for connection to establish',
        variant: 'destructive',
      })
      return
    }

    setIsStarting(true)

    try {
      if (!isRoomJoined) {
        // Wait for room join to complete, with timeout
        let attempts = 0
        const maxAttempts = 6 // 3 seconds total
        
        while (!isRoomJoined && attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 500))
          attempts++
        }
        
        if (!isRoomJoined) {
          toast({
            title: 'Please wait',
            description: 'Joining room... Please try again in a moment.',
            variant: 'destructive',
          })
          setIsStarting(false)
          return
        }
      }

      // Emit timer start
      socket.emit('timer:start', { roomId, focusMinutes, breakMinutes })
      
      // Show immediate feedback
      toast({
        title: 'Timer starting',
        description: `${focusMinutes} minute focus session`,
      })
    } finally {
      // Reset starting flag after a short delay to prevent rapid clicks
      setTimeout(() => {
        setIsStarting(false)
      }, 1000)
    }
  }

  const handlePause = () => {
    if (!socket || !isConnected || !isRoomJoined) return
    socket.emit('timer:pause', { roomId })
  }

  const handleResume = () => {
    if (!socket || !isConnected || !isRoomJoined) return
    socket.emit('timer:resume', { roomId })
  }

  const handleReset = () => {
    if (!socket || !isConnected || !isRoomJoined) return
    socket.emit('timer:reset', { roomId })
  }

  const isActive = timerState.endsAt !== null && timerState.remaining > 0

  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Focus Timer
          </CardTitle>
          {timerState.mode && (
            <div
              className={`px-3 py-1 rounded-2xl text-xs font-medium ${
                timerState.mode === 'focus'
                  ? 'bg-primary/20 text-primary border border-primary/30'
                  : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
              }`}
            >
              {timerState.mode === 'focus' ? 'Focus' : 'Break'}
            </div>
          )}
        </div>
        {timerState.durations && (
          <CardDescription>
            {timerState.durations.focusMinutes}min focus / {timerState.durations.breakMinutes}min break
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Timer Display */}
        <div className="text-center">
          <div className="text-6xl font-mono font-bold tracking-tighter mb-4">
            {displayTime}
          </div>
          {!isConnected && (
            <p className="text-sm text-muted-foreground">Connecting...</p>
          )}
        </div>

        {/* Controls */}
        <div className="flex flex-col gap-3">
          {!isActive ? (
            <div className="space-y-3">
              <div className="flex gap-2 justify-center">
                {DURATION_PRESETS.map((preset) => (
                  <Button
                    key={preset.label}
                    variant="outline"
                    size="sm"
                    onClick={() => handleStart(preset.focus, preset.break)}
                    disabled={!isConnected || !isRoomJoined || isStarting}
                    className="rounded-2xl"
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex gap-2 justify-center">
              {timerState.isRunning ? (
                <Button
                  onClick={handlePause}
                  variant="outline"
                  size="lg"
                  className="rounded-2xl flex-1"
                  disabled={!isConnected || !isRoomJoined}
                >
                  <Pause className="mr-2 h-4 w-4" />
                  Pause
                </Button>
              ) : (
                <Button
                  onClick={handleResume}
                  size="lg"
                  className="rounded-2xl flex-1"
                  disabled={!isConnected || !isRoomJoined}
                >
                  <Play className="mr-2 h-4 w-4" />
                  Resume
                </Button>
              )}
              <Button
                onClick={handleReset}
                variant="outline"
                size="lg"
                className="rounded-2xl"
                disabled={!isConnected || !isRoomJoined}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

