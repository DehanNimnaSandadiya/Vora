import { useEffect, useState, useCallback } from 'react';
import { useSocket } from './useSocket';
import api from '@/lib/api';

interface PresenceUser {
  userId: string;
  status: 'studying' | 'break' | 'idle';
  joinedAt: string;
  user: {
    _id: string;
    name: string;
    email: string;
    avatar: string | null;
  };
}

interface Message {
  _id: string;
  roomId: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    avatar: string | null;
  };
  text: string;
  createdAt: string;
}

export const useRoom = (roomId: string | undefined) => {
  const { socket, isConnected } = useSocket();
  const [presence, setPresence] = useState<PresenceUser[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRoomJoined, setIsRoomJoined] = useState(false);

  // Join room when socket is connected and roomId is available
  useEffect(() => {
    if (!socket || !isConnected || !roomId) {
      setIsRoomJoined(false);
      return;
    }

    const handleRoomJoined = (data: { roomId: string }) => {
      if (data.roomId === roomId) {
        setIsRoomJoined(true);
      }
    };

    const handleRoomError = (error: { message: string }) => {
      // Only log room join errors, don't spam console
      if (error.message && !error.message.includes('Already')) {
        console.debug('Room join error:', error.message);
      }
    };

    socket.on('room:joined', handleRoomJoined);
    socket.on('error', handleRoomError);
    socket.emit('room:join', { roomId });

    return () => {
      socket.off('room:joined', handleRoomJoined);
      socket.off('error', handleRoomError);
      if (socket.connected) {
        socket.emit('room:leave');
      }
      setIsRoomJoined(false);
    };
  }, [socket, isConnected, roomId]);

  // Listen for presence updates
  useEffect(() => {
    if (!socket) return;

    const handlePresence = (data: { users: PresenceUser[] }) => {
      setPresence(data.users);
    };

    socket.on('room:presence', handlePresence);

    return () => {
      socket.off('room:presence', handlePresence);
    };
  }, [socket]);

  // Listen for chat messages
  useEffect(() => {
    if (!socket) return;

    const handleMessage = (message: Message) => {
      setMessages((prev) => [...prev, message]);
    };

    socket.on('chat:message', handleMessage);

    return () => {
      socket.off('chat:message', handleMessage);
    };
  }, [socket]);

  // Load initial messages
  useEffect(() => {
    if (!roomId) {
      setLoading(false);
      return;
    }

    const loadMessages = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/rooms/${roomId}/messages`);
        setMessages(response.data.messages || []);
        setError(null);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load messages');
      } finally {
        setLoading(false);
      }
    };

    loadMessages();
  }, [roomId]);

  const updatePresence = useCallback(
    (status: 'studying' | 'break' | 'idle') => {
      if (!socket || !isConnected) return;
      socket.emit('presence:update', { status });
    },
    [socket, isConnected]
  );

  const sendMessage = useCallback(
    (text: string) => {
      if (!socket || !isConnected || !roomId) return;
      socket.emit('chat:message', { roomId, text });
    },
    [socket, isConnected, roomId]
  );

  return {
    presence,
    messages,
    loading,
    error,
    updatePresence,
    sendMessage,
    isConnected,
    isRoomJoined,
  };
};

