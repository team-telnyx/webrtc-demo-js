import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Call } from "@telnyx/webrtc";
import AudioPlayer from "./AudioPlayer";
import AudioVisualizer from "./AudioVisualizer";
import { Button } from "./ui/button";
import { useCallback, useEffect, useRef } from "react";
import Keyboard from "./Keyboard";
import { playDTMFTone } from "@/lib/dtmf";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import InCallQualityMetrics from "./InCallQualityMetrics";

type Props = {
  call: Call;
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
            <h1>Inbound </h1>
            <AudioVisualizer mediaStream={call.remoteStream} />

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
              <InCallQualityMetrics />
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
