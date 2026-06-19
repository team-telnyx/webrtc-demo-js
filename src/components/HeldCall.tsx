import { Call } from '@telnyx/webrtc';
import { Button } from './ui/button';

type Props = {
  call: Call;
};
const HeldCall = ({ call }: Props) => {
  return (
    <div
      className="container mx-auto my-4 rounded border bg-background p-4 shadow-sm"
      data-testid="held-call"
      data-call-id={call.id}
    >
      <div className="mb-4">
        <h2 className="text-lg font-semibold">The Call is held</h2>
        <p className="text-sm text-muted-foreground">
          Resume call to {call.options.remoteCallerNumber} (
          {call.options.remoteCallerName})
        </p>
        <p className="text-xs text-muted-foreground">Call ID: {call.id}</p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
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
          data-testid="btn-hold-call"
          size="lg"
          variant={'destructive'}
          className="w-full"
          onClick={() => call.hangup()}
        >
          Hangup
        </Button>
      </div>
    </div>
  );
};

export default HeldCall;
