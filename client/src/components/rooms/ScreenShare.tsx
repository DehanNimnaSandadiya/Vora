import { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Monitor, MonitorOff } from 'lucide-react';
import { useSocket } from '@/hooks/useSocket';
import { useToast } from '@/hooks/useToast';

interface ScreenShareProps {
  roomId: string;
  isRoomJoined?: boolean;
}

export function ScreenShare({ roomId, isRoomJoined = true }: ScreenShareProps) {
  const { socket, isConnected } = useSocket();
  const { toast } = useToast();
  const [isSharing, setIsSharing] = useState(false);
  const [isViewing, setIsViewing] = useState(false);
  const [sharerId, setSharerId] = useState<string | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const sharerPcRef = useRef<RTCPeerConnection | null>(null);

  const handleReceiveOffer = useCallback(async (offer: RTCSessionDescriptionInit, sharerSocketId: string) => {
    if (!socket) return;
    
    try {
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
      });

      pc.onicecandidate = (event) => {
        if (event.candidate && socket) {
          socket.emit('screenshare:ice-candidate', {
            roomId,
            candidate: event.candidate,
          });
        }
      };

      pc.ontrack = (event) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit('screenshare:answer', {
        roomId,
        answer,
        sharerUserId: sharerSocketId,
      });

      pcRef.current = pc;
    } catch (error: any) {
      console.error('Error receiving offer:', error);
      toast({
        title: 'Screen share error',
        description: 'Failed to receive screen share',
        variant: 'destructive',
      });
    }
  }, [socket, roomId, toast]);

  const handleStopViewing = () => {
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }

    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }

    setIsViewing(false);
    setSharerId(null);
  };

  useEffect(() => {
    if (!socket || !isConnected || !isRoomJoined) return;

    const handleScreenShareStart = (data: { userId: string; offer: RTCSessionDescriptionInit }) => {
      if (!data.userId || !data.offer) return;
      if (isSharing) return;

      setSharerId(data.userId);
      setIsViewing(true);
      handleReceiveOffer(data.offer, data.userId).catch(console.error);
    };

    const handleScreenShareStop = () => {
      handleStopViewing();
    };

    const handleIceCandidate = async (data: { userId: string; candidate: RTCIceCandidateInit }) => {
      if (!data.candidate) return;
      
      if (isSharing && sharerPcRef.current) {
        if (data.userId === socket?.id) return;
        try {
          await sharerPcRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (error) {
          console.error('Error adding ICE candidate to sharer PC:', error);
        }
      } else if (isViewing && pcRef.current) {
        if (data.userId === sharerId) {
          try {
            await pcRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
          } catch (error) {
            console.error('Error adding ICE candidate to viewer PC:', error);
          }
        }
      }
    };

    const handleAnswer = async (data: { userId: string; answer: RTCSessionDescriptionInit }) => {
      if (!isSharing || !sharerPcRef.current || !data.answer) return;
      if (data.userId === socket?.id) return;
      
      try {
        await sharerPcRef.current.setRemoteDescription(new RTCSessionDescription(data.answer));
      } catch (error) {
        console.error('Error setting remote description:', error);
      }
    };

    socket.on('screenshare:start', handleScreenShareStart);
    socket.on('screenshare:stop', handleScreenShareStop);
    socket.on('screenshare:ice-candidate', handleIceCandidate);
    socket.on('screenshare:answer', handleAnswer);

    return () => {
      socket.off('screenshare:start', handleScreenShareStart);
      socket.off('screenshare:stop', handleScreenShareStop);
      socket.off('screenshare:ice-candidate', handleIceCandidate);
      socket.off('screenshare:answer', handleAnswer);
    };
  }, [socket, isConnected, isRoomJoined, isSharing, sharerId]);

  const handleStartShare = async () => {
    if (!socket || !socket.connected || !isConnected || !isRoomJoined) {
      toast({
        title: 'Not connected',
        description: 'Please wait for connection',
        variant: 'destructive',
      });
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });

      localStreamRef.current = stream;

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
      });

      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('screenshare:ice-candidate', {
            roomId,
            candidate: event.candidate,
          });
        }
      };

      stream.getVideoTracks()[0].onended = () => {
        handleStopShare();
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socket.emit('screenshare:start', {
        roomId,
        offer,
      });

      sharerPcRef.current = pc;
      setIsSharing(true);
    } catch (error: any) {
      if (error.name === 'NotAllowedError') {
        toast({
          title: 'Permission denied',
          description: 'Screen share permission was denied',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Screen share error',
          description: error.message || 'Failed to start screen share',
          variant: 'destructive',
        });
      }
    }
  };

  const handleStopShare = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    if (sharerPcRef.current) {
      sharerPcRef.current.close();
      sharerPcRef.current = null;
    }

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }

    if (socket && socket.connected) {
      socket.emit('screenshare:stop', { roomId });
    }

    setIsSharing(false);
  };

  useEffect(() => {
    return () => {
      handleStopShare();
      handleStopViewing();
    };
  }, [roomId]);

  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            Screen Share
          </CardTitle>
          {!isSharing && !isViewing && (
            <Button
              onClick={handleStartShare}
              disabled={!isConnected || !isRoomJoined}
              size="sm"
              className="rounded-2xl"
            >
              <Monitor className="h-4 w-4 mr-2" />
              Start Share
            </Button>
          )}
          {isSharing && (
            <Button
              onClick={handleStopShare}
              variant="destructive"
              size="sm"
              className="rounded-2xl"
            >
              <MonitorOff className="h-4 w-4 mr-2" />
              Stop Share
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isSharing && localVideoRef.current && (
          <div className="space-y-2">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="w-full rounded-lg border"
              style={{ maxHeight: '400px' }}
            />
            <p className="text-sm text-muted-foreground">Sharing your screen</p>
          </div>
        )}
        {isViewing && remoteVideoRef.current && (
          <div className="space-y-2">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full rounded-lg border"
              style={{ maxHeight: '400px' }}
            />
            <p className="text-sm text-muted-foreground">Viewing shared screen</p>
          </div>
        )}
        {!isSharing && !isViewing && (
          <p className="text-sm text-muted-foreground">
            Share your screen with room members. Only one person can share at a time.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
