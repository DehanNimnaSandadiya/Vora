import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { PageContainer } from "@/lib/design-system"
import { Search, UserPlus, Check, X, UserMinus, Loader2, Users } from "lucide-react"
import { friendsApi } from "@/lib/api-extended"
import { useToast } from "@/hooks/useToast"
import { useSocket } from "@/hooks/useSocket"

interface Friend {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  avatarUrl?: string;
}

export function Friends() {
  const { toast } = useToast()
  const { socket } = useSocket()
  const [loading, setLoading] = useState(false)
  const [friends, setFriends] = useState<Friend[]>([])
  const [requestsIn, setRequestsIn] = useState<Friend[]>([])
  const [requestsOut, setRequestsOut] = useState<Friend[]>([])
  const [searchResults, setSearchResults] = useState<Friend[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [onlineFriends, setOnlineFriends] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchData()
    
    // Listen for online friends updates
    if (socket) {
      socket.on('friends:online', (data: { friends: string[] }) => {
        setOnlineFriends(new Set(data.friends))
      })

      return () => {
        socket.off('friends:online')
      }
    }
  }, [socket])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [friendsRes, requestsRes] = await Promise.all([
        friendsApi.getFriends(),
        friendsApi.getRequests(),
      ])
      setFriends(friendsRes.data.friends || [])
      setRequestsIn(requestsRes.data.requestsIn || [])
      setRequestsOut(requestsRes.data.requestsOut || [])
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Couldn\'t load friends',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([])
      return
    }

    try {
      const response = await friendsApi.searchUsers(query)
      setSearchResults(response.data.users || [])
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Couldn\'t search users',
        variant: 'destructive',
      })
    }
  }

  const handleSendRequest = async (userId: string, email?: string) => {
    try {
      await friendsApi.sendRequest({ userId, email })
      toast({
        title: 'Request sent',
        description: 'Friend request sent',
      })
      fetchData()
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Couldn\'t send request',
        variant: 'destructive',
      })
    }
  }

  const handleAccept = async (userId: string) => {
    try {
      await friendsApi.acceptRequest(userId)
      toast({
        title: 'Request accepted',
        description: 'You\'re now friends!',
      })
      fetchData()
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Couldn\'t accept request',
        variant: 'destructive',
      })
    }
  }

  const handleReject = async (userId: string) => {
    try {
      await friendsApi.rejectRequest(userId)
      toast({
        title: 'Request rejected',
      })
      fetchData()
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Couldn\'t reject request',
        variant: 'destructive',
      })
    }
  }

  const handleRemove = async (userId: string) => {
    try {
      await friendsApi.removeFriend(userId)
      toast({
        title: 'Friend removed',
      })
      fetchData()
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.response?.data?.message || 'Couldn\'t remove friend',
        variant: 'destructive',
      })
    }
  }

  const getAvatarUrl = (friend: Friend) => {
    return friend.avatarUrl || friend.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(friend.name)}`
  }

  return (
    <PageContainer>
      <div className="space-y-6 max-w-4xl">
        <div>
          <h1 className="text-4xl font-bold flex items-center gap-2">
            <Users className="h-10 w-10" />
            Friends
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage your friends and connect with others
          </p>
        </div>

        {/* Search */}
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>Search Users</CardTitle>
            <CardDescription>
              Find users by name or email
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  handleSearch(e.target.value)
                }}
                className="rounded-2xl"
              />
              <Button
                onClick={() => handleSearch(searchQuery)}
                className="rounded-2xl"
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>

            {searchResults.length > 0 && (
              <div className="mt-4 space-y-2">
                {searchResults.map((user) => {
                  const isFriend = friends.some(f => f._id === user._id)
                  const hasRequestOut = requestsOut.some(r => r._id === user._id)
                  const hasRequestIn = requestsIn.some(r => r._id === user._id)

                  return (
                    <div
                      key={user._id}
                      className="flex items-center justify-between p-3 border rounded-2xl"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={getAvatarUrl(user)}
                          alt={user.name}
                          className="w-10 h-10 rounded-full"
                        />
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {isFriend ? (
                          <Badge variant="outline">Friend</Badge>
                        ) : hasRequestOut ? (
                          <Badge variant="outline">Request Sent</Badge>
                        ) : hasRequestIn ? (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleAccept(user._id)}
                              className="rounded-2xl"
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleReject(user._id)}
                              className="rounded-2xl"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handleSendRequest(user._id, user.email)}
                            className="rounded-2xl"
                          >
                            <UserPlus className="h-4 w-4 mr-1" />
                            Add
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Friend Requests */}
        {requestsIn.length > 0 && (
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle>Friend Requests</CardTitle>
              <CardDescription>
                Pending friend requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {requestsIn.map((request) => (
                  <div
                    key={request._id}
                    className="flex items-center justify-between p-3 border rounded-2xl"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={getAvatarUrl(request)}
                        alt={request.name}
                        className="w-10 h-10 rounded-full"
                      />
                      <div>
                        <p className="font-medium">{request.name}</p>
                        <p className="text-sm text-muted-foreground">{request.email}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleAccept(request._id)}
                        className="rounded-2xl"
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReject(request._id)}
                        className="rounded-2xl"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Friends List */}
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>My Friends ({friends.length})</CardTitle>
            <CardDescription>
              Your friends list
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : friends.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No friends yet. Search for users to add them!
              </p>
            ) : (
              <div className="space-y-3">
                {friends.map((friend) => (
                  <div
                    key={friend._id}
                    className="flex items-center justify-between p-3 border rounded-2xl"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img
                          src={getAvatarUrl(friend)}
                          alt={friend.name}
                          className="w-10 h-10 rounded-full"
                        />
                        {onlineFriends.has(friend._id) && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background"></div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium flex items-center gap-2">
                          {friend.name}
                          {onlineFriends.has(friend._id) && (
                            <Badge variant="outline" className="text-xs">Online</Badge>
                          )}
                        </p>
                        <p className="text-sm text-muted-foreground">{friend.email}</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRemove(friend._id)}
                      className="rounded-2xl"
                    >
                      <UserMinus className="h-4 w-4 mr-1" />
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  )
}

