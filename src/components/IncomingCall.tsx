import { ICallOptions, useCallOptions } from '@/atoms/callOptions';
import { buildLocalStreamRepro } from '@/lib/localStreamRepro';
import {
  setActiveReproController,
  getActiveReproController,
} from '@/lib/activeReproController';
import { Call } from '@telnyx/webrtc';
import { useRive } from '@rive-app/react-canvas-lite';
import { Button } from './ui/button';

type Props = {
  call: Call;
};

const IncomingCall = ({ call }: Props) => {
  const { RiveComponent: Animation } = useRive({
    autoplay: true,
    src: '/incoming.riv',
  });
  const [callOptions] = useCallOptions();

  const handleAnswer = () => {
    // Clean up any previous controller
    const prevController = getActiveReproController();
    if (prevController) {
      prevController.cleanup();
      setActiveReproController(null);
    }

    // Build SDK call options — strip demo-only localStreamRepro
    const { localStreamRepro, ...sdkCallOpts } = callOptions;

    // Build localStream repro if enabled
    if (localStreamRepro?.enabled) {
      const controller = buildLocalStreamRepro(localStreamRepro);
      setActiveReproController(controller);

      // Inject the synthetic stream as SDK localStream
      (sdkCallOpts as ICallOptions).localStream = controller.stream;
    }

    call.answer(sdkCallOpts);
  };

  return (
    <div className="IncomingCallAlert container mx-auto my-4 border rounded p-4">
      <div className="flex items-center gap-2">
        <span className="inline-block w-14 h-14 rounded-full overflow-hidden">
          <Animation />
        </span>
        <div className="flex-1">
          <h1 className="font-medium">Incoming Call</h1>
          <p className="text-xs text-muted-foreground">
            {call.options.callerName} ({call.options.callerNumber})
          </p>
        </div>
        <Button
          data-testid="btn-answer-call"
          onClick={handleAnswer}
        >
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
