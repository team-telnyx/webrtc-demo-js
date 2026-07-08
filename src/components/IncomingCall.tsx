import { Call } from '@telnyx/webrtc';
import { useRive } from '@rive-app/react-canvas-lite';
import { Button } from './ui/button';
import { useCallOptions } from '@/atoms/callOptions';
import { SDK_REMOTE_ELEMENT_ID } from '@/lib/sdkRemoteElement';
type Props = {
  call: Call;
};

const IncomingCall = ({ call }: Props) => {
  const { RiveComponent: Animation } = useRive({
    autoplay: true,
    src: '/incoming.riv',
  });
  const [callOptions] = useCallOptions();

  const answerCall = () => {
    // Pass the shared remoteElement explicitly at answer time (VSUP-121 / PR
    // #725: AnswerParams now accepts remoteElement). The SDK attaches the
    // remote stream to the shared <audio id=SDK_REMOTE_ELEMENT_ID> rendered by
    // SharedSdkRemoteAudio, so last-writer-wins behavior across concurrent
    // calls stays observable. Requires @telnyx/webrtc >= 2.27.4.
    call.answer({
      customHeaders: callOptions.customHeaders,
      remoteElement: SDK_REMOTE_ELEMENT_ID,
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
