import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/useToast';

// Socket.io needs base URL without /api
const getSocketUrl = () => {
  const apiUrl = import.meta.env.VITE_API_URL;
  if (!apiUrl) {
    if (import.meta.env.DEV) {
      return 'http://localhost:5000';
    }
    // Production without VITE_API_URL - this should not happen
    console.error('VITE_API_URL is not set in production!');
    return window.location.origin;
  }
  // Remove /api suffix if present
  return apiUrl.replace(/\/api$/, '');
};
const SOCKET_URL = getSocketUrl();

export const useSocket = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!user) {
      // Disconnect if user logs out
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setIsConnected(false);
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      return;
    }

    // Get token from localStorage
    const token = localStorage.getItem('token');

    if (!token) {
      return;
    }

    // Create socket connection with settings optimized for Render free tier (cold starts)
    const newSocket = io(SOCKET_URL, {
      auth: {
        token,
      },
      transports: ['websocket', 'polling'], // Prefer websocket, fallback to polling
      reconnection: true,
      reconnectionDelay: 2000, // Wait 2s before first reconnect (give Render time to wake)
      reconnectionDelayMax: 10000, // Max 10s delay between attempts
      reconnectionAttempts: Infinity, // Keep trying indefinitely (Render can take 60s+ to wake)
      // Prevent multiple connections
      forceNew: false,
      // Longer timeout for Render cold starts (can take 30-60 seconds)
      timeout: 60000, // 60 seconds
      // Enable upgrade from polling to websocket after connection
      upgrade: true,
    });

    let hasConnected = false;
    let wasDisconnected = false;

    newSocket.on('connect', () => {
      console.log('Socket connected');
      setIsConnected(true);
      if (hasConnected && wasDisconnected) {
        toast({
          title: 'Reconnected',
          description: 'Realtime features restored',
        });
      }
      hasConnected = true;
      wasDisconnected = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      setIsConnected(false);
      wasDisconnected = true;
      if (hasConnected && reason !== 'io client disconnect' && reason !== 'ping timeout' && reason !== 'transport error' && reason !== 'parse error') {
        setTimeout(() => {
          if (!newSocket.connected) {
            if (reason === 'io server disconnect') {
              toast({
                title: 'Disconnected',
                description: 'Reconnecting to server...',
                variant: 'destructive',
              });
            } else {
              toast({
                title: 'Connection lost',
                description: 'Trying to reconnect...',
                variant: 'destructive',
              });
            }
          }
        }, 2000);
      }
    });

    newSocket.on('connect_error', (error) => {
      const isTimeout = error.message.includes('timeout') || error.message.includes('xhr poll error');
      if (!isTimeout) {
        console.log('Socket connect_error:', error.message);
      }
      if (error.message.includes('Authentication')) {
        toast({
          title: 'Authentication failed',
          description: 'Please log in again',
          variant: 'destructive',
        });
      }
    });

    newSocket.on('error', (error) => {
      // Completely suppress "join the room" errors - they're handled by components
      if (error.message && (error.message.includes('join the room') || error.message.includes('Not in this room') || error.message.includes('Please join'))) {
        return // Silently ignore these expected errors
      }
      
      // Filter out expected/benign errors that don't need user notification
      if (typeof error === 'object' && error !== null && 'message' in error) {
        const errorMessage = String(error.message);
        
        // Don't show toast for these expected errors:
        // - "Not in this room" during initial connection/room join
        // - Connection errors that will auto-retry
        const suppressErrors = [
          'Not in this room',
          'Connection error',
        ];
        
        const shouldSuppress = suppressErrors.some(msg => 
          errorMessage.includes(msg)
        );
        
        if (!shouldSuppress) {
          console.error('Socket error:', error);
          toast({
            title: 'Connection error',
            description: errorMessage,
            variant: 'destructive',
          });
        } else {
          // Log suppressed errors for debugging
          console.debug('Socket error (suppressed):', error);
        }
      } else {
        console.error('Socket error:', error);
      }
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
      socketRef.current = null;
      setSocket(null);
      setIsConnected(false);
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [user, toast]);

  return { socket, isConnected };
};

