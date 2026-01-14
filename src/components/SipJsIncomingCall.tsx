import type { TelnyxCall } from '@telnyx/rtc-sipjs-simple-user/dist/types/lib/telnyx-call';
import { useRive } from '@rive-app/react-canvas-lite';
import { Button } from './ui/button';

type Props = {
  call: TelnyxCall;
};

const SipJsIncomingCall = ({ call }: Props) => {
  const { RiveComponent: Animation } = useRive({
    autoplay: true,
    src: '/incoming.riv',
  });

  return (
    <div className="IncomingCallAlert container mx-auto my-4 border rounded p-4">
      <div className="flex items-center gap-2">
        <span className="inline-block w-14 h-14 rounded-full overflow-hidden">
          <Animation />
        </span>
        <div className="flex-1">
          <h1 className="font-medium">Incoming Call</h1>
          <p className="text-xs text-muted-foreground">SIP.js Incoming Call</p>
        </div>
        <Button data-testid="btn-answer-call" onClick={() => call.accept()}>
          Answer
        </Button>
        <Button onClick={() => call.reject()} variant={'outline'}>
          Reject
        </Button>
      </div>
    </div>
  );
};

export default SipJsIncomingCall;
