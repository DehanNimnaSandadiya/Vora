import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select } from "@/components/ui/select"
import { PageContainer } from "@/lib/design-system"
import { Loader2, Target, CheckCircle, Flame, Trophy, Download } from "lucide-react"
import { analyticsApi } from "@/lib/api-extended"
import { useToast } from "@/hooks/useToast"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

export function Analytics() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [range, setRange] = useState<'7d' | '30d'>('30d')
  const [analytics, setAnalytics] = useState<any>(null)
  const [leaderboard, setLeaderboard] = useState<any[]>([])

  useEffect(() => {
    fetchAnalytics()
  }, [range])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const [analyticsRes, leaderboardRes] = await Promise.all([
        analyticsApi.getMe(range),
        analyticsApi.getLeaderboard(),
      ])
      setAnalytics(analyticsRes.data.analytics)
      setLeaderboard(leaderboardRes.data.leaderboard || [])
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Couldn\'t load analytics',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    try {
      const response = await analyticsApi.getMe(range)
      const csvContent = "data:text/csv;charset=utf-8," + 
        "Date,Minutes\n" +
        Object.entries(response.data.analytics.focusMinutesByDay || {})
          .map(([date, minutes]) => `${date},${minutes}`)
          .join("\n")
      
      const encodedUri = encodeURI(csvContent)
      const link = document.createElement("a")
      link.setAttribute("href", encodedUri)
      link.setAttribute("download", `analytics-${range}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      toast({
        title: 'Export successful',
        description: 'Data exported',
      })
    } catch (err: any) {
      toast({
        title: 'Error',
        description: 'Couldn\'t export analytics',
        variant: 'destructive',
      })
    }
  }

  const chartData = analytics?.focusMinutesByDay
    ? Object.entries(analytics.focusMinutesByDay).map(([date, minutes]) => ({
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        minutes: minutes || 0,
      }))
    : []

  const goalProgress = analytics?.goalProgress || { actualMinutes: 0, dailyGoalMinutes: 120, progressPercent: 0 }

  if (loading && !analytics) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <div className="space-y-6 max-w-6xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold">Analytics</h1>
            <p className="text-muted-foreground mt-2">
              Track your productivity and progress
            </p>
          </div>
          <div className="flex gap-2">
            <Select
              value={range}
              onChange={(e) => setRange(e.target.value as '7d' | '30d')}
              className="rounded-2xl w-32"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
            </Select>
            <button
              onClick={handleExport}
              className="px-4 py-2 border rounded-2xl hover:bg-secondary flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Current Streak
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Flame className="h-8 w-8 text-orange-500" />
                <div>
                  <div className="text-3xl font-bold">{analytics?.streakCount || 0}</div>
                  <p className="text-xs text-muted-foreground">days</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Tasks Completed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-8 w-8 text-green-500" />
                <div>
                  <div className="text-3xl font-bold">{analytics?.tasksCompletedCount || 0}</div>
                  <p className="text-xs text-muted-foreground">in {range}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Today's Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Target className="h-8 w-8 text-blue-500" />
                <div>
                  <div className="text-3xl font-bold">{goalProgress.actualMinutes}</div>
                  <p className="text-xs text-muted-foreground">/ {goalProgress.dailyGoalMinutes} min</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Goal Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="relative w-16 h-16">
                  <svg className="transform -rotate-90 w-16 h-16">
                    <circle
                      cx="32"
                      cy="32"
                      r="28"
                      stroke="currentColor"
                      strokeWidth="6"
                      fill="none"
                      className="text-muted"
                    />
                    <circle
                      cx="32"
                      cy="32"
                      r="28"
                      stroke="currentColor"
                      strokeWidth="6"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 28}`}
                      strokeDashoffset={`${2 * Math.PI * 28 * (1 - goalProgress.progressPercent / 100)}`}
                      className="text-primary transition-all"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center text-sm font-bold">
                    {goalProgress.progressPercent}%
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Focus Time Chart */}
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>Focus Time</CardTitle>
            <CardDescription>
              Daily focus minutes over the selected period
            </CardDescription>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '0.5rem',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="minutes"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No data available for this period
              </div>
            )}
          </CardContent>
        </Card>

        {/* Most Used Rooms */}
        {analytics?.mostUsedRooms && analytics.mostUsedRooms.length > 0 && (
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle>Most Used Rooms</CardTitle>
              <CardDescription>
                Your top rooms by focus time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.mostUsedRooms.map((room: any, index: number) => (
                  <div key={room.roomId} className="flex items-center justify-between p-3 border rounded-2xl">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{room.roomName}</p>
                        <p className="text-sm text-muted-foreground">{room.totalMinutes} minutes</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Friends Leaderboard */}
        {leaderboard.length > 0 && (
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Friends Leaderboard
              </CardTitle>
              <CardDescription>
                Top 5 friends by focus time (last 7 days)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {leaderboard.map((entry, index) => (
                  <div key={entry.userId} className="flex items-center justify-between p-3 border rounded-2xl">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                      {entry.avatar && (
                        <img
                          src={entry.avatar}
                          alt={entry.name}
                          className="w-8 h-8 rounded-full"
                        />
                      )}
                      <div>
                        <p className="font-medium">{entry.name}</p>
                        <p className="text-sm text-muted-foreground">{entry.totalMinutes} minutes</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </PageContainer>
  )
}

