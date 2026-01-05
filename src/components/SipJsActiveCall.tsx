import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { playDTMFTone } from '@/lib/dtmf';
import type { TelnyxCall } from '@telnyx/rtc-sipjs-simple-user/dist/types/lib/telnyx-call';
import { useCallback, useEffect, useState } from 'react';
import Keyboard from './Keyboard';
import { Button } from './ui/button';
import AudioPlayer from './AudioPlayer';
import AudioVisualizer from './AudioVisualizer';
import SipJsCallQualityMetrics from './SipJsCallQualityMetrics';

type Props = {
  call: TelnyxCall;
  title?: string;
};

const SipJsActiveCall = ({ call, title = 'Active Call' }: Props) => {
  const [remoteStream, setRemoteStream] = useState<MediaStream | undefined>();
  const [localStream, setLocalStream] = useState<MediaStream | undefined>();

  useEffect(() => {
    // Access the underlying SimpleUser to get media streams
    const simpleUser = call.simpleUser;
    if (!simpleUser) return;

    // Set initial streams
    setRemoteStream(simpleUser.remoteMediaStream);
    setLocalStream(simpleUser.localMediaStream);

    // Poll for stream updates (SimpleUser doesn't emit events for stream changes)
    const interval = setInterval(() => {
      setRemoteStream(simpleUser.remoteMediaStream);
      setLocalStream(simpleUser.localMediaStream);
    }, 500);

    return () => clearInterval(interval);
  }, [call]);

  const onDTMFClick = useCallback(
    async ({ digit }: { digit: string }) => {
      await call.sendDigits(digit);
      playDTMFTone(digit);
    },
    [call],
  );

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) {
          call.disconnect();
        }
      }}
    >
      <DialogContent className="overflow-hidden">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            SIP.js Call {call.isIncoming() ? '(Incoming)' : '(Outgoing)'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 max-h-[60vh] overflow-y-auto">
          <div className="flex flex-col space-y-4 items-center">
            <h1>Inbound</h1>
            {remoteStream && <AudioVisualizer mediaStream={remoteStream} />}

            <h1>Outbound</h1>
            {localStream && (
              <AudioVisualizer mediaStream={localStream} color="#fff" />
            )}
          </div>
          {remoteStream && <AudioPlayer mediaStream={remoteStream} />}
          <Tabs defaultValue="keyboard">
            <div className="flex justify-center">
              <TabsList>
                <TabsTrigger value="keyboard">Keyboard</TabsTrigger>
                <TabsTrigger value="metrics">Metrics</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="keyboard">
              <Keyboard onDialButtonClick={onDTMFClick} />
            </TabsContent>

            <TabsContent value="metrics">
              <SipJsCallQualityMetrics call={call} />
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter>
          <Button
            data-testid="btn-mute-call"
            size="lg"
            variant={call.isMuted() ? 'default' : 'outline'}
            className="w-full"
            onClick={() => call.toggleMute(!call.isMuted())}
          >
            {call.isMuted() ? 'Unmute' : 'Mute'}
          </Button>

          <Button
            data-testid="btn-end-call"
            size="lg"
            variant={'destructive'}
            className="w-full"
            onClick={() => call.disconnect()}
          >
            Hangup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SipJsActiveCall;
