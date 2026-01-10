import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PageContainer } from "@/lib/design-system"
import { useAuth } from "@/contexts/AuthContext"
import { useNavigate, useSearchParams } from "react-router-dom"
import { LogIn, UserPlus } from "lucide-react"

const getGoogleAuthUrl = () => {
  const apiUrl = import.meta.env.VITE_API_URL;
  if (!apiUrl) {
    if (import.meta.env.DEV) {
      return 'http://localhost:5000/auth/google';
    }
    // Production without VITE_API_URL - this should not happen
    console.error('VITE_API_URL is not set in production!');
    return '/auth/google';
  }
  const baseUrl = apiUrl.replace(/\/api$/, '') // Remove /api suffix if present
  return `${baseUrl}/auth/google`
}

const GOOGLE_AUTH_URL = getGoogleAuthUrl()

export function Login() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { user, login, register, loading } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    // Redirect if already logged in (only after loading completes)
    if (!loading && user) {
      const userRole = user.role || 'user'
      navigate(userRole === 'admin' ? '/admin' : '/dashboard', { replace: true })
      return
    }

    const urlError = searchParams.get('error')
    if (urlError === 'oauth_failed') {
      setError('Google sign-in didn\'t work. Try again.')
    } else if (urlError === 'invalid_token') {
      setError('Session expired. Sign in again.')
    } else if (urlError === 'fetch_error') {
      setError('Couldn\'t load your account. Try signing in again.')
    }
  }, [user, loading, navigate, searchParams])

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    try {
      const role = await login(email, password)
      // Only navigate after successful login
      if (role) {
        navigate(role === 'admin' ? '/admin' : '/dashboard', { replace: true })
      }
    } catch (err: any) {
      // Show error, keep form visible
      const errorMessage = err.response?.data?.message || err.message || 'Wrong email or password.'
      setError(errorMessage)
      setIsLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)
    const name = formData.get('name') as string
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const university = formData.get('university') as string

    try {
      await register(name, email, password, university || undefined)
      // Only navigate after successful registration
      navigate('/dashboard', { replace: true })
    } catch (err: any) {
      // Show error, keep form visible
      const errorMessage = err.response?.data?.message || err.message || 'Couldn\'t create account. Check your details and try again.'
      setError(errorMessage)
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = () => {
    window.location.href = GOOGLE_AUTH_URL
  }

  if (loading) {
    return (
      <PageContainer className="flex items-center justify-center min-h-screen bg-[#FAFAFA]">
        <div className="text-center">
          <div className="animate-pulse text-[#72767D]">Loading...</div>
        </div>
      </PageContainer>
    )
  }

  // Show login form even if user exists (will redirect via useEffect)
  // This prevents blank screen during redirect
  if (user) {
    return (
      <PageContainer className="flex items-center justify-center min-h-screen bg-[#FAFAFA]">
        <div className="text-center">
          <div className="animate-pulse text-[#72767D]">Redirecting...</div>
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#FAFAFA] via-white to-[#F8F9FA]">
      <Card className="w-full max-w-md rounded-xl shadow-xl border-gray-200">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-3xl font-bold text-[#2C2F33]">Welcome to Vora</CardTitle>
          <CardDescription className="text-[#72767D]">
            Sign in to your account to continue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 rounded-lg mb-6">
              <TabsTrigger value="login" className="rounded-lg">Login</TabsTrigger>
              <TabsTrigger value="register" className="rounded-lg">Register</TabsTrigger>
            </TabsList>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
                {error}
              </div>
            )}

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="login-email" className="text-sm font-medium text-[#2C2F33]">
                    Email
                  </label>
                  <Input
                    id="login-email"
                    name="email"
                    type="email"
                    placeholder="name@example.com"
                    required
                    className="rounded-lg"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="login-password" className="text-sm font-medium text-[#2C2F33]">
                    Password
                  </label>
                  <Input
                    id="login-password"
                    name="password"
                    type="password"
                    required
                    className="rounded-lg"
                  />
                </div>
                <Button type="submit" className="w-full rounded-lg mt-6" disabled={isLoading}>
                  <LogIn className="mr-2 h-4 w-4" />
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="register-name" className="text-sm font-medium text-[#2C2F33]">
                    Name
                  </label>
                  <Input
                    id="register-name"
                    name="name"
                    type="text"
                    placeholder="John Doe"
                    required
                    className="rounded-lg"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="register-email" className="text-sm font-medium text-[#2C2F33]">
                    Email
                  </label>
                  <Input
                    id="register-email"
                    name="email"
                    type="email"
                    placeholder="name@example.com"
                    required
                    className="rounded-lg"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="register-password" className="text-sm font-medium text-[#2C2F33]">
                    Password
                  </label>
                  <Input
                    id="register-password"
                    name="password"
                    type="password"
                    minLength={6}
                    required
                    className="rounded-lg"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="register-university" className="text-sm font-medium text-[#2C2F33]">
                    University (optional)
                  </label>
                  <Input
                    id="register-university"
                    name="university"
                    type="text"
                    placeholder="University name"
                    className="rounded-lg"
                  />
                </div>
                <Button type="submit" className="w-full rounded-lg mt-6" disabled={isLoading}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  {isLoading ? 'Creating account...' : 'Create Account'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-[#72767D] font-medium">
                  Or continue with
                </span>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              className="w-full mt-4 rounded-lg border-gray-200 hover:bg-gray-50 hover:border-gray-300"
              onClick={handleGoogleLogin}
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Continue with Google
            </Button>
          </div>
        </CardContent>
      </Card>
    </PageContainer>
  )
}
