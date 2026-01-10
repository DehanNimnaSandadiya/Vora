import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Phone, PhoneOff, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { useToast } from '@/hooks/useToast';

interface VideoCallProps {
  roomId: string;
}

declare global {
  interface Window {
    JitsiMeetExternalAPI: new (
      domain: string,
      options: {
        roomName: string;
        parentNode: HTMLElement;
        configOverwrite?: Record<string, any>;
        interfaceConfigOverwrite?: Record<string, any>;
      }
    ) => {
      dispose: () => void;
      addEventListener: (event: string, handler: Function) => void;
      removeEventListener: (event: string, handler: Function) => void;
    };
  }
}

export function VideoCall({ roomId }: VideoCallProps) {
  const [isInCall, setIsInCall] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const jitsiContainerRef = useRef<HTMLDivElement>(null);
  const jitsiApiRef = useRef<any>(null);
  const scriptLoadedRef = useRef(false);
  const { toast } = useToast();

  const loadJitsiScript = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (scriptLoadedRef.current || window.JitsiMeetExternalAPI) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://meet.jit.si/external_api.js';
      script.async = true;
      script.onload = () => {
        scriptLoadedRef.current = true;
        resolve();
      };
      script.onerror = () => {
        reject(new Error('Failed to load Jitsi Meet script'));
      };
      document.head.appendChild(script);
    });
  };

  const handleJoinCall = async () => {
    if (!roomId) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await api.get(`/rooms/${roomId}/call`);
      const { domain, roomName } = response.data;

      const jitsiDomain = import.meta.env.VITE_JITSI_DOMAIN || domain;

      await loadJitsiScript();

      // Ensure container exists before initializing
      if (!jitsiContainerRef.current) {
        throw new Error('Call container not found');
      }

      const container = jitsiContainerRef.current;
      container.innerHTML = '';
      
      // Show the container
      setIsInCall(true);
      
      // Small delay to ensure DOM is ready
      await new Promise(resolve => setTimeout(resolve, 50));

      const jitsiApi = new window.JitsiMeetExternalAPI(jitsiDomain, {
        roomName,
        parentNode: container,
        configOverwrite: {
          startWithAudioMuted: false,
          startWithVideoMuted: false,
          enableWelcomePage: false,
          enableClosePage: false,
        },
        interfaceConfigOverwrite: {
          TOOLBAR_BUTTONS: [
            'microphone',
            'camera',
            'closedcaptions',
            'desktop',
            'fullscreen',
            'fodeviceselection',
            'hangup',
            'profile',
            'chat',
            'recording',
            'livestreaming',
            'settings',
            'raisehand',
            'videoquality',
            'filmstrip',
            'invite',
            'feedback',
            'stats',
            'shortcuts',
            'tileview',
            'videobackgroundblur',
            'download',
            'help',
            'mute-everyone',
            'e2ee',
          ],
          SETTINGS_SECTIONS: ['devices', 'language', 'moderator', 'profile'],
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          SHOW_BRAND_WATERMARK: false,
          BRAND_WATERMARK_LINK: '',
          SHOW_POWERED_BY: false,
        },
      });

      // Store reference to current API instance for event handlers
      const currentApi = jitsiApi;
      
      const leaveHandler = () => {
        // Only handle if this is still the active API instance
        if (jitsiApiRef.current === currentApi) {
          handleLeaveCall();
        }
      };

      jitsiApi.addEventListener('readyToClose', leaveHandler);
      jitsiApi.addEventListener('videoConferenceLeft', leaveHandler);

      jitsiApiRef.current = jitsiApi;
      setIsLoading(false);
    } catch (err: any) {
      setIsInCall(false);
      setIsLoading(false);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to join call';
      setError(errorMessage);
      toast({
        title: 'Call error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const handleLeaveCall = () => {
    if (jitsiApiRef.current) {
      try {
        jitsiApiRef.current.dispose();
      } catch (err) {
        console.error('Error disposing Jitsi API:', err);
      }
      jitsiApiRef.current = null;
    }

    if (jitsiContainerRef.current) {
      jitsiContainerRef.current.innerHTML = '';
    }

    setIsInCall(false);
    setError(null);
  };

  // Track roomId to cleanup only when navigating to different room
  const prevRoomIdRef = useRef<string | undefined>(undefined);
  const mountedRef = useRef(true);

  // Cleanup call when roomId changes (user navigated to different room)
  useEffect(() => {
    if (prevRoomIdRef.current !== undefined && prevRoomIdRef.current !== roomId && jitsiApiRef.current) {
      handleLeaveCall();
    }
    prevRoomIdRef.current = roomId;
    mountedRef.current = true;
  }, [roomId]);

  // Cleanup only on component unmount (when navigating away from room page entirely, not on re-renders)
  useEffect(() => {
    return () => {
      // Only cleanup if component is actually unmounting (not just re-rendering)
      // Check if roomId is still the same (meaning this is a real unmount, not room change)
      if (mountedRef.current && prevRoomIdRef.current === roomId && jitsiApiRef.current) {
        handleLeaveCall();
      }
      mountedRef.current = false;
    };
  }, []); // Empty deps - only run on mount/unmount

  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Video Call
          </CardTitle>
          {!isInCall && (
            <Button
              onClick={handleJoinCall}
              disabled={isLoading}
              size="sm"
              className="rounded-2xl"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Joining...
                </>
              ) : (
                <>
                  <Phone className="h-4 w-4 mr-2" />
                  Join Call
                </>
              )}
            </Button>
          )}
          {isInCall && (
            <Button
              onClick={handleLeaveCall}
              variant="destructive"
              size="sm"
              className="rounded-2xl"
            >
              <PhoneOff className="h-4 w-4 mr-2" />
              Leave Call
            </Button>
          )}
        </div>
      </CardHeader>
      {error && (
        <CardContent>
          <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
            {error}
          </div>
        </CardContent>
      )}
      <CardContent>
        <div
          ref={jitsiContainerRef}
          className="w-full"
          style={{ 
            height: isInCall ? '600px' : '0px',
            minHeight: isInCall ? '600px' : '0px',
            display: isInCall ? 'block' : 'none'
          }}
        />
        {!isInCall && !error && (
          <p className="text-sm text-muted-foreground">
            Click "Join Call" to start a video call with room members.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
