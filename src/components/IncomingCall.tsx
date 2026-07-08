import { Call } from '@telnyx/webrtc';
import { useRive } from '@rive-app/react-canvas-lite';
import { Button } from './ui/button';
import { useCallOptions } from '@/atoms/callOptions';
import { useRemoteElements } from '@/atoms/remoteElements';
import { allocateRemoteElementId } from '@/lib/remoteElementAllocator';
type Props = {
  call: Call;
};

const IncomingCall = ({ call }: Props) => {
  const { RiveComponent: Animation } = useRive({
    autoplay: true,
    src: '/incoming.riv',
  });
  const [callOptions] = useCallOptions();
  const [, setRemoteElements] = useRemoteElements();

  const answerCall = () => {
    // Allocate a per-call remoteElement id (shared_1, shared_2, …) and pass it
    // at answer time (VSUP-121 / PR #725: AnswerParams now accepts
    // remoteElement). The SDK attaches this call's remote stream to its own
    // <audio> element rendered by PerCallRemoteAudio, so concurrent calls no
    // longer conflict on one shared element. Register the call->element
    // mapping before answering so the element is rendered before the SDK
    // attaches. Requires @telnyx/webrtc >= 2.27.4.
    const remoteElementId = allocateRemoteElementId();
    setRemoteElements((prev) => ({ ...prev, [call.id]: remoteElementId }));
    call.answer({
      customHeaders: callOptions.customHeaders,
      remoteElement: remoteElementId,
    });
  };

  return (
    <div
      className="IncomingCallAlert container mx-auto my-4 border rounded p-4"
      data-testid="incoming-call"
      data-call-id={call.id}
    >
      <div className="flex items-center gap-2">
        <span className="inline-block w-14 h-14 rounded-full overflow-hidden">
          <Animation />
        </span>
        <div className="flex-1">
          <h1 className="font-medium">Incoming Call</h1>
          <p className="text-xs text-muted-foreground">
            {call.options.callerName} ({call.options.callerNumber})
          </p>
          <p className="text-xs text-muted-foreground">Call ID: {call.id}</p>
        </div>
        <Button data-testid="btn-answer-call" onClick={answerCall}>
          Answer
        </Button>
        <Button onClick={() => call.hangup()} variant={'outline'}>
          Reject
        </Button>
      </div>
    </div>
  );
};

export default IncomingCall;
