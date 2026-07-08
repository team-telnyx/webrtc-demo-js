import { ICallOptions, useCallOptions } from '@/atoms/callOptions';
import { useRemoteElements } from '@/atoms/remoteElements';
import { useLog } from '@/atoms/log';
import { useLoginMethod } from '@/atoms/loginMethod';
import { useConnectionStatus, useTelnyxSdkClient } from '@/atoms/telnyxClient';
import { useTelnyxCalls } from '@/atoms/telnyxNotification';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Phone } from 'lucide-react';
import { useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { DialButton, DialButtonData } from './DialButton';
import { Input } from './ui/input';
import { allocateRemoteElementId } from '@/lib/remoteElementAllocator';

const Dialer = () => {
  const [callOptions, setCallOptions] = useCallOptions();
  const [connectionStatus] = useConnectionStatus();
  const { pushLog } = useLog();
  const [calls] = useTelnyxCalls();
  const [loginMethod] = useLoginMethod();

  const [client] = useTelnyxSdkClient();
  const [, setRemoteElements] = useRemoteElements();
  const onDialButtonClick = useCallback(
    (data: DialButtonData) => {
      setCallOptions((prev: ICallOptions) => ({
        ...prev,
        destinationNumber: prev.destinationNumber + data.digit,
      }));
    },
    [setCallOptions],
  );

  const activeCallCount = Object.keys(calls).length;

  const onStartCall = () => {
    if (!client) {
      toast('Telnyx client not initialized');
      return;
    }
    if (connectionStatus !== 'registered') {
      toast('Telnyx is not registered yet');
      return;
    }

    if (loginMethod !== 'anonymous' && !callOptions.destinationNumber) {
      toast('Please enter a destination number');
      return;
    }

    pushLog({
      id: 'callingDestination',
      description: `Calling: ${callOptions.destinationNumber}`,
    });

    // Allocate a per-call remoteElement id (shared_1, shared_2, …) so this
    // call attaches its remote stream to its own <audio> element instead of
    // sharing one (VSUP-121 / PR #725). Register the call->element mapping so
    // PerCallRemoteAudio renders the matching <audio> for the SDK to attach to.
    const remoteElementId = allocateRemoteElementId();
    const call = client.newCall({
      ...callOptions,
      remoteElement: remoteElementId,
    });
    if (call) {
      setRemoteElements((prev) => ({ ...prev, [call.id]: remoteElementId }));
    }
  };

  const isDialButtonDisabled = useMemo(() => {
    if (connectionStatus !== 'registered') {
      return true;
    }
    return false;
  }, [connectionStatus]);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Dialer</CardTitle>
      </CardHeader>
      <CardContent>
        <Input
          disabled={loginMethod === 'anonymous'}
          data-testid="input-destination"
          onChange={(e) =>
            setCallOptions((prev: ICallOptions) => ({
              ...prev,
              destinationNumber: e.target.value,
            }))
          }
          value={callOptions.destinationNumber}
          placeholder="000-000-000"
          className="text-center font-semibold text-xl"
        />
        <div
          data-testid="dialpad"
          className="grid grid-cols-3 gap-4 mt-4 place-items-center"
        >
          <DialButton onClick={onDialButtonClick} digit="1" />
          <DialButton onClick={onDialButtonClick} digit="2" characters="ABC" />
          <DialButton onClick={onDialButtonClick} digit="3" characters="DEF" />
          <DialButton onClick={onDialButtonClick} digit="4" characters="GHI" />
          <DialButton onClick={onDialButtonClick} digit="5" characters="JKL" />
          <DialButton onClick={onDialButtonClick} digit="6" characters="MNO" />
          <DialButton onClick={onDialButtonClick} digit="7" characters="PQRS" />
          <DialButton onClick={onDialButtonClick} digit="8" characters="TUV" />
          <DialButton onClick={onDialButtonClick} digit="9" characters="WXYZ" />
          <DialButton onClick={onDialButtonClick} digit="*" />
          <DialButton onClick={onDialButtonClick} digit="0" />
          <DialButton onClick={onDialButtonClick} digit="#" />
          <DialButton className="hidden" digit="Backspace" />
          <DialButton className="hidden" digit="Call" />
        </div>
      </CardContent>
      <CardFooter className="flex-col justify-center gap-2">
        {activeCallCount > 0 && (
          <p className="text-xs text-muted-foreground">
            {activeCallCount} call{activeCallCount === 1 ? '' : 's'} in
            progress. Use each call card to hold, unhold, or hang up.
          </p>
        )}
        <DialButton
          data-testid="btn-call"
          disabled={isDialButtonDisabled}
          onClick={onStartCall}
          digit={<Phone />}
          className="bg-[#00E3AA] text-black hover:bg-[#00C99B] disabled:opacity-75 disabled:cursor-not-allowed w-10 h-10"
        ></DialButton>
      </CardFooter>
    </Card>
  );
};

export default Dialer;
