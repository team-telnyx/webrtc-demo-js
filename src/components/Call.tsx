import { useTelnyxCalls } from '@/atoms/telnyxNotification';
import ActiveCall from './ActiveCall';
import ConnectingCall from './ConnectingCall';
import HeldCall from './HeldCall';
import IncomingCall from './IncomingCall';
import { capitalizeFirstLetter } from '@/lib/string';
import { Call as TelnyxCall } from '@telnyx/webrtc';

const ACTIVE_CALL_STATES = new Set(['new', 'connecting', 'active']);
const CONNECTING_CALL_STATES = new Set(['connecting', 'trying']);
const INCOMING_CALL_STATES = new Set(['ringing', 'requesting']);

type CallStateRendererProps = {
  call: TelnyxCall;
};

const CallStateRenderer = ({ call }: CallStateRendererProps) => {
  if (call.options.keepConnectionAliveOnSocketClose) {
    if (['trying', 'requesting'].includes(call.state)) {
      return <IncomingCall call={call} />;
    }

    if (call.state === 'ringing') {
      if (call.direction === 'inbound') {
        return <IncomingCall call={call} />;
      }

      return (
        <ActiveCall
          call={call}
          title={`${capitalizeFirstLetter(call.state)} Call`}
        />
      );
    }

    if (ACTIVE_CALL_STATES.has(call.state)) {
      return (
        <ActiveCall
          call={call}
          title={`${capitalizeFirstLetter(call.state)} Call`}
        />
      );
    }

    if (call.state === 'held') {
      return <HeldCall call={call} />;
    }

    return null;
  }

  if (CONNECTING_CALL_STATES.has(call.state)) {
    return <ConnectingCall call={call} />;
  }

  if (INCOMING_CALL_STATES.has(call.state)) {
    return <IncomingCall call={call} />;
  }

  if (call.state === 'active') {
    return <ActiveCall call={call} />;
  }

  if (call.state === 'held') {
    return <HeldCall call={call} />;
  }

  return null;
};

export const Call = () => {
  const [calls] = useTelnyxCalls();
  const activeCalls = Object.values(calls);

  if (!activeCalls.length) return null;

  return (
    <div className="container mx-auto my-4 space-y-4" data-testid="call-list">
      {activeCalls.map((call) => (
        <CallStateRenderer key={call.id} call={call} />
      ))}
    </div>
  );
};
