import { useEffect, useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Play, Pause, RotateCcw, Clock } from 'lucide-react'
import { useSocket } from '@/hooks/useSocket'
import { useToast } from '@/hooks/useToast'

interface TimerState {
  mode: 'focus' | 'break'
  isRunning: boolean
  durationsSec: { focus: number; break: number } | null
  remainingSec: number
  startedAt: number | null
  endsAt: number | null
  updatedAt: number
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
    isRunning: false,
    durationsSec: null,
    remainingSec: 0,
    startedAt: null,
    endsAt: null,
    updatedAt: 0,
  })
  const [displayTime, setDisplayTime] = useState('00:00')
  const [isStarting, setIsStarting] = useState(false)
  const lastErrorRef = useRef<string | null>(null)
  const errorToastRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const confirmHandlerRef = useRef<((state: TimerState) => void) | null>(null)
  const isStartingRef = useRef(false)
  const startTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    if (!socket || !isConnected) return

    const handleTimerState = (data: { roomId: string; state: TimerState | null }) => {
      if (data.roomId !== roomId) return
      
      if (data.state) {
        setTimerState(data.state)
        
        if (isStartingRef.current && confirmHandlerRef.current) {
          confirmHandlerRef.current(data.state)
        }
      } else {
        setTimerState({
          mode: 'focus',
          isRunning: false,
          durationsSec: null,
          remainingSec: 0,
          startedAt: null,
          endsAt: null,
          updatedAt: 0,
        })
      }
    }

    const handleError = (error: { message: string }) => {
      const errorMsg = error.message || ''
      
      if (errorMsg.includes('Not in this room') || errorMsg.includes('join the room') || errorMsg.includes('Please join')) {
        return
      }
      
      if (errorMsg === lastErrorRef.current) {
        return
      }
      lastErrorRef.current = errorMsg
      
      if (errorToastRef.current) {
        clearTimeout(errorToastRef.current)
      }
      
      errorToastRef.current = setTimeout(() => {
        toast({
          title: 'Timer error',
          description: errorMsg || 'Something went wrong',
          variant: 'destructive',
        })
        setTimeout(() => {
          lastErrorRef.current = null
        }, 3000)
      }, 1000)
    }

    socket.on('timer:state', handleTimerState)
    socket.on('error', handleError)
    
    let syncTimeout: ReturnType<typeof setTimeout> | null = null
    
    if (isRoomJoined) {
      syncTimeout = setTimeout(() => {
        if (socket) {
          socket.emit('timer:get', { roomId })
        }
      }, 500)
    }

    return () => {
      if (syncTimeout) {
        clearTimeout(syncTimeout)
      }
      if (socket) {
        socket.off('timer:state', handleTimerState)
        socket.off('error', handleError)
      }
      if (errorToastRef.current) {
        clearTimeout(errorToastRef.current)
      }
      if (startTimeoutRef.current) {
        clearTimeout(startTimeoutRef.current)
      }
      lastErrorRef.current = null
    }
  }, [socket, isConnected, roomId, isRoomJoined, toast])

  // Update display time - server-authoritative
  useEffect(() => {
    const updateTime = () => {
      if (timerState.isRunning && timerState.endsAt) {
        const now = Date.now()
        const remaining = Math.max(0, timerState.endsAt - now)
        const minutes = Math.floor(remaining / 60000)
        const seconds = Math.floor((remaining % 60000) / 1000)
        setDisplayTime(`${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`)
      } else if (timerState.remainingSec > 0) {
        const minutes = Math.floor(timerState.remainingSec / 60)
        const seconds = timerState.remainingSec % 60
        setDisplayTime(`${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`)
      } else {
        setDisplayTime('00:00')
      }
    }

    updateTime()
    const interval = setInterval(updateTime, timerState.isRunning ? 100 : 1000)

    return () => clearInterval(interval)
  }, [timerState])

  const handleStart = async (focusMinutes: number, breakMinutes: number) => {
    if (isStarting) return
    
    // Check socket exists and is actually connected
    if (!socket || !socket.connected || !isConnected) {
      toast({
        title: 'Not connected',
        description: 'Waiting for server connection... Please try again in a moment.',
        variant: 'destructive',
      })
      return
    }

    setIsStarting(true)

    try {
      if (!isRoomJoined) {
        // Wait for room join to complete, with timeout
        let attempts = 0
        const maxAttempts = 6
        
        while (!isRoomJoined && attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 500))
          attempts++
          // Check if socket disconnected during wait
          if (!socket.connected) {
            toast({
              title: 'Connection lost',
              description: 'Please wait for reconnection...',
              variant: 'destructive',
            })
            setIsStarting(false)
            return
          }
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

      // Double-check socket is still connected before emitting
      if (!socket.connected) {
        toast({
          title: 'Connection lost',
          description: 'Please wait for reconnection and try again.',
          variant: 'destructive',
        })
        setIsStarting(false)
        return
      }

      // Wait a bit more to ensure room join is fully processed on backend
      await new Promise(resolve => setTimeout(resolve, 300))

      // Final check before emitting
      if (!socket.connected || !isRoomJoined) {
        toast({
          title: 'Connection issue',
          description: 'Room join not complete. Please try again.',
          variant: 'destructive',
        })
        setIsStarting(false)
        return
      }

      // Set up confirmation handler
      let timerConfirmed = false
      
      // Clear any existing timeout
      if (startTimeoutRef.current) {
        clearTimeout(startTimeoutRef.current)
      }
      
      startTimeoutRef.current = setTimeout(() => {
        if (!timerConfirmed) {
          setIsStarting(false)
          confirmHandlerRef.current = null
          toast({
            title: 'Timer start timeout',
            description: 'Server did not respond. Check if timer started on display.',
            variant: 'destructive',
          })
        }
      }, 4000)

      confirmHandlerRef.current = (state: TimerState) => {
        if (state.startedAt !== null && state.endsAt !== null) {
          timerConfirmed = true
          if (startTimeoutRef.current) {
            clearTimeout(startTimeoutRef.current)
            startTimeoutRef.current = null
          }
          setIsStarting(false)
          confirmHandlerRef.current = null
        }
      }
      
      // Emit timer start
      socket.emit('timer:start', { roomId, focusMinutes, breakMinutes })
    } catch (error: any) {
      toast({
        title: 'Timer failed to start',
        description: error.message || 'Please wait for connection and try again.',
        variant: 'destructive',
      })
      setIsStarting(false)
    }
  }

  const handlePause = () => {
    if (!socket || !socket.connected || !isConnected || !isRoomJoined) {
      toast({
        title: 'Not connected',
        description: 'Please wait for connection to establish',
        variant: 'destructive',
      })
      return
    }
    socket.emit('timer:pause', { roomId })
  }

  const handleResume = () => {
    if (!socket || !socket.connected || !isConnected || !isRoomJoined) {
      toast({
        title: 'Not connected',
        description: 'Please wait for connection to establish',
        variant: 'destructive',
      })
      return
    }
    
    if (!timerState.durationsSec) {
      toast({
        title: 'No timer',
        description: 'Please start a timer first',
        variant: 'destructive',
      })
      return
    }

    const focusMinutes = timerState.durationsSec.focus / 60
    const breakMinutes = timerState.durationsSec.break / 60
    socket.emit('timer:start', { roomId, focusMinutes, breakMinutes })
  }

  const handleReset = () => {
    if (!socket || !socket.connected || !isConnected || !isRoomJoined) {
      toast({
        title: 'Not connected',
        description: 'Please wait for connection to establish',
        variant: 'destructive',
      })
      return
    }
    socket.emit('timer:reset', { roomId })
  }

  const isActive = timerState.durationsSec !== null && timerState.remainingSec > 0

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
        {timerState.durationsSec && (
          <CardDescription>
            {Math.floor(timerState.durationsSec.focus / 60)}min focus / {Math.floor(timerState.durationsSec.break / 60)}min break
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

