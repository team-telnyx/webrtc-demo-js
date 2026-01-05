import { useSipJsCallNotification } from '@/atoms/sipJsCall';
import { useSipJsCallStatus } from '@/atoms/telnyxClient';
import SipJsIncomingCall from './SipJsIncomingCall';
import SipJsActiveCall from './SipJsActiveCall';
import SipJsConnectingCall from './SipJsConnectingCall';

export const SipJsCall = () => {
  const [notification] = useSipJsCallNotification();
  const [callStatus] = useSipJsCallStatus();

  if (!notification.call) return null;

  switch (callStatus) {
    case 'incoming': {
      return <SipJsIncomingCall call={notification.call} />;
    }

    case 'dialing':
    case 'connecting': {
      return <SipJsConnectingCall call={notification.call} />;
    }

    case 'connected': {
      return <SipJsActiveCall call={notification.call} title="Active Call" />;
    }

    default: {
      return null;
    }
  }
};
