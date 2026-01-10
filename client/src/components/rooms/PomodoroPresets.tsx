import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Plus, Star, Trash2, Edit, Loader2 } from "lucide-react"
import { presetsApi } from "@/lib/api-extended"
import { useToast } from "@/hooks/useToast"

interface Preset {
  _id: string;
  name: string;
  focusMinutes: number;
  breakMinutes: number;
  longBreakMinutes?: number;
  cycles?: number;
  isDefault: boolean;
}

export function PomodoroPresets() {
  const { toast } = useToast()
  const [presets, setPresets] = useState<Preset[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Preset | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    focusMinutes: 25,
    breakMinutes: 5,
    longBreakMinutes: 15,
    cycles: 4,
    isDefault: false,
  })

  useEffect(() => {
    fetchPresets()
  }, [])

  const fetchPresets = async () => {
    try {
      setLoading(true)
      const response = await presetsApi.getAll()
      setPresets(response.data.presets || [])
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to load presets',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)
      if (editing) {
        await presetsApi.update(editing._id, formData)
        toast({
          title: 'Preset updated',
          description: 'Your preset has been updated',
        })
      } else {
        await presetsApi.create(formData)
        toast({
          title: 'Preset created',
          description: 'Your new preset has been created',
        })
      }
      setOpen(false)
      setEditing(null)
      resetForm()
      fetchPresets()
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to save preset',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this preset?')) return
    
    try {
      setLoading(true)
      await presetsApi.delete(id)
      toast({
        title: 'Preset deleted',
        description: 'The preset has been removed',
      })
      fetchPresets()
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to delete preset',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSetDefault = async (id: string) => {
    try {
      setLoading(true)
      await presetsApi.setDefault(id)
      toast({
        title: 'Default preset set',
        description: 'This preset is now your default',
      })
      fetchPresets()
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to set default',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      focusMinutes: 25,
      breakMinutes: 5,
      longBreakMinutes: 15,
      cycles: 4,
      isDefault: false,
    })
  }

  const openEdit = (preset: Preset) => {
    setEditing(preset)
    setFormData({
      name: preset.name,
      focusMinutes: preset.focusMinutes,
      breakMinutes: preset.breakMinutes,
      longBreakMinutes: preset.longBreakMinutes || 15,
      cycles: preset.cycles || 4,
      isDefault: preset.isDefault,
    })
    setOpen(true)
  }

  const openNew = () => {
    setEditing(null)
    resetForm()
    setOpen(true)
  }

  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Pomodoro Presets</CardTitle>
            <CardDescription>
              Manage your timer presets
            </CardDescription>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={openNew} className="rounded-2xl">
                <Plus className="h-4 w-4 mr-2" />
                New Preset
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-2xl">
              <DialogHeader>
                <DialogTitle>{editing ? 'Edit Preset' : 'Create Preset'}</DialogTitle>
                <DialogDescription>
                  Configure your Pomodoro timer settings
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Preset Name</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="My Study Preset"
                    required
                    className="rounded-2xl"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Focus (minutes)</label>
                    <Input
                      type="number"
                      min="1"
                      max="120"
                      value={formData.focusMinutes}
                      onChange={(e) => setFormData({ ...formData, focusMinutes: parseInt(e.target.value) || 25 })}
                      required
                      className="rounded-2xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Break (minutes)</label>
                    <Input
                      type="number"
                      min="1"
                      max="60"
                      value={formData.breakMinutes}
                      onChange={(e) => setFormData({ ...formData, breakMinutes: parseInt(e.target.value) || 5 })}
                      required
                      className="rounded-2xl"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Long Break (minutes)</label>
                    <Input
                      type="number"
                      min="1"
                      max="60"
                      value={formData.longBreakMinutes}
                      onChange={(e) => setFormData({ ...formData, longBreakMinutes: parseInt(e.target.value) || 15 })}
                      className="rounded-2xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Cycles</label>
                    <Input
                      type="number"
                      min="1"
                      max="10"
                      value={formData.cycles}
                      onChange={(e) => setFormData({ ...formData, cycles: parseInt(e.target.value) || 4 })}
                      className="rounded-2xl"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="rounded-2xl" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Preset'
                    )}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setOpen(false)} className="rounded-2xl">
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {loading && presets.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : presets.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No presets yet. Create your first one!
          </p>
        ) : (
          <div className="space-y-3">
            {presets.map((preset) => (
              <div
                key={preset._id}
                className="flex items-center justify-between p-4 border rounded-2xl"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{preset.name}</h3>
                    {preset.isDefault && (
                      <Badge variant="outline" className="text-xs">
                        <Star className="h-3 w-3 mr-1 fill-yellow-500 text-yellow-500" />
                        Default
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Focus: {preset.focusMinutes}m • Break: {preset.breakMinutes}m
                    {preset.longBreakMinutes && ` • Long Break: ${preset.longBreakMinutes}m`}
                    {preset.cycles && ` • Cycles: ${preset.cycles}`}
                  </p>
                </div>
                <div className="flex gap-2">
                  {!preset.isDefault && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSetDefault(preset._id)}
                      className="rounded-2xl"
                      disabled={loading}
                    >
                      <Star className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEdit(preset)}
                    className="rounded-2xl"
                    disabled={loading}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(preset._id)}
                    className="rounded-2xl"
                    disabled={loading}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

