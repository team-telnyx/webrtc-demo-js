import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Call from "@telnyx/webrtc/lib/src/Modules/Verto/webrtc/Call";
import AudioPlayer from "./AudioPlayer";
import AudioVisualizer from "./AudioVisualizer";
import { Button } from "./ui/button";
import { useCallback, useEffect, useRef } from "react";
import Keyboard from "./Keyboard";
import { playDTMFTone } from "@/lib/dtmf";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Props = {
  call: Call;
};

const VideoDisplay = ({ stream }: { stream: MediaStream }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  useEffect(() => {
    if (!stream) return;
    if (!videoRef.current) return;

    videoRef.current.srcObject = stream;
  }, [stream]);

  if (stream.getVideoTracks().length === 0) {
    return null;
  }
  return (
    <div className="w-[240px] h-[120px] rounded overflow-hidden border-white border-2">
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="w-full h-full object-cover"
      />
    </div>
  );
};

const ActiveCall = ({ call }: Props) => {
  const onDTMFClick = useCallback(
    ({ digit }: { digit: string }) => {
      call.dtmf(digit);
      playDTMFTone(digit);
    },
    [call]
  );

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) {
          call.hangup();
        }
      }}
    >
      <DialogContent className="overflow-hidden">
        <DialogHeader>
          <DialogTitle>Active Call</DialogTitle>
          <DialogDescription>
            Talking To {call.options.remoteCallerNumber} (
            {call.options.remoteCallerName})
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 max-h-[60vh] overflow-y-auto">
          <div className="flex flex-col space-y-4 items-center">
            <VideoDisplay stream={call.remoteStream} />
            <h1>Inbound </h1>
            <AudioVisualizer mediaStream={call.remoteStream} />

            <VideoDisplay stream={call.localStream} />
            <h1>Outbound</h1>
            <AudioVisualizer mediaStream={call.localStream} color="#fff" />
          </div>
          <AudioPlayer mediaStream={call.remoteStream} />
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
              Call metrics are not available yet.
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter>
          <Button
            data-testid="btn-end-call"
            size="lg"
            variant={"destructive"}
            className="w-full"
            onClick={() => call.hangup()}
          >
            Hangup
          </Button>

          <Button
            data-testid="btn-end-call"
            size="lg"
            variant={"outline"}
            className="w-full"
            onClick={() => call.hold()}
          >
            Hold
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ActiveCall;
