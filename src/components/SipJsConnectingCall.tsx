import type { TelnyxCall } from '@telnyx/rtc-sipjs-simple-user/dist/types/lib/telnyx-call';
import { RadioTower } from 'lucide-react';
import { Button } from './ui/button';

type Props = {
  call: TelnyxCall;
};

const SipJsConnectingCall = ({ call }: Props) => {
  return (
    <div className="container mx-auto my-4 flex items-center rounded border p-4">
      <RadioTower className="mr-4" />
      <div>
        <h1 className="font-medium">Call is connecting...</h1>
        <p className="text-xs text-muted-foreground">
          SIP.js {call.isIncoming() ? 'Incoming' : 'Outgoing'} Call
        </p>
      </div>
      <Button
        onClick={() => call.disconnect()}
        className="ml-auto"
        variant="outline"
      >
        Cancel
      </Button>
    </div>
  );
};

export default SipJsConnectingCall;
