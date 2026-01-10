import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Users,
  Timer,
  MessageSquare,
  CheckCircle2,
  BarChart3,
  Zap,
  Bell,
  Target,
  Sparkles,
  ArrowRight,
  Play,
  Star,
  Quote,
  TrendingUp,
  Globe,
  Lock,
  Award,
  Coffee,
  Brain,
  Rocket,
  Check,
  Activity,
} from 'lucide-react';

export function Landing() {
  const { user } = useAuth();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const ctaAction = user ? '/dashboard' : '/login';

  const features = [
    {
      icon: Users,
      title: 'Real-Time Collaboration',
      description: 'Study together with friends. See who\'s online, chat in real-time, and stay connected.',
      color: 'from-blue-500 to-cyan-500',
      gradient: 'from-blue-400/20 to-cyan-400/20',
    },
    {
      icon: Timer,
      title: 'Pomodoro Timer',
      description: 'Synchronized timers keep everyone focused. Custom presets and automatic session tracking.',
      color: 'from-purple-500 to-pink-500',
      gradient: 'from-purple-400/20 to-pink-400/20',
    },
    {
      icon: CheckCircle2,
      title: 'Task Management',
      description: 'Create, assign, and track tasks. Set priorities, due dates, and collaborate on completion.',
      color: 'from-green-500 to-emerald-500',
      gradient: 'from-green-400/20 to-emerald-400/20',
    },
    {
      icon: BarChart3,
      title: 'Analytics & Insights',
      description: 'Track your study time, streaks, and productivity. Visualize your progress over time.',
      color: 'from-orange-500 to-red-500',
      gradient: 'from-orange-400/20 to-red-400/20',
    },
    {
      icon: Zap,
      title: 'Focus Mode',
      description: 'Distraction blocker and chat lock during focus sessions. Stay in the zone.',
      color: 'from-yellow-500 to-orange-500',
      gradient: 'from-yellow-400/20 to-orange-400/20',
    },
    {
      icon: Bell,
      title: 'Smart Notifications',
      description: 'Get notified about invites, task assignments, and important room events.',
      color: 'from-indigo-500 to-purple-500',
      gradient: 'from-indigo-400/20 to-purple-400/20',
    },
  ];

  const testimonials = [
    {
      name: 'Sarah Chen',
      role: 'Computer Science Student',
      avatar: '👩‍💻',
      text: 'Vora transformed how my study group works. The synchronized timers keep us all on track.',
      rating: 5,
    },
    {
      name: 'Marcus Johnson',
      role: 'Medical Student',
      avatar: '👨‍⚕️',
      text: 'Best study app I\'ve used. The task management and analytics help me stay organized.',
      rating: 5,
    },
    {
      name: 'Emma Rodriguez',
      role: 'Law Student',
      avatar: '👩‍⚖️',
      text: 'Love the focus mode! It\'s helped me cut distractions and double my study time.',
      rating: 5,
    },
  ];

  const stats = [
    { value: '10K+', label: 'Active Users', icon: Users, change: '+12%' },
    { value: '50K+', label: 'Study Hours', icon: Timer, change: '+28%' },
    { value: '5K+', label: 'Rooms Created', icon: Globe, change: '+45%' },
    { value: '98%', label: 'Satisfaction', icon: Award, change: '+2%' },
  ];

  return (
    <div className="min-h-screen bg-[#FAFAFA] overflow-x-hidden">
      {/* Premium Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 -left-40 w-[600px] h-[600px] bg-gradient-to-br from-[#5865F2]/20 via-[#4752C4]/10 to-transparent rounded-full blur-3xl animate-float"></div>
        <div className="absolute top-1/3 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-[#4752C4]/20 via-[#5865F2]/10 to-transparent rounded-full blur-3xl animate-float-delayed"></div>
        <div className="absolute bottom-0 left-1/3 w-[700px] h-[700px] bg-gradient-to-tr from-[#5865F2]/15 via-transparent to-[#4752C4]/10 rounded-full blur-3xl animate-float"></div>
        
        {/* Grid overlay */}
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.03]"></div>
      </div>

      {/* Premium Navigation */}
      <nav className="relative z-50 border-b border-gray-200/50 bg-white/70 backdrop-blur-2xl sticky top-0 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link to="/" className="flex items-center gap-3 group cursor-pointer">
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#5865F2] to-[#4752C4] flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-[#5865F2] to-[#4752C4] opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-300"></div>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-[#5865F2] via-[#4752C4] to-[#5865F2] bg-clip-text text-transparent bg-[length:200%_100%] animate-shimmer">
                Vora
              </span>
            </Link>
            <div className="flex items-center gap-4">
              {!user ? (
                <>
                  <Link to="/login">
                    <Button variant="ghost" className="text-[#72767D] hover:text-[#2C2F33] hover:bg-gray-100/80 transition-all duration-200">
                      Sign In
                    </Button>
                  </Link>
                  <Link to="/login">
                    <Button className="bg-gradient-to-r from-[#5865F2] to-[#4752C4] hover:from-[#4752C4] hover:to-[#5865F2] text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 rounded-lg px-6">
                      Get Started
                    </Button>
                  </Link>
                </>
              ) : (
                <Link to="/dashboard">
                  <Button className="bg-gradient-to-r from-[#5865F2] to-[#4752C4] hover:from-[#4752C4] hover:to-[#5865F2] text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 rounded-lg px-6">
                    Go to Dashboard
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Premium Hero Section */}
      <section className="relative z-10 overflow-hidden pt-16 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className={`text-center max-w-5xl mx-auto mb-16 ${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}>
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-[#5865F2]/10 via-[#4752C4]/10 to-[#5865F2]/10 border border-[#5865F2]/20 mb-8 hover:scale-105 hover:border-[#5865F2]/40 transition-all duration-300 group">
              <Sparkles className="w-4 h-4 text-[#5865F2] animate-pulse group-hover:rotate-180 transition-transform duration-500" />
              <span className="text-sm font-semibold text-[#5865F2]">
                Focus Together, Achieve More
              </span>
            </div>
            
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-extrabold text-[#2C2F33] mb-8 leading-tight tracking-tight">
              Study Rooms That
              <br />
              <span className="relative inline-block">
                <span className="absolute inset-0 bg-gradient-to-r from-[#5865F2] via-[#4752C4] to-[#5865F2] blur-2xl opacity-30"></span>
                <span className="relative bg-gradient-to-r from-[#5865F2] via-[#4752C4] to-[#5865F2] bg-clip-text text-transparent bg-[length:200%_100%] animate-shimmer">
                  Actually Work
                </span>
              </span>
            </h1>
            
            <p className="text-2xl md:text-3xl text-[#72767D] mb-12 max-w-3xl mx-auto leading-relaxed font-light">
              Real-time collaboration, Pomodoro timers, task management, and analytics.
              <br className="hidden md:block" />
              All in one beautiful, distraction-free environment.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-5 justify-center items-center mb-12">
              <Link to={ctaAction}>
                <Button size="lg" className="group relative bg-gradient-to-r from-[#5865F2] to-[#4752C4] hover:from-[#4752C4] hover:to-[#5865F2] text-white text-lg font-semibold px-10 py-7 h-auto shadow-2xl hover:shadow-[0_20px_50px_rgba(88,101,242,0.4)] hover:scale-105 transition-all duration-300 rounded-xl overflow-hidden">
                  <span className="relative z-10 flex items-center">
                    Start Studying Now
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-2 transition-transform duration-300" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                </Button>
              </Link>
              <Button
                size="lg"
                variant="outline"
                className="group border-2 border-gray-300/80 hover:border-[#5865F2] text-[#2C2F33] hover:text-[#5865F2] hover:bg-[#5865F2]/5 text-lg font-semibold px-10 py-7 h-auto rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg backdrop-blur-sm bg-white/50"
              >
                <Play className="mr-2 w-5 h-5 group-hover:scale-125 transition-transform duration-300" />
                Watch Demo
              </Button>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-[#72767D]">
              <div className="flex items-center gap-2 group">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Check className="w-4 h-4 text-white" />
                </div>
                <span className="font-medium">Free Forever</span>
              </div>
              <div className="flex items-center gap-2 group">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Check className="w-4 h-4 text-white" />
                </div>
                <span className="font-medium">No Credit Card</span>
              </div>
              <div className="flex items-center gap-2 group">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Check className="w-4 h-4 text-white" />
                </div>
                <span className="font-medium">10,000+ Users</span>
              </div>
            </div>
          </div>

          {/* Premium Hero Visual - Modern Dashboard Mockup */}
          <div className="relative max-w-6xl mx-auto">
            {/* Glow effect behind */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#5865F2]/30 via-[#4752C4]/20 to-[#5865F2]/30 rounded-3xl blur-3xl transform -rotate-2 animate-float"></div>
            
            {/* Main mockup container */}
            <div className="relative rounded-3xl border border-gray-200/50 bg-white/80 backdrop-blur-2xl shadow-2xl overflow-hidden">
              {/* Browser chrome */}
              <div className="bg-gradient-to-r from-gray-50 to-gray-100/50 px-6 py-4 border-b border-gray-200/50 flex items-center gap-2">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400/80"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-400/80"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400/80"></div>
                </div>
                <div className="flex-1 mx-4 bg-white rounded-lg px-4 py-2 text-xs text-gray-500 border border-gray-200">
                  vora.app/study-room
                </div>
              </div>

              {/* Dashboard preview */}
              <div className="aspect-[16/10] bg-gradient-to-br from-[#FAFAFA] via-white to-[#F8F9FA] relative overflow-hidden p-8">
                {/* Grid background */}
                <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]"></div>
                
                {/* Sidebar mockup */}
                <div className="absolute left-0 top-0 bottom-0 w-20 bg-white/60 backdrop-blur-sm border-r border-gray-200/50 flex flex-col items-center gap-4 pt-6">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#5865F2] to-[#4752C4] shadow-lg"></div>
                  <div className="w-10 h-10 rounded-xl bg-gray-100 border border-gray-200"></div>
                  <div className="w-10 h-10 rounded-xl bg-gray-100 border border-gray-200"></div>
                  <div className="w-10 h-10 rounded-xl bg-gray-100 border border-gray-200"></div>
                </div>

                {/* Main content area */}
                <div className="ml-24 h-full flex flex-col gap-6">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="h-8 w-48 bg-gray-200/50 rounded-lg mb-2 animate-pulse"></div>
                      <div className="h-4 w-64 bg-gray-200/30 rounded-lg"></div>
                    </div>
                    <div className="flex gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gray-100 border border-gray-200"></div>
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#5865F2] to-[#4752C4]"></div>
                    </div>
                  </div>

                  {/* Stats cards */}
                  <div className="grid grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="bg-white rounded-xl border border-gray-200/50 shadow-lg p-5 hover:shadow-xl transition-shadow">
                        <div className="flex items-center justify-between mb-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#5865F2]/10 to-[#4752C4]/10"></div>
                          <Activity className="w-5 h-5 text-[#72767D]" />
                        </div>
                        <div className="h-7 w-16 bg-gray-200/50 rounded mb-2"></div>
                        <div className="h-3 w-24 bg-gray-200/30 rounded"></div>
                      </div>
                    ))}
                  </div>

                  {/* Main content cards */}
                  <div className="grid grid-cols-2 gap-4 flex-1">
                    {/* Timer card */}
                    <div className="bg-gradient-to-br from-[#5865F2]/5 via-white to-[#4752C4]/5 rounded-xl border border-[#5865F2]/20 shadow-xl p-6 flex flex-col items-center justify-center relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-[#5865F2]/10 rounded-full blur-2xl"></div>
                      <div className="relative z-10 text-center">
                        <Timer className="w-12 h-12 text-[#5865F2] mx-auto mb-4 animate-pulse" />
                        <div className="text-4xl font-bold text-[#2C2F33] mb-2">25:00</div>
                        <div className="text-sm text-[#72767D]">Focus Session</div>
                      </div>
                    </div>

                    {/* Tasks card */}
                    <div className="bg-white rounded-xl border border-gray-200/50 shadow-xl p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="h-5 w-24 bg-gray-200/50 rounded"></div>
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      </div>
                      <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="flex items-center gap-3">
                            <div className="w-5 h-5 rounded border-2 border-gray-300"></div>
                            <div className="flex-1">
                              <div className="h-4 w-full bg-gray-200/50 rounded mb-1"></div>
                              <div className="h-3 w-2/3 bg-gray-200/30 rounded"></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Chat preview */}
                  <div className="bg-white rounded-xl border border-gray-200/50 shadow-lg p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <MessageSquare className="w-5 h-5 text-[#5865F2]" />
                      <div className="h-4 w-32 bg-gray-200/50 rounded"></div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400"></div>
                        <div className="flex-1">
                          <div className="h-3 w-16 bg-gray-200/50 rounded mb-1"></div>
                          <div className="h-4 w-48 bg-gray-100 rounded-lg"></div>
                        </div>
                      </div>
                      <div className="flex gap-3 justify-end">
                        <div className="h-4 w-40 bg-[#5865F2]/10 rounded-lg"></div>
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#5865F2] to-[#4752C4]"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating elements */}
            <div className="absolute -top-6 -right-6 w-24 h-24 bg-gradient-to-br from-[#5865F2]/20 to-[#4752C4]/20 rounded-2xl backdrop-blur-sm border border-[#5865F2]/30 shadow-xl animate-float flex items-center justify-center">
              <Users className="w-8 h-8 text-[#5865F2]" />
            </div>
            <div className="absolute -bottom-6 -left-6 w-20 h-20 bg-gradient-to-br from-[#4752C4]/20 to-[#5865F2]/20 rounded-2xl backdrop-blur-sm border border-[#4752C4]/30 shadow-xl animate-float-delayed flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-[#4752C4]" />
            </div>
          </div>
        </div>
      </section>

      {/* Premium Features Section */}
      <section className="relative z-10 py-32 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#5865F2]/10 text-[#5865F2] text-sm font-semibold mb-6">
              <Zap className="w-4 h-4" />
              Powerful Features
            </div>
            <h2 className="text-5xl md:text-6xl font-extrabold text-[#2C2F33] mb-6 leading-tight">
              Everything You Need to
              <br />
              <span className="bg-gradient-to-r from-[#5865F2] to-[#4752C4] bg-clip-text text-transparent">
                Stay Focused
              </span>
            </h2>
            <p className="text-xl text-[#72767D] max-w-2xl mx-auto leading-relaxed">
              Powerful features designed to help you and your study group achieve more together
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card
                  key={index}
                  className="group p-8 rounded-2xl border-2 border-gray-200 hover:border-[#5865F2] hover:shadow-2xl transition-all duration-500 bg-white hover:-translate-y-3 relative overflow-hidden"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
                  <div className="relative z-10">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 shadow-xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-[#2C2F33] mb-3 group-hover:text-[#5865F2] transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-[#72767D] leading-relaxed text-lg">
                      {feature.description}
                    </p>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Premium Stats Section */}
      <section className="relative z-10 py-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-[#F8F9FA] via-white to-[#F0F2FF]">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card
                  key={index}
                  className="text-center group p-8 rounded-2xl border-2 border-gray-200 hover:border-[#5865F2] bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-2"
                >
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-[#5865F2]/10 to-[#4752C4]/10 mb-6 group-hover:from-[#5865F2] group-hover:to-[#4752C4] group-hover:scale-110 transition-all duration-500">
                    <Icon className="w-10 h-10 text-[#5865F2] group-hover:text-white transition-colors" />
                  </div>
                  <div className="text-5xl md:text-6xl font-extrabold bg-gradient-to-r from-[#5865F2] to-[#4752C4] bg-clip-text text-transparent mb-2">
                    {stat.value}
                  </div>
                  <div className="text-[#72767D] font-semibold text-lg mb-2">{stat.label}</div>
                  <div className="inline-flex items-center gap-1 text-green-500 text-sm font-medium">
                    <TrendingUp className="w-4 h-4" />
                    {stat.change}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="relative z-10 py-32 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-extrabold text-[#2C2F33] mb-6 leading-tight">
              Get Started in
              <span className="bg-gradient-to-r from-[#5865F2] to-[#4752C4] bg-clip-text text-transparent"> Minutes</span>
            </h2>
            <p className="text-xl text-[#72767D] max-w-2xl mx-auto leading-relaxed">
              Simple steps to supercharge your study sessions
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12 relative">
            {/* Connection lines */}
            <div className="hidden md:block absolute top-24 left-0 right-0 h-0.5 bg-gradient-to-r from-[#5865F2]/20 via-[#5865F2]/40 to-[#5865F2]/20"></div>
            
            {[
              { step: '1', title: 'Create Account', desc: 'Sign up with email or Google in seconds', icon: Rocket, color: 'from-blue-500 to-cyan-500' },
              { step: '2', title: 'Create a Room', desc: 'Start a study room or join an existing one', icon: Coffee, color: 'from-purple-500 to-pink-500' },
              { step: '3', title: 'Start Studying', desc: 'Invite friends and begin your focused session', icon: Brain, color: 'from-green-500 to-emerald-500' },
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={index} className="relative text-center group">
                  <div className={`absolute left-1/2 top-0 -translate-x-1/2 w-24 h-24 rounded-3xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-2xl group-hover:scale-125 transition-all duration-500 mb-8 z-10 animate-glow-pulse`}>
                    <Icon className="w-12 h-12 text-white" />
                  </div>
                  <Card className="pt-24 p-8 rounded-2xl border-2 border-gray-200 bg-white hover:border-[#5865F2] hover:shadow-2xl transition-all duration-500 group-hover:-translate-y-3">
                    <div className="text-sm font-bold text-[#5865F2] mb-3 uppercase tracking-wider">STEP {item.step}</div>
                    <h3 className="text-2xl font-bold text-[#2C2F33] mb-3">{item.title}</h3>
                    <p className="text-[#72767D] text-lg leading-relaxed">{item.desc}</p>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Premium Testimonials Section */}
      <section className="relative z-10 py-32 px-4 sm:px-6 lg:px-8 bg-[#F8F9FA]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-extrabold text-[#2C2F33] mb-6 leading-tight">
              Loved by Students
              <br />
              <span className="bg-gradient-to-r from-[#5865F2] to-[#4752C4] bg-clip-text text-transparent">Everywhere</span>
            </h2>
            <p className="text-xl text-[#72767D] max-w-2xl mx-auto leading-relaxed">
              See what our community is saying about Vora
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card
                key={index}
                className="p-8 rounded-2xl border-2 border-gray-200 bg-white hover:shadow-2xl hover:border-[#5865F2] transition-all duration-500 hover:-translate-y-2 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#5865F2]/5 to-transparent rounded-bl-full"></div>
                <div className="relative z-10">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <Quote className="w-10 h-10 text-[#5865F2]/20 mb-6" />
                  <p className="text-[#72767D] mb-8 leading-relaxed text-lg italic">
                    "{testimonial.text}"
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#5865F2] to-[#4752C4] flex items-center justify-center text-white text-2xl shadow-lg">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <div className="font-bold text-[#2C2F33] text-lg">{testimonial.name}</div>
                      <div className="text-sm text-[#72767D]">{testimonial.role}</div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Premium CTA Section */}
      <section className="relative z-10 py-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-white via-[#F8F9FA] to-white">
        <div className="max-w-5xl mx-auto text-center">
          <Card className="p-16 md:p-20 rounded-3xl border-2 border-[#5865F2]/20 bg-gradient-to-br from-[#5865F2]/10 via-white to-[#4752C4]/10 shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-grid-pattern opacity-[0.03]"></div>
            <div className="absolute top-0 left-0 w-96 h-96 bg-[#5865F2]/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#4752C4]/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>
            
            <div className="relative z-10">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-[#5865F2] to-[#4752C4] mx-auto mb-8 flex items-center justify-center shadow-2xl animate-glow-pulse">
                <Target className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-5xl md:text-6xl font-extrabold text-[#2C2F33] mb-6 leading-tight">
                Ready to Focus?
              </h2>
              <p className="text-xl md:text-2xl text-[#72767D] mb-10 max-w-2xl mx-auto leading-relaxed">
                Join thousands of students and professionals who are already using Vora to stay productive and achieve their goals.
              </p>
              <Link to={ctaAction}>
                <Button size="lg" className="group relative bg-gradient-to-r from-[#5865F2] to-[#4752C4] hover:from-[#4752C4] hover:to-[#5865F2] text-white text-xl font-bold px-12 py-8 h-auto shadow-2xl hover:shadow-[0_25px_60px_rgba(88,101,242,0.5)] hover:scale-110 transition-all duration-300 rounded-xl overflow-hidden">
                  <span className="relative z-10 flex items-center">
                    Get Started Free
                    <ArrowRight className="ml-3 w-6 h-6 group-hover:translate-x-2 transition-transform duration-300" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                </Button>
              </Link>
              <div className="flex items-center justify-center gap-4 mt-8 text-sm text-[#72767D]">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  <span>No credit card required</span>
                </div>
                <span>•</span>
                <span>Free forever</span>
                <span>•</span>
                <span>Cancel anytime</span>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Premium Footer */}
      <footer className="relative z-10 border-t-2 border-gray-200/50 bg-white/80 backdrop-blur-xl py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#5865F2] to-[#4752C4] flex items-center justify-center shadow-lg">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold text-[#2C2F33]">Vora</span>
              </div>
              <p className="text-sm text-[#72767D] leading-relaxed">
                The modern way to study together and stay focused. Built for students, by students.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-[#2C2F33] mb-6 text-lg">Product</h4>
              <ul className="space-y-3 text-sm text-[#72767D]">
                <li><a href="#" className="hover:text-[#5865F2] transition-colors duration-200 font-medium">Features</a></li>
                <li><a href="#" className="hover:text-[#5865F2] transition-colors duration-200 font-medium">Pricing</a></li>
                <li><a href="#" className="hover:text-[#5865F2] transition-colors duration-200 font-medium">Updates</a></li>
                <li><a href="#" className="hover:text-[#5865F2] transition-colors duration-200 font-medium">Roadmap</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-[#2C2F33] mb-6 text-lg">Company</h4>
              <ul className="space-y-3 text-sm text-[#72767D]">
                <li><a href="#" className="hover:text-[#5865F2] transition-colors duration-200 font-medium">About</a></li>
                <li><a href="#" className="hover:text-[#5865F2] transition-colors duration-200 font-medium">Blog</a></li>
                <li><a href="#" className="hover:text-[#5865F2] transition-colors duration-200 font-medium">Contact</a></li>
                <li><a href="#" className="hover:text-[#5865F2] transition-colors duration-200 font-medium">Careers</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-[#2C2F33] mb-6 text-lg">Legal</h4>
              <ul className="space-y-3 text-sm text-[#72767D]">
                <li><a href="#" className="hover:text-[#5865F2] transition-colors duration-200 font-medium">Privacy</a></li>
                <li><a href="#" className="hover:text-[#5865F2] transition-colors duration-200 font-medium">Terms</a></li>
                <li><a href="#" className="hover:text-[#5865F2] transition-colors duration-200 font-medium">Security</a></li>
                <li><a href="#" className="hover:text-[#5865F2] transition-colors duration-200 font-medium">Cookies</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-gray-200/50 text-center text-sm text-[#72767D]">
            © {new Date().getFullYear()} Vora. All rights reserved. Built with ❤️ for students everywhere.
          </div>
        </div>
      </footer>
    </div>
  );
}
