import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Call } from '@telnyx/webrtc';
import { Button } from './ui/button';

type Props = {
  call: Call;
};
const HeldCall = ({ call }: Props) => {
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
          <DialogTitle>The Call is held</DialogTitle>
          <DialogDescription>
            Resume call to {call.options.remoteCallerNumber} (
            {call.options.remoteCallerName})
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button
            data-testid="btn-end-call"
            size="lg"
            variant={'outline'}
            className="w-full"
            onClick={() => call.unhold()}
          >
            Unhold
          </Button>

          <Button
            data-testid="btn-end-call"
            size="lg"
            variant={'destructive'}
            className="w-full"
            onClick={() => call.hangup()}
          >
            Hangup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default HeldCall;
