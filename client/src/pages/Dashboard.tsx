import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PageContainer, SkeletonCard } from "@/lib/design-system"
import { Users, CheckCircle2, Flame } from "lucide-react"
import api from "@/lib/api"
import { useToast } from "@/hooks/useToast"
import { Link } from "react-router-dom"

interface DashboardStats {
  roomsCount: number
  tasksDone: number
  currentStreak: number
  recentRooms: Array<{
    _id: string
    name: string
    description: string
    members: Array<{
      _id: string
      name: string
      email: string
      avatar: string | null
    }>
  }>
}

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        
        const roomsResponse = await api.get('/rooms')
        const rooms = roomsResponse.data.rooms || []
        
        let tasksDone = 0
        for (const room of rooms) {
          try {
            const tasksResponse = await api.get(`/rooms/${room._id}/tasks`)
            const tasks = tasksResponse.data.tasks || []
            tasksDone += tasks.filter((t: any) => t.status === 'done').length
          } catch (err) {
            // Skip rooms without access
          }
        }

        const lastActivity = localStorage.getItem('lastActivity')
        const today = new Date().toDateString()
        let currentStreak = 0
        
        if (lastActivity === today) {
          const streakCount = parseInt(localStorage.getItem('streak') || '0')
          currentStreak = streakCount
        } else {
          const lastDate = lastActivity ? new Date(lastActivity) : null
          const yesterday = new Date()
          yesterday.setDate(yesterday.getDate() - 1)
          
          if (lastDate && lastDate.toDateString() === yesterday.toDateString()) {
            currentStreak = parseInt(localStorage.getItem('streak') || '0') + 1
            localStorage.setItem('streak', currentStreak.toString())
            localStorage.setItem('lastActivity', today)
          } else if (!lastActivity || lastDate?.toDateString() !== today) {
            currentStreak = lastActivity === today ? parseInt(localStorage.getItem('streak') || '0') : 1
            localStorage.setItem('streak', currentStreak.toString())
            localStorage.setItem('lastActivity', today)
          }
        }

        setStats({
          roomsCount: rooms.length,
          tasksDone,
          currentStreak,
          recentRooms: rooms.slice(0, 3).map((room: any) => ({
            _id: room._id || '',
            name: room.name || '',
            description: room.description || '',
            members: Array.isArray(room.members) 
              ? room.members.map((m: any) => ({
                  _id: m._id || '',
                  name: m.name || '',
                  email: m.email || '',
                  avatar: m.avatar || null,
                }))
              : [],
          })),
        })
      } catch (err: any) {
        toast({
          title: 'Error',
          description: err.response?.data?.message || 'Couldn\'t load dashboard',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [toast])

  if (loading) {
    return (
      <PageContainer>
        <div className="space-y-6">
          <div>
            <div className="h-10 w-48 bg-gray-200 rounded-lg animate-pulse mb-2" />
            <div className="h-6 w-96 bg-gray-200 rounded-lg animate-pulse" />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
          <SkeletonCard />
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <div className="space-y-6">
        <div>
          <h1 className="text-4xl font-bold text-[#2C2F33]">Dashboard</h1>
          <p className="text-[#72767D] mt-2">
            Welcome back! Here's what's happening in your study rooms.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="rounded-xl hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-[#2C2F33]">
                Active Rooms
              </CardTitle>
              <Users className="h-4 w-4 text-[#72767D]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#2C2F33]">{stats?.roomsCount || 0}</div>
              <p className="text-xs text-[#72767D]">
                Study rooms you're part of
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-xl hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-[#2C2F33]">
                Tasks Completed
              </CardTitle>
              <CheckCircle2 className="h-4 w-4 text-[#72767D]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#2C2F33]">{stats?.tasksDone || 0}</div>
              <p className="text-xs text-[#72767D]">
                Tasks marked as done
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-xl hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-[#2C2F33]">
                Current Streak
              </CardTitle>
              <Flame className="h-4 w-4 text-[#72767D]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-[#2C2F33]">{stats?.currentStreak || 0}</div>
              <p className="text-xs text-[#72767D]">
                Days of activity
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Rooms */}
        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle className="text-[#2C2F33]">Recent Rooms</CardTitle>
            <CardDescription className="text-[#72767D]">
              Your latest study room sessions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.recentRooms && stats.recentRooms.length > 0 ? (
              <div className="space-y-3">
                {stats.recentRooms.map((room) => (
                  <Link
                    key={room._id}
                    to={`/rooms/${room._id}`}
                    className="block p-4 rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-[#5865F2] transition-all duration-200"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-[#2C2F33]">{room.name}</h3>
                        {room.description && (
                          <p className="text-sm text-[#72767D] mt-1">
                            {room.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-[#72767D]">
                        <Users className="h-4 w-4" />
                        <span>
                          {typeof room.members === 'number' 
                            ? room.members 
                            : Array.isArray(room.members) 
                            ? room.members.length 
                            : 0}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-[#72767D] mb-4">
                  No rooms yet. Create your first study room to get started!
                </p>
                <Link
                  to="/rooms"
                  className="inline-block px-4 py-2 rounded-lg bg-[#5865F2] text-white hover:bg-[#4752C4] transition-colors duration-200 shadow-sm hover:shadow-md"
                >
                  Browse Rooms
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  )
}
