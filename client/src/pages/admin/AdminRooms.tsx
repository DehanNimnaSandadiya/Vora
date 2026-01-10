import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import api from '@/lib/api';
import { useToast } from '@/hooks/useToast';
import { Search, Trash2, DoorOpen } from 'lucide-react';

interface Room {
  _id: string;
  name: string;
  isPrivate: boolean;
  owner: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  memberCount: number;
  messageCount: number;
}

export function AdminRooms() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingRoomId, setDeletingRoomId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchRooms();
  }, [page, search]);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/rooms', {
        params: { page, limit: 10, search },
      });
      setRooms(response.data.data.rooms);
      setTotalPages(response.data.data.pagination.pages);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to load rooms',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (roomId: string) => {
    setDeletingRoomId(roomId);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingRoomId) return;

    try {
      await api.delete(`/admin/rooms/${deletingRoomId}`);
      toast({
        title: 'Success',
        description: 'Room deleted successfully',
      });
      setIsDeleteDialogOpen(false);
      setDeletingRoomId(null);
      fetchRooms();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete room',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Room Management</h1>
        <p className="text-slate-400">Manage all rooms in the system</p>
      </div>

      {/* Search */}
      <Card className="bg-slate-900/50 border-slate-800 rounded-2xl">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search rooms by name..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-10 bg-slate-800 border-slate-700 text-white rounded-2xl"
            />
          </div>
        </CardContent>
      </Card>

      {/* Rooms Table */}
      <Card className="bg-slate-900/50 border-slate-800 rounded-2xl">
        <CardHeader>
          <CardTitle className="text-white">Rooms</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-pulse text-slate-400">Loading rooms...</div>
            </div>
          ) : rooms.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <DoorOpen className="h-12 w-12 mb-4 opacity-50" />
              <p>No rooms found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-800">
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Name</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Type</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Owner</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Members</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Messages</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Created</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rooms.map((room) => (
                      <tr key={room._id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                        <td className="py-3 px-4 text-white font-medium">{room.name}</td>
                        <td className="py-3 px-4">
                          <Badge
                            variant={room.isPrivate ? 'secondary' : 'outline'}
                            className={room.isPrivate ? 'bg-slate-800 text-slate-200' : 'border-slate-700 text-slate-300'}
                          >
                            {room.isPrivate ? 'Private' : 'Public'}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-slate-300">{room.owner.name}</td>
                        <td className="py-3 px-4 text-slate-300">{room.memberCount}</td>
                        <td className="py-3 px-4 text-slate-300">{room.messageCount}</td>
                        <td className="py-3 px-4 text-slate-400 text-sm">
                          {new Date(room.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(room._id)}
                              className="text-red-400 hover:text-red-300"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-800">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="border-slate-700 text-slate-300"
                  >
                    Previous
                  </Button>
                  <span className="text-slate-400 text-sm">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="border-slate-700 text-slate-300"
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">Delete Room</DialogTitle>
            <DialogDescription className="text-slate-400">
              Are you sure you want to delete this room? This action cannot be undone and will also delete all related messages and tasks.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              className="border-slate-700 text-slate-300"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white rounded-2xl"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}



