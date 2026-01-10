import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PageContainer, EmptyState } from "@/lib/design-system"
import { Users, Clock, Lock } from "lucide-react"
import { Link } from "react-router-dom"
import { CreateRoomDialog } from "@/components/rooms/CreateRoomDialog"
import api from "@/lib/api"

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

export function Rooms() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchRooms = async () => {
    try {
      setLoading(true)
      const response = await api.get('/rooms')
      setRooms(response.data.rooms || [])
      setError(null)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Couldn\'t load rooms')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRooms()
  }, [])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (days === 0) return 'Today'
    if (days === 1) return 'Yesterday'
    if (days < 7) return `${days} days ago`
    return date.toLocaleDateString()
  }

  if (loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-pulse text-muted-foreground">Loading rooms...</div>
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold">Study Rooms</h1>
            <p className="text-muted-foreground mt-2">
              Join or create study rooms to collaborate
            </p>
          </div>
          <CreateRoomDialog onRoomCreated={fetchRooms} />
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-destructive/10 text-destructive">
            {error}
          </div>
        )}

        {rooms.length === 0 ? (
          <EmptyState
            title="No rooms yet"
            description="Create your first study room to get started"
            icon={<Users className="h-12 w-12" />}
            action={<CreateRoomDialog onRoomCreated={fetchRooms} />}
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {rooms.map((room) => (
              <Link key={room._id} to={`/rooms/${room._id}`}>
                <Card className="hover:shadow-lg transition-shadow rounded-2xl cursor-pointer h-full">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-xl">{room.name}</CardTitle>
                      {room.isPrivate && (
                        <Badge variant="secondary" className="rounded-2xl">
                          <Lock className="h-3 w-3 mr-1" />
                          Private
                        </Badge>
                      )}
                    </div>
                    <CardDescription>{room.description || 'No description'}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>{room.members.length} member{room.members.length !== 1 ? 's' : ''}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{formatDate(room.createdAt)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  )
}
