import { Call } from '@telnyx/webrtc';
import { RadioTower } from 'lucide-react';
import { Button } from './ui/button';

type Props = {
  call: Call;
};
const ConnectingCall = ({ call }: Props) => {
  return (
    <div className="container mx-auto my-4 flex items-center rounded border p-4">
      <RadioTower className="mr-4" />
      <div>
        <h1 className="font-medium">Call is connecting ... </h1>
        <p className="text-xs text-muted-foreground">
          Destination: {call.options.destinationNumber}
        </p>
        <p className="text-xs text-muted-foreground">
          Caller: {call.options.callerName}
        </p>
      </div>
      <Button
        onClick={() => call.hangup()}
        className="ml-auto"
        variant="outline"
      >
        Cancel
      </Button>
    </div>
  );
};

export default ConnectingCall;
