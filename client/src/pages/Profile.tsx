import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PageContainer } from "@/lib/design-system"
import { Save, Loader2, User, Settings, Target } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { usersApi, presetsApi, analyticsApi } from "@/lib/api-extended"
import { useToast } from "@/hooks/useToast"
import { i18n } from "@/lib/i18n"

export function Profile() {
  const { user, setUser } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [stats, setStats] = useState<any>(null)
  
  const [basicInfo, setBasicInfo] = useState({
    name: '',
    bio: '',
    university: '',
    timezone: 'UTC',
    avatarUrl: '',
    language: 'en' as 'en' | 'si' | 'ta',
  })

  const [preferences, setPreferences] = useState({
    theme: 'dark' as 'dark' | 'light' | 'system',
    notifications: {
      inApp: true,
      email: true,
      push: false,
    },
    focus: {
      dailyGoalMinutes: 120,
      defaultPresetId: null as string | null,
      focusModeEnabled: false,
      distractionBlockerEnabled: false,
    },
  })

  const [presets, setPresets] = useState<any[]>([])

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setFetching(true)
        const response = await usersApi.getMe()
        const userData = response.data.user
        
        setBasicInfo({
          name: userData.name || '',
          bio: userData.bio || '',
          university: userData.university || '',
          timezone: userData.timezone || 'UTC',
          avatarUrl: userData.avatarUrl || '',
          language: userData.language || 'en',
        })

        if (userData.preferences) {
          setPreferences({
            theme: userData.preferences.theme || 'dark',
            notifications: {
              inApp: userData.preferences.notifications?.inApp ?? true,
              email: userData.preferences.notifications?.email ?? true,
              push: userData.preferences.notifications?.push ?? false,
            },
            focus: {
              dailyGoalMinutes: userData.preferences.focus?.dailyGoalMinutes || 120,
              defaultPresetId: userData.preferences.focus?.defaultPresetId || null,
              focusModeEnabled: userData.preferences.focus?.focusModeEnabled || false,
              distractionBlockerEnabled: userData.preferences.focus?.distractionBlockerEnabled || false,
            },
          })
        }

        if (userData.stats) {
          setStats(userData.stats)
        }

        // Set i18n language
        i18n.setLanguage(userData.language || 'en')

        // Fetch presets
        try {
          const presetsResponse = await presetsApi.getAll()
          setPresets(presetsResponse.data.presets || [])
        } catch (err) {
          console.error('Failed to fetch presets:', err)
        }

        // Fetch stats
        try {
          const analyticsResponse = await analyticsApi.getMe('30d')
          setStats(analyticsResponse.data.analytics)
        } catch (err) {
          console.error('Failed to fetch analytics:', err)
        }
      } catch (err: any) {
        toast({
          title: 'Error',
          description: err.response?.data?.message || 'Couldn\'t load profile',
          variant: 'destructive',
        })
      } finally {
        setFetching(false)
      }
    }

    fetchProfile()
  }, [toast])

  const handleBasicInfoSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await usersApi.updateMe({
        name: basicInfo.name,
        bio: basicInfo.bio,
        university: basicInfo.university,
        timezone: basicInfo.timezone,
        avatarUrl: basicInfo.avatarUrl,
        language: basicInfo.language,
      })
      
      const updatedUser = response.data.user
      setUser(updatedUser)
      localStorage.setItem('user', JSON.stringify(updatedUser))
      
      i18n.setLanguage(basicInfo.language)
      
      toast({
        title: 'Profile updated',
        description: 'Changes saved',
      })
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Couldn\'t update profile',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePreferencesSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await usersApi.updateMe({
        preferences,
      })
      
      const updatedUser = response.data.user
      setUser(updatedUser)
      localStorage.setItem('user', JSON.stringify(updatedUser))
      
      if (preferences.theme === 'dark') {
        document.documentElement.classList.add('dark')
      } else if (preferences.theme === 'light') {
        document.documentElement.classList.remove('dark')
      }
      
      toast({
        title: 'Preferences updated',
        description: 'Settings saved',
      })
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Couldn\'t update preferences',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  if (fetching) {
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
      <div className="space-y-6 max-w-4xl">
        <div>
          <h1 className="text-4xl font-bold">Profile</h1>
          <p className="text-muted-foreground mt-2">
            Manage your account settings and preferences
          </p>
        </div>

        <Tabs defaultValue="basic" className="space-y-4">
          <TabsList className="rounded-2xl">
            <TabsTrigger value="basic" className="rounded-2xl">
              <User className="mr-2 h-4 w-4" />
              Basic Info
            </TabsTrigger>
            <TabsTrigger value="preferences" className="rounded-2xl">
              <Settings className="mr-2 h-4 w-4" />
              Preferences
            </TabsTrigger>
            <TabsTrigger value="focus" className="rounded-2xl">
              <Target className="mr-2 h-4 w-4" />
              Focus Settings
            </TabsTrigger>
            <TabsTrigger value="stats" className="rounded-2xl">
              Stats
            </TabsTrigger>
          </TabsList>

          <TabsContent value="basic">
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
                <CardDescription>
                  Update your account details
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleBasicInfoSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-medium">
                      Name
                    </label>
                    <Input
                      id="name"
                      value={basicInfo.name}
                      onChange={(e) => setBasicInfo({ ...basicInfo, name: e.target.value })}
                      required
                      maxLength={100}
                      className="rounded-2xl"
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="bio" className="text-sm font-medium">
                      Bio
                    </label>
                    <Textarea
                      id="bio"
                      value={basicInfo.bio}
                      onChange={(e) => setBasicInfo({ ...basicInfo, bio: e.target.value })}
                      placeholder="Tell us about yourself"
                      maxLength={500}
                      className="rounded-2xl"
                      disabled={loading}
                      rows={4}
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium">
                      Email
                    </label>
                    <Input
                      id="email"
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="rounded-2xl bg-muted"
                    />
                    <p className="text-xs text-muted-foreground">
                      Email cannot be changed
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="university" className="text-sm font-medium">
                      University (optional)
                    </label>
                    <Input
                      id="university"
                      value={basicInfo.university}
                      onChange={(e) => setBasicInfo({ ...basicInfo, university: e.target.value })}
                      placeholder="University name"
                      maxLength={200}
                      className="rounded-2xl"
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="timezone" className="text-sm font-medium">
                      Timezone
                    </label>
                    <Input
                      id="timezone"
                      value={basicInfo.timezone}
                      onChange={(e) => setBasicInfo({ ...basicInfo, timezone: e.target.value })}
                      placeholder="UTC"
                      className="rounded-2xl"
                      disabled={loading}
                    />
                    <p className="text-xs text-muted-foreground">
                      IANA timezone identifier (e.g., America/New_York)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="avatarUrl" className="text-sm font-medium">
                      Avatar URL
                    </label>
                    <Input
                      id="avatarUrl"
                      type="url"
                      value={basicInfo.avatarUrl}
                      onChange={(e) => setBasicInfo({ ...basicInfo, avatarUrl: e.target.value })}
                      placeholder="https://example.com/avatar.jpg"
                      className="rounded-2xl"
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="language" className="text-sm font-medium">
                      Language
                    </label>
                    <Select
                      id="language"
                      value={basicInfo.language}
                      onChange={(e) => setBasicInfo({ ...basicInfo, language: e.target.value as 'en' | 'si' | 'ta' })}
                      className="rounded-2xl"
                      disabled={loading}
                    >
                      <option value="en">English</option>
                      <option value="si">සිංහල (Sinhala)</option>
                      <option value="ta">தமிழ் (Tamil)</option>
                    </Select>
                  </div>

                  <Button 
                    type="submit" 
                    className="rounded-2xl" 
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preferences">
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle>Preferences</CardTitle>
                <CardDescription>
                  Customize your experience
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePreferencesSubmit} className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Theme</h3>
                    <Select
                      value={preferences.theme}
                      onChange={(e) => setPreferences({ 
                        ...preferences, 
                        theme: e.target.value as 'dark' | 'light' | 'system' 
                      })}
                      className="rounded-2xl"
                      disabled={loading}
                    >
                      <option value="dark">Dark</option>
                      <option value="light">Light</option>
                      <option value="system">System</option>
                    </Select>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Notifications</h3>
                    <div className="space-y-3">
                      <Switch
                        checked={preferences.notifications.inApp}
                        onChange={(e) => setPreferences({
                          ...preferences,
                          notifications: {
                            ...preferences.notifications,
                            inApp: e.target.checked,
                          },
                        })}
                        label="In-app notifications"
                        disabled={loading}
                      />
                      <Switch
                        checked={preferences.notifications.email}
                        onChange={(e) => setPreferences({
                          ...preferences,
                          notifications: {
                            ...preferences.notifications,
                            email: e.target.checked,
                          },
                        })}
                        label="Email notifications"
                        disabled={loading}
                      />
                      <Switch
                        checked={preferences.notifications.push}
                        onChange={(e) => setPreferences({
                          ...preferences,
                          notifications: {
                            ...preferences.notifications,
                            push: e.target.checked,
                          },
                        })}
                        label="Push notifications"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="rounded-2xl" 
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Preferences
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="focus">
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle>Focus Settings</CardTitle>
                <CardDescription>
                  Configure your focus and productivity preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePreferencesSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label htmlFor="dailyGoal" className="text-sm font-medium">
                      Daily Goal (minutes)
                    </label>
                    <Input
                      id="dailyGoal"
                      type="number"
                      min="0"
                      max="1440"
                      value={preferences.focus.dailyGoalMinutes}
                      onChange={(e) => setPreferences({
                        ...preferences,
                        focus: {
                          ...preferences.focus,
                          dailyGoalMinutes: parseInt(e.target.value) || 120,
                        },
                      })}
                      className="rounded-2xl"
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="defaultPreset" className="text-sm font-medium">
                      Default Pomodoro Preset
                    </label>
                    <Select
                      id="defaultPreset"
                      value={preferences.focus.defaultPresetId || ''}
                      onChange={(e) => setPreferences({
                        ...preferences,
                        focus: {
                          ...preferences.focus,
                          defaultPresetId: e.target.value || null,
                        },
                      })}
                      className="rounded-2xl"
                      disabled={loading}
                    >
                      <option value="">None</option>
                      {presets.map((preset) => (
                        <option key={preset._id} value={preset._id}>
                          {preset.name} ({preset.focusMinutes}m / {preset.breakMinutes}m)
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <Switch
                      checked={preferences.focus.focusModeEnabled}
                      onChange={(e) => setPreferences({
                        ...preferences,
                        focus: {
                          ...preferences.focus,
                          focusModeEnabled: e.target.checked,
                        },
                      })}
                      label="Enable Focus Mode (locks chat during focus)"
                      disabled={loading}
                    />
                    <Switch
                      checked={preferences.focus.distractionBlockerEnabled}
                      onChange={(e) => setPreferences({
                        ...preferences,
                        focus: {
                          ...preferences.focus,
                          distractionBlockerEnabled: e.target.checked,
                        },
                      })}
                      label="Enable Distraction Blocker (full-screen overlay during focus)"
                      disabled={loading}
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="rounded-2xl" 
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Focus Settings
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stats">
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle>Account Statistics</CardTitle>
                <CardDescription>
                  Your activity overview
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <p className="text-2xl font-bold">{stats?.streakCount || 0}</p>
                    <p className="text-sm text-muted-foreground">Current Streak</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {stats?.tasksCompletedCount || 0}
                    </p>
                    <p className="text-sm text-muted-foreground">Tasks Completed (30d)</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {stats?.goalProgress?.actualMinutes || 0} / {stats?.goalProgress?.dailyGoalMinutes || 120}
                    </p>
                    <p className="text-sm text-muted-foreground">Today's Goal Progress</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PageContainer>
  )
}
