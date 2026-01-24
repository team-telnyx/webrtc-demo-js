import { useSipJsCallNotification } from '@/atoms/sipJsCall';
import { useSipJsCallStatus } from '@/atoms/telnyxClient';
import SipJsIncomingCall from './SipJsIncomingCall';
import SipJsActiveCall from './SipJsActiveCall';
import SipJsConnectingCall from './SipJsConnectingCall';

export const SipJsCall = () => {
  const [notification] = useSipJsCallNotification();
  const [callStatus] = useSipJsCallStatus();

  if (!notification.call) return null;

  // #region agent log
  if (callStatus === 'incoming') {
    const callId = notification.call.getSession()?.id || 'unknown';
    fetch('http://127.0.0.1:7242/ingest/0eb777cd-909c-48ac-a097-c7ac60af0eb2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'SipJsCall.tsx:RENDER_INCOMING',message:'Rendering incoming call UI',data:{callId,direction:notification.direction},timestamp:Date.now(),sessionId:'debug-session',runId:'inbound-test',hypothesisId:'INBOUND-5'})}).catch(()=>{});
  }
  // #endregion

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
