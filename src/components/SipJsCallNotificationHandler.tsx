import { useEffect, useRef } from 'react';
import { useSipJsClient, useSipJsCallStatus } from '@/atoms/telnyxClient';
import {
  useSipJsCallNotification,
  useOutgoingCallHandler,
} from '@/atoms/sipJsCall';
import { DeviceEvent, CallEvent } from '@telnyx/rtc-sipjs-simple-user';
import type { TelnyxCall } from '@telnyx/rtc-sipjs-simple-user/dist/types/lib/telnyx-call';
import { toast } from 'sonner';

const SipJsCallNotificationHandler = () => {
  const [client] = useSipJsClient();
  const [, setCallNotification] = useSipJsCallNotification();
  const [, setCallStatus] = useSipJsCallStatus();
  const [, setOutgoingCallHandler] = useOutgoingCallHandler();
  const callCleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!client) {
      setCallNotification({ call: null, direction: null });
      setCallStatus('idle');
      callCleanupRef.current?.();
      callCleanupRef.current = null;
      return;
    }

    const attachCallListeners = (
      call: TelnyxCall,
      direction: 'inbound' | 'outbound',
    ) => {
      // Clean up previous call listeners
      callCleanupRef.current?.();

      // Update notification with the new call
      setCallNotification({ call, direction });
      setCallStatus(direction === 'inbound' ? 'incoming' : 'dialing');

      // Set up call event listeners
      const handleConnecting = () => {
        console.log('[SipJs Call] Connecting');
        setCallStatus('connecting');
      };

      const handleAccepted = () => {
        console.log('[SipJs Call] Accepted');
        setCallStatus('connected');
      };

      const handleTerminated = () => {
        console.log('[SipJs Call] Terminated');
        setCallStatus('ended');
        setCallNotification({ call: null, direction: null });
        callCleanupRef.current = null;
      };

      const handleFailed = (error: Error) => {
        console.error('[SipJs Call] Failed:', error);
        setCallStatus('failed');
        toast.error(`Call failed: ${error.message}`);
        setCallNotification({ call: null, direction: null });
        callCleanupRef.current = null;
      };

      const handleRejected = () => {
        console.log('[SipJs Call] Rejected');
        setCallStatus('ended');
        setCallNotification({ call: null, direction: null });
        callCleanupRef.current = null;
      };

      const handleMuted = () => {
        console.log('[SipJs Call] Muted');
      };

      const handleUnmuted = () => {
        console.log('[SipJs Call] Unmuted');
      };

      const handleHeld = () => {
        console.log('[SipJs Call] Held');
      };

      const handleResumed = () => {
        console.log('[SipJs Call] Resumed');
      };

      // Attach call event listeners
      call.on(CallEvent.Connecting, handleConnecting);
      call.on(CallEvent.Accepted, handleAccepted);
      call.on(CallEvent.Terminated, handleTerminated);
      call.on(CallEvent.Failed, handleFailed);
      call.on(CallEvent.Rejected, handleRejected);
      call.on(CallEvent.Muted, handleMuted);
      call.on(CallEvent.Unmuted, handleUnmuted);
      call.on(CallEvent.Held, handleHeld);
      call.on(CallEvent.Resumed, handleResumed);

      // Store cleanup function
      callCleanupRef.current = () => {
        call.off(CallEvent.Connecting, handleConnecting);
        call.off(CallEvent.Accepted, handleAccepted);
        call.off(CallEvent.Terminated, handleTerminated);
        call.off(CallEvent.Failed, handleFailed);
        call.off(CallEvent.Rejected, handleRejected);
        call.off(CallEvent.Muted, handleMuted);
        call.off(CallEvent.Unmuted, handleUnmuted);
        call.off(CallEvent.Held, handleHeld);
        call.off(CallEvent.Resumed, handleResumed);
      };
    };

    const handleIncomingInvite = ({
      activeCall,
    }: {
      activeCall: TelnyxCall;
    }) => {
      console.log('[SipJs Device] Incoming call');
      toast('Incoming call');
      attachCallListeners(activeCall, 'inbound');
    };

    // Attach device event listener for incoming calls
    client.on(DeviceEvent.IncomingInvite, handleIncomingInvite);

    // Expose handler for outgoing calls via atom
    const handleOutgoingCall = (call: TelnyxCall) => {
      attachCallListeners(call, 'outbound');
    };
    setOutgoingCallHandler(() => handleOutgoingCall);

    // Cleanup function
    return () => {
      client.off(DeviceEvent.IncomingInvite, handleIncomingInvite);
      callCleanupRef.current?.();
      setOutgoingCallHandler(null);
    };
  }, [client, setCallNotification, setCallStatus, setOutgoingCallHandler]);

  return null;
};

export default SipJsCallNotificationHandler;
