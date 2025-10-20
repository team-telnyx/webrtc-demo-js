import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { playDTMFTone } from "@/lib/dtmf";
import { Call } from "@telnyx/webrtc";
import { useCallback } from "react";
import AudioPlayer from "./AudioPlayer";
import AudioVisualizer from "./AudioVisualizer";
import InCallQualityMetrics from "./InCallQualityMetrics";
import Keyboard from "./Keyboard";
import { Button } from "./ui/button";
import CheckRegistrationButton from "./CheckRegistrationButton";

type Props = {
  call: Call;
  title?: string;
};

const ActiveCall = ({ call, title = 'Active Call' }: Props) => {
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
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Talking To {call.options.remoteCallerNumber} (
            {call.options.remoteCallerName})
          </DialogDescription>
          <CheckRegistrationButton />
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
