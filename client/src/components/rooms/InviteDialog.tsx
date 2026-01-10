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
import { Mail, Loader2 } from "lucide-react"
import api from "@/lib/api"
import { useToast } from "@/hooks/useToast"

interface InviteDialogProps {
  roomId: string
  roomName: string
  isPrivate?: boolean
  roomCode?: string
}

export function InviteDialog({ roomId, roomName, isPrivate, roomCode }: InviteDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState("")
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || loading) return

    try {
      setLoading(true)
      await api.post('/invites/send', {
        email: email.trim(),
        roomId,
      })
      
      setEmail("")
      setOpen(false)
      toast({
        title: 'Invite sent',
        description: `Invitation email sent to ${email.trim()}`,
      })
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Failed to send invite',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="rounded-2xl">
          <Mail className="mr-2 h-4 w-4" />
          Invite
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] rounded-2xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Invite to {roomName}</DialogTitle>
            <DialogDescription>
              Send an invitation email to join this room
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="friend@example.com"
                required
                className="rounded-2xl"
                disabled={loading}
              />
            </div>
            {isPrivate && roomCode && (
              <div className="p-3 rounded-2xl bg-muted">
                <p className="text-sm">
                  <strong>Room Code:</strong> {roomCode}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  The invite email will include this code
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="rounded-2xl"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="rounded-2xl">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Send Invite
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

