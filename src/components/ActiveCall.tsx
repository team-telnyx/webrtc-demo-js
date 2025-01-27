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

type Props = {
  call: Call;
};

const ActiveCall = ({ call }: Props) => {
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) {
          call.hangup();
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Active Call</DialogTitle>
          <DialogDescription>
            Talking To {call.options.remoteCallerNumber} (
            {call.options.remoteCallerName})
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col space-y-4 items-center">
          <h1>Inbound audio levels</h1>
          <AudioVisualizer mediaStream={call.remoteStream} />

          <h1>Outbound audio levels</h1>
          <AudioVisualizer mediaStream={call.localStream} color="#fff" />
        </div>
        <AudioPlayer mediaStream={call.remoteStream} />

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
