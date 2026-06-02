import { useCallOptions } from '@/atoms/callOptions';
import { useLog } from '@/atoms/log';
import {
  buildLocalStreamRepro,
  LocalStreamReproController,
} from '@/lib/localStreamRepro';
import { Call } from '@telnyx/webrtc';
import { useRive } from '@rive-app/react-canvas-lite';
import { useCallback, useEffect, useRef } from 'react';
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
  const { pushLog } = useLog();
  const answerCalledRef = useRef(false);
  const reproControllerRef = useRef<LocalStreamReproController | null>(null);

  const handleAnswer = useCallback(async () => {
    if (answerCalledRef.current) return;
    answerCalledRef.current = true;

    let reproController: LocalStreamReproController | null = null;

    if (callOptions.localStreamRepro?.enabled) {
      reproController = buildLocalStreamRepro(callOptions.localStreamRepro);
      reproControllerRef.current = reproController;

      // Required to match the customer integration: answer() does not accept
      // localStream params, so their app mutates call.options before answer().
      // eslint-disable-next-line react-hooks/immutability
      call.options.localStream = reproController.stream;

      pushLog({
        id: 'localStreamReproEnabled',
        description: `[Repro] localStream AudioBufferSource enabled for inbound answer: source=${callOptions.localStreamRepro.source} frequency=${callOptions.localStreamRepro.frequencyHz}Hz amplitude=${callOptions.localStreamRepro.amplitude} startMode=${callOptions.localStreamRepro.startMode} delayMs=${callOptions.localStreamRepro.delayMs}`,
      });

      await reproController.prepare('after localStream assignment, before call.answer()');
    }

    const answerParams = {
      customHeaders: callOptions.customHeaders,
      video: callOptions.video,
    };
    void call.answer(answerParams);

    if (reproController) {
      void reproController.start('right after call.answer()');
    }
  }, [call, callOptions, pushLog]);

  useEffect(() => {
    if (!callOptions.autoAnswerInbound) return;
    if (call.direction !== 'inbound') return;

    pushLog({
      id: 'autoAnswerInbound',
      description:
        '[Repro] Auto-answering inbound call from demo app with configured localStream repro options.',
    });
    handleAnswer();
  }, [call.direction, callOptions.autoAnswerInbound, handleAnswer, pushLog]);

  useEffect(() => {
    return () => {
      reproControllerRef.current?.cleanup();
      reproControllerRef.current = null;
    };
  }, []);

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
        <Button data-testid="btn-answer-call" onClick={handleAnswer}>
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
