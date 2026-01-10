import { useEffect, useState, useRef } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { PageContainer } from "@/lib/design-system"
import { Users, Clock, Lock, Send, Activity } from "lucide-react"
import { useRoom } from "@/hooks/useRoom"
import api from "@/lib/api"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/hooks/useToast"
import { TimerWidget } from "@/components/rooms/TimerWidget"
import { TasksPanel } from "@/components/rooms/TasksPanel"
import { InviteDialog } from "@/components/rooms/InviteDialog"

interface Room {
  _id: string
  name: string
  description: string
  isPrivate: boolean
  code?: string
  owner: {
    _id: string
    name: string
    email: string
    avatar: string | null
  }
  members: Array<{
    _id: string
    name: string
    email: string
    avatar: string | null
  }>
  createdAt: string
}

const statusColors = {
  studying: 'bg-green-500/20 text-green-400 border-green-500/30',
  break: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  idle: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
}

export function RoomDetail() {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { presence, messages, loading: roomLoading, updatePresence, sendMessage, isConnected, isRoomJoined } = useRoom(roomId)
  const [room, setRoom] = useState<Room | null>(null)
  const [loading, setLoading] = useState(true)
  const [messageText, setMessageText] = useState('')
  const [userStatus, setUserStatus] = useState<'studying' | 'break' | 'idle'>('idle')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  useEffect(() => {
    if (!roomId) return

    const fetchRoom = async () => {
      try {
        setLoading(true)
        const response = await api.get(`/rooms/${roomId}`)
        setRoom(response.data.room)
      } catch (err: any) {
        if (err.response?.status === 404) {
          navigate('/rooms')
          toast({
            title: 'Room not found',
            description: 'This room doesn\'t exist',
            variant: 'destructive',
          })
        } else {
          toast({
            title: 'Error',
            description: err.response?.data?.message || 'Couldn\'t load room',
            variant: 'destructive',
          })
        }
      } finally {
        setLoading(false)
      }
    }

    fetchRoom()
  }, [roomId, navigate, toast])

  useEffect(() => {
    const currentUserPresence = presence.find(p => p.userId === user?.id)
    if (currentUserPresence) {
      setUserStatus(currentUserPresence.status)
    }
  }, [presence, user])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleStatusChange = (status: 'studying' | 'break' | 'idle') => {
    updatePresence(status)
    setUserStatus(status)
  }

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!messageText.trim() || !isConnected) return

    sendMessage(messageText)
    setMessageText('')
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / (1000 * 60))

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  if (loading || !room) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-pulse text-muted-foreground">Loading room...</div>
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-4xl font-bold">{room.name}</h1>
              {room.isPrivate && (
                <Badge variant="secondary" className="rounded-2xl">
                  <Lock className="h-3 w-3 mr-1" />
                  Private
                </Badge>
              )}
              {!isConnected && (
                <Badge variant="outline" className="rounded-2xl">
                  Connecting...
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground mt-2">{room.description || 'No description'}</p>
          </div>
          <InviteDialog
            roomId={roomId || ''}
            roomName={room.name}
            isPrivate={room.isPrivate}
            roomCode={room.code}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-3 space-y-6">
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Participants ({presence.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {presence.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No one here</p>
                  ) : (
                    presence.map((p) => (
                      <div
                        key={p.userId}
                        className="flex items-center gap-3 p-2 rounded-2xl hover:bg-muted transition-colors"
                      >
                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                          {p.user.avatar ? (
                            <img
                              src={p.user.avatar}
                              alt={p.user.name}
                              className="h-10 w-10 rounded-full"
                            />
                          ) : (
                            <span className="text-sm font-medium">{p.user.name[0]}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {p.user.name}
                            {p.userId === user?.id && ' (You)'}
                          </p>
                          <Badge
                            variant="outline"
                            className={`text-xs rounded-2xl mt-1 ${statusColors[p.status]}`}
                          >
                            {p.status}
                          </Badge>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Your Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant={userStatus === 'studying' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleStatusChange('studying')}
                  className="w-full rounded-2xl justify-start"
                  disabled={!isConnected}
                >
                  <div className={`h-2 w-2 rounded-full mr-2 ${userStatus === 'studying' ? 'bg-green-400' : 'bg-gray-400'}`} />
                  Studying
                </Button>
                <Button
                  variant={userStatus === 'break' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleStatusChange('break')}
                  className="w-full rounded-2xl justify-start"
                  disabled={!isConnected}
                >
                  <div className={`h-2 w-2 rounded-full mr-2 ${userStatus === 'break' ? 'bg-yellow-400' : 'bg-gray-400'}`} />
                  Break
                </Button>
                <Button
                  variant={userStatus === 'idle' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleStatusChange('idle')}
                  className="w-full rounded-2xl justify-start"
                  disabled={!isConnected}
                >
                  <div className={`h-2 w-2 rounded-full mr-2 ${userStatus === 'idle' ? 'bg-gray-400' : 'bg-gray-400'}`} />
                  Idle
                </Button>
              </CardContent>
            </Card>

            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle>Room Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Created {new Date(room.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{room.members.length} member{room.members.length !== 1 ? 's' : ''}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-5 space-y-6">
            <TimerWidget roomId={roomId || ''} isRoomJoined={isRoomJoined} />
            <TasksPanel roomId={roomId || ''} />
          </div>

          <div className="lg:col-span-4">
            <Card className="rounded-2xl flex flex-col h-[600px]">
              <CardHeader>
                <CardTitle>Chat</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col min-h-0">
                <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
                  {roomLoading ? (
                    <div className="text-center text-muted-foreground py-8">
                      Loading messages...
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      No messages yet. Start chatting!
                    </div>
                  ) : (
                    messages.map((message) => (
                      <div key={message._id} className="space-y-1">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                            {message.userId.avatar ? (
                              <img
                                src={message.userId.avatar}
                                alt={message.userId.name}
                                className="h-8 w-8 rounded-full"
                              />
                            ) : (
                              <span className="text-xs font-medium">
                                {message.userId.name[0]}
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">
                                {message.userId.name}
                                {message.userId._id === user?.id && ' (You)'}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {formatTime(message.createdAt)}
                              </span>
                            </div>
                            <p className="text-sm mt-1 break-words">{message.text}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <Input
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Type a message..."
                    className="rounded-2xl"
                    disabled={!isConnected}
                    maxLength={1000}
                  />
                  <Button
                    type="submit"
                    size="icon"
                    disabled={!messageText.trim() || !isConnected}
                    className="rounded-2xl"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageContainer>
  )
}
