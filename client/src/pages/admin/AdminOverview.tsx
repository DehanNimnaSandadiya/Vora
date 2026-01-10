import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import api from '@/lib/api';
import { useToast } from '@/hooks/useToast';
import { Users, DoorOpen, MessageSquare, CheckSquare, Activity } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

interface OverviewData {
  totalUsers: number;
  totalRooms: number;
  totalMessages: number;
  totalTasks: number;
  activeSocketUsers: number;
  newUsersLast7Days: number;
  roomsCreatedLast7Days: number;
}

interface AnalyticsData {
  usersByDay: Array<{ date: string; count: number }>;
  roomsByDay: Array<{ date: string; count: number }>;
  messagesByDay: Array<{ date: string; count: number }>;
  tasksByStatus: Array<{ status: string; count: number }>;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

export function AdminOverview() {
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [overviewRes, analyticsRes] = await Promise.all([
        api.get('/admin/overview'),
        api.get('/admin/analytics'),
      ]);
      setOverview(overviewRes.data.data);
      setAnalytics(analyticsRes.data.data);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to load overview data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse text-slate-400">Loading overview...</div>
      </div>
    );
  }

  if (!overview || !analytics) {
    return null;
  }

  const stats = [
    {
      title: 'Total Users',
      value: overview.totalUsers,
      icon: Users,
      change: `+${overview.newUsersLast7Days} last 7 days`,
      color: 'text-blue-400',
    },
    {
      title: 'Total Rooms',
      value: overview.totalRooms,
      icon: DoorOpen,
      change: `+${overview.roomsCreatedLast7Days} last 7 days`,
      color: 'text-green-400',
    },
    {
      title: 'Total Messages',
      value: overview.totalMessages,
      icon: MessageSquare,
      change: 'All time',
      color: 'text-purple-400',
    },
    {
      title: 'Total Tasks',
      value: overview.totalTasks,
      icon: CheckSquare,
      change: 'All time',
      color: 'text-orange-400',
    },
    {
      title: 'Active Users',
      value: overview.activeSocketUsers,
      icon: Activity,
      change: 'Currently online',
      color: 'text-cyan-400',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Admin Overview</h1>
        <p className="text-slate-400">Monitor your application's key metrics</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="bg-slate-900/50 border-slate-800 rounded-2xl">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-slate-400">
                  {stat.title}
                </CardTitle>
                <Icon className={`h-5 w-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{stat.value.toLocaleString()}</div>
                <p className="text-xs text-slate-500 mt-1">{stat.change}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Users by Day */}
        <Card className="bg-slate-900/50 border-slate-800 rounded-2xl">
          <CardHeader>
            <CardTitle className="text-white">Users Created (Last 14 Days)</CardTitle>
            <CardDescription className="text-slate-400">New user registrations over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.usersByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                  labelStyle={{ color: '#e2e8f0' }}
                />
                <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6' }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Rooms by Day */}
        <Card className="bg-slate-900/50 border-slate-800 rounded-2xl">
          <CardHeader>
            <CardTitle className="text-white">Rooms Created (Last 14 Days)</CardTitle>
            <CardDescription className="text-slate-400">New room creations over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.roomsByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                  labelStyle={{ color: '#e2e8f0' }}
                />
                <Line type="monotone" dataKey="count" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981' }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Messages by Day */}
        <Card className="bg-slate-900/50 border-slate-800 rounded-2xl">
          <CardHeader>
            <CardTitle className="text-white">Messages Sent (Last 14 Days)</CardTitle>
            <CardDescription className="text-slate-400">Message activity over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.messagesByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                  labelStyle={{ color: '#e2e8f0' }}
                />
                <Bar dataKey="count" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Tasks by Status */}
        <Card className="bg-slate-900/50 border-slate-800 rounded-2xl">
          <CardHeader>
            <CardTitle className="text-white">Tasks by Status</CardTitle>
            <CardDescription className="text-slate-400">Distribution of task statuses</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.tasksByStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(props: any) => {
                    const { status, count, percent } = props;
                    return `${status}: ${count} (${percent ? (percent * 100).toFixed(0) : 0}%)`;
                  }}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {analytics.tasksByStatus.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                  labelStyle={{ color: '#e2e8f0' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}



