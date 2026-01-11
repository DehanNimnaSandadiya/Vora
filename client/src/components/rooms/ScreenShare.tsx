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
  const sharerPcsRef = useRef<Map<string, RTCPeerConnection>>(new Map());

  const handleReceiveOffer = useCallback(async (offer: RTCSessionDescriptionInit, sharerSocketId: string) => {
    if (!socket) return;
    
    try {
      // Close existing peer connection if any
      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }

      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ],
      });

      pc.onicecandidate = (event) => {
        if (event.candidate && socket && socket.connected) {
          socket.emit('screenshare:ice-candidate', {
            roomId,
            candidate: event.candidate,
          });
        }
      };

      pc.ontrack = (event) => {
        console.log('Received track event:', event);
        // Use setTimeout to ensure DOM is updated
        setTimeout(() => {
          if (event.streams && event.streams.length > 0) {
            if (remoteVideoRef.current) {
              remoteVideoRef.current.srcObject = event.streams[0];
              remoteVideoRef.current.play().catch(console.error);
              console.log('Set remote video stream from streams');
            } else {
              console.warn('Remote video ref not available yet, retrying...');
              setTimeout(() => {
                if (remoteVideoRef.current && event.streams[0]) {
                  remoteVideoRef.current.srcObject = event.streams[0];
                  remoteVideoRef.current.play().catch(console.error);
                }
              }, 100);
            }
          } else if (event.track) {
            const stream = new MediaStream([event.track]);
            if (remoteVideoRef.current) {
              remoteVideoRef.current.srcObject = stream;
              remoteVideoRef.current.play().catch(console.error);
              console.log('Set remote video stream from track');
            } else {
              console.warn('Remote video ref not available yet, retrying...');
              setTimeout(() => {
                if (remoteVideoRef.current) {
                  remoteVideoRef.current.srcObject = stream;
                  remoteVideoRef.current.play().catch(console.error);
                }
              }, 100);
            }
          }
        }, 0);
      };

      pc.onconnectionstatechange = () => {
        console.log('Peer connection state:', pc.connectionState);
        if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
          console.error('Peer connection failed or disconnected');
          toast({
            title: 'Connection issue',
            description: 'Screen share connection lost',
            variant: 'destructive',
          });
        } else if (pc.connectionState === 'connected') {
          console.log('Peer connection established successfully');
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
      setSharerId(sharerSocketId);
    } catch (error: any) {
      console.error('Error receiving offer:', error);
      toast({
        title: 'Screen share error',
        description: error.message || 'Failed to receive screen share',
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

    const handleScreenShareStart = async (data: { userId: string; offer: RTCSessionDescriptionInit }) => {
      if (!data.userId || !data.offer) {
        console.warn('Invalid screen share start data:', data);
        return;
      }
      if (isSharing) {
        console.log('Already sharing, ignoring start event');
        return;
      }
      if (socket?.id === data.userId) {
        console.log('Ignoring own screen share start event');
        return;
      }

      console.log('Received screen share start from:', data.userId);
      setSharerId(data.userId);
      setIsViewing(true);
      await handleReceiveOffer(data.offer, data.userId);
    };

    const handleScreenShareStop = () => {
      handleStopViewing();
    };

    const handleIceCandidate = async (data: { userId: string; candidate: RTCIceCandidateInit }) => {
      if (!data.candidate || !data.userId) return;
      
      if (isSharing) {
        // If we're sharing, accept ICE candidates from viewers
        if (data.userId === socket?.id) return;
        const viewerPc = sharerPcsRef.current.get(data.userId);
        if (viewerPc) {
          try {
            await viewerPc.addIceCandidate(new RTCIceCandidate(data.candidate));
            console.log('Added ICE candidate to sharer PC for viewer:', data.userId);
          } catch (error: any) {
            if (error.message && !error.message.includes('already') && !error.message.includes('closing')) {
              console.error('Error adding ICE candidate to sharer PC:', error);
            }
          }
        }
      } else if (isViewing && pcRef.current && data.userId === sharerId) {
        // If we're viewing, only accept ICE candidates from the sharer
        try {
          await pcRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
          console.log('Added ICE candidate to viewer PC from sharer');
        } catch (error: any) {
          if (error.message && !error.message.includes('already') && !error.message.includes('closing')) {
            console.error('Error adding ICE candidate to viewer PC:', error);
          }
        }
      }
    };

    const handleAnswer = async (data: { userId: string; answer: RTCSessionDescriptionInit }) => {
      if (!isSharing || !data.answer || !data.userId) return;
      if (data.userId === socket?.id) return;
      
      try {
        console.log('Received answer from viewer:', data.userId);
        let viewerPc = sharerPcsRef.current.get(data.userId);
        
        if (!viewerPc && localStreamRef.current) {
          // Create new peer connection for this viewer
          viewerPc = new RTCPeerConnection({
            iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
          });
          
          // Add all tracks from local stream
          localStreamRef.current.getTracks().forEach((track) => {
            viewerPc!.addTrack(track, localStreamRef.current!);
          });
          
          viewerPc.onicecandidate = (event) => {
            if (event.candidate && socket && socket.connected) {
              socket.emit('screenshare:ice-candidate', {
                roomId,
                candidate: event.candidate,
              });
            }
          };
          
          viewerPc.onconnectionstatechange = () => {
            console.log(`Viewer ${data.userId} connection state:`, viewerPc!.connectionState);
            if (viewerPc!.connectionState === 'failed' || viewerPc!.connectionState === 'disconnected') {
              console.log(`Removing peer connection for viewer ${data.userId}`);
              viewerPc!.close();
              sharerPcsRef.current.delete(data.userId);
            }
          };
          
          sharerPcsRef.current.set(data.userId, viewerPc);
          console.log('Created new peer connection for viewer:', data.userId);
        }
        
        if (viewerPc) {
          await viewerPc.setRemoteDescription(new RTCSessionDescription(data.answer));
          console.log('Set remote description for viewer:', data.userId);
        }
      } catch (error: any) {
        console.error('Error handling answer:', error);
        if (error.message && !error.message.includes('already')) {
          toast({
            title: 'Screen share error',
            description: 'Failed to connect with viewer',
            variant: 'destructive',
          });
        }
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
  }, [socket, isConnected, isRoomJoined, isSharing, sharerId, handleReceiveOffer]);

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
      setIsSharing(true);
      
      // Wait for React to render video element, then set stream
      requestAnimationFrame(() => {
        if (localVideoRef.current && stream) {
          localVideoRef.current.srcObject = stream;
        }
      });

      stream.getVideoTracks()[0].onended = () => {
        console.log('Screen share track ended by user');
        handleStopShare();
      };

      // Create a single offer that will be used by all viewers
      // We'll create individual peer connections per viewer when they connect
      const offerPc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
      });
      
      stream.getTracks().forEach((track) => {
        offerPc.addTrack(track, stream);
      });

      const offer = await offerPc.createOffer({
        offerToReceiveVideo: false,
        offerToReceiveAudio: false,
      });
      await offerPc.setLocalDescription(offer);
      
      // Close offer PC after getting the offer - we'll create new ones per viewer
      offerPc.close();

      socket.emit('screenshare:start', {
        roomId,
        offer,
      });

      console.log('Screen share started, offer sent to room');
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

    // Close all viewer peer connections
    sharerPcsRef.current.forEach((pc, viewerId) => {
      pc.close();
      console.log('Closed peer connection for viewer:', viewerId);
    });
    sharerPcsRef.current.clear();

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }

    if (socket && socket.connected) {
      socket.emit('screenshare:stop', { roomId });
    }

    setIsSharing(false);
  };

  useEffect(() => {
    if (isSharing && localStreamRef.current && localVideoRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
    }
  }, [isSharing]);

  useEffect(() => {
    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
        localStreamRef.current = null;
      }
      sharerPcsRef.current.forEach((pc) => {
        pc.close();
      });
      sharerPcsRef.current.clear();
      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }
      if (socket && socket.connected && isSharing) {
        socket.emit('screenshare:stop', { roomId });
      }
    };
  }, [roomId, socket, isSharing]);

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
        <div className="space-y-2">
          {isSharing && (
            <>
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full rounded-lg border bg-black"
                style={{ maxHeight: '400px', minHeight: '300px', objectFit: 'contain' }}
              />
              <p className="text-sm text-muted-foreground">Sharing your screen - visible to all room members</p>
            </>
          )}
          {!isSharing && (
            <>
              {/* Always render remote video element to ensure ref exists */}
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                muted={false}
                className={isViewing ? 'w-full rounded-lg border bg-black' : 'hidden'}
                style={isViewing ? { maxHeight: '400px', minHeight: '300px', objectFit: 'contain' } : { display: 'none' }}
                onLoadedMetadata={() => {
                  console.log('Remote video metadata loaded');
                  if (remoteVideoRef.current && isViewing) {
                    remoteVideoRef.current.play().catch(console.error);
                  }
                }}
                onError={(e) => {
                  console.error('Remote video error:', e);
                }}
                onCanPlay={() => {
                  console.log('Remote video can play');
                }}
              />
              {isViewing ? (
                <p className="text-sm text-muted-foreground">Viewing shared screen from {sharerId ? 'another user' : 'someone'}</p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Share your screen with room members. Only one person can share at a time.
                </p>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
