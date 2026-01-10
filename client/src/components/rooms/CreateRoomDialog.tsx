import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus } from "lucide-react"
import api from "@/lib/api"
import { useNavigate } from "react-router-dom"

interface CreateRoomDialogProps {
  onRoomCreated?: () => void
}

export function CreateRoomDialog({ onRoomCreated }: CreateRoomDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const isPrivate = formData.get('isPrivate') === 'on'

    try {
      const response = await api.post('/rooms', {
        name,
        description,
        isPrivate,
      })

      setOpen(false)
      if (onRoomCreated) {
        onRoomCreated()
      }
      navigate(`/rooms/${response.data.room._id}`)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Couldn\'t create room')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-2xl">
          <Plus className="mr-2 h-4 w-4" />
          Create Room
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] rounded-2xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Study Room</DialogTitle>
            <DialogDescription>
              Start a new study room
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Room Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="e.g., Computer Science Study Group"
                required
                maxLength={100}
                className="rounded-2xl"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Input
                id="description"
                name="description"
                placeholder="What will you study?"
                maxLength={500}
                className="rounded-2xl"
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isPrivate"
                name="isPrivate"
                className="rounded border-gray-300"
              />
              <Label htmlFor="isPrivate" className="font-normal cursor-pointer">
                Private room (requires code to join)
              </Label>
            </div>
            {error && (
              <div className="p-3 rounded-2xl bg-destructive/10 text-destructive text-sm">
                {error}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="rounded-2xl"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="rounded-2xl">
              {loading ? 'Creating...' : 'Create Room'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

