import { useCallOptions } from '@/atoms/callOptions';
import { Call } from '@telnyx/webrtc';
import { useRive } from '@rive-app/react-canvas-lite';
import { Button } from './ui/button';
import { useLog } from '@/atoms/log';
import { useCallback, useEffect, useRef } from 'react';

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

  const handleAnswer = useCallback(() => {
    if (answerCalledRef.current) return;
    answerCalledRef.current = true;

    if (callOptions.audioStartupRepro?.enabled) {
      pushLog({
        id: 'audioStartupReproEnabled',
        description: `[Repro] SDK audioStartupRepro enabled for inbound answer: frequency=${callOptions.audioStartupRepro.frequencyHz}Hz gain=${callOptions.audioStartupRepro.gain} delayMs=${callOptions.audioStartupRepro.delayMs}. Tone source is created when SDK local media is ready; audible tone starts after delay.`,
      });
    }

    const answerParams = {
      customHeaders: callOptions.customHeaders,
      video: callOptions.video,
      ...(callOptions.audioStartupRepro?.enabled
        ? {
            audioStartupRepro: {
              enabled: true,
              frequencyHz: callOptions.audioStartupRepro.frequencyHz,
              gain: callOptions.audioStartupRepro.gain,
              delayMs: callOptions.audioStartupRepro.delayMs,
            },
          }
        : {}),
    };
    call.answer(answerParams);
  }, [call, callOptions, pushLog]);

  useEffect(() => {
    if (!callOptions.autoAnswerInbound) return;
    if (call.direction !== 'inbound') return;

    pushLog({
      id: 'autoAnswerInbound',
      description:
        '[Repro] Auto-answering inbound call from demo app with configured call options.',
    });
    handleAnswer();
  }, [call.direction, callOptions.autoAnswerInbound, handleAnswer, pushLog]);

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
