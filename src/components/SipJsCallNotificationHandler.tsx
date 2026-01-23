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
  const resetTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Helper function to log state transitions
  const logStateTransition = (
    event: string,
    from: string,
    to: string,
    data?: Record<string, unknown>,
  ) => {
    const logData = {
      event,
      from,
      to,
      timestamp: new Date().toISOString(),
      ...data,
    };
    console.log(`[State Transition] ${event}: ${from} → ${to}`, logData);
  };

  // Helper function to reset call state to idle
  const resetCallState = (reason: string) => {
    if (resetTimeoutRef.current) {
      clearTimeout(resetTimeoutRef.current);
    }
    resetTimeoutRef.current = setTimeout(() => {
      logStateTransition('Call State Reset', 'ended/failed', 'idle', { reason });
      setCallStatus('idle');
      setCallNotification({ call: null, direction: null });
      resetTimeoutRef.current = null;
    }, 100); // Small delay to ensure UI updates complete
  };

  useEffect(() => {
    if (!client) {
      setCallNotification({ call: null, direction: null });
      setCallStatus('idle');
      callCleanupRef.current?.();
      callCleanupRef.current = null;
      if (resetTimeoutRef.current) {
        clearTimeout(resetTimeoutRef.current);
        resetTimeoutRef.current = null;
      }
      return;
    }

    const attachCallListeners = (
      call: TelnyxCall,
      direction: 'inbound' | 'outbound',
    ) => {
      // Clean up previous call listeners
      callCleanupRef.current?.();
      if (resetTimeoutRef.current) {
        clearTimeout(resetTimeoutRef.current);
        resetTimeoutRef.current = null;
      }

      // Update notification with the new call
      const initialStatus = direction === 'inbound' ? 'incoming' : 'dialing';
      logStateTransition('Call Started', 'idle', initialStatus, {
        direction,
        callId: call.getSession()?.id || 'unknown',
      });
      setCallNotification({ call, direction });
      setCallStatus(initialStatus);

      // Set up call event listeners
      const handleConnecting = () => {
        logStateTransition('Call Connecting', initialStatus, 'connecting', {
          direction,
        });
        console.log('[SipJs Call] Connecting', { direction });
        setCallStatus('connecting');
      };

      const handleAccepted = () => {
        logStateTransition('Call Accepted', 'connecting', 'connected', {
          direction,
        });
        console.log('[SipJs Call] Accepted', { direction });
        setCallStatus('connected');
      };

      const handleTerminated = () => {
        const session = call.getSession();
        const endReason = session?.state || 'unknown';
        logStateTransition('Call Terminated', 'connected/connecting', 'ended', {
          direction,
          endReason,
          callId: session?.id || 'unknown',
        });
        console.log('[SipJs Call] Terminated', {
          direction,
          endReason,
          callId: session?.id,
        });
        setCallStatus('ended');
        setCallNotification({ call: null, direction: null });
        callCleanupRef.current = null;
        resetCallState('terminated');
      };

      const handleFailed = (error: Error) => {
        logStateTransition('Call Failed', 'connecting/dialing', 'failed', {
          direction,
          error: error.message,
          errorName: error.name,
        });
        console.error('[SipJs Call] Failed:', error, { direction });
        setCallStatus('failed');
        toast.error(`Call failed: ${error.message}`);
        setCallNotification({ call: null, direction: null });
        callCleanupRef.current = null;
        resetCallState(`failed: ${error.message}`);
      };

      const handleRejected = () => {
        logStateTransition('Call Rejected', 'incoming', 'ended', {
          direction,
        });
        console.log('[SipJs Call] Rejected', { direction });
        setCallStatus('ended');
        setCallNotification({ call: null, direction: null });
        callCleanupRef.current = null;
        resetCallState('rejected');
      };

      const handleMuted = () => {
        console.log('[SipJs Call] Muted', { direction });
      };

      const handleUnmuted = () => {
        console.log('[SipJs Call] Unmuted', { direction });
      };

      const handleHeld = () => {
        console.log('[SipJs Call] Held', { direction });
      };

      const handleResumed = () => {
        console.log('[SipJs Call] Resumed', { direction });
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
      logStateTransition('Incoming Call Received', 'idle', 'incoming', {
        callId: activeCall.getSession()?.id || 'unknown',
      });
      console.log('[SipJs Device] Incoming call', {
        callId: activeCall.getSession()?.id,
      });
      toast('Incoming call');
      attachCallListeners(activeCall, 'inbound');
    };

    // Attach device event listener for incoming calls
    client.on(DeviceEvent.IncomingInvite, handleIncomingInvite);

    // Expose handler for outgoing calls via atom
    const handleOutgoingCall = (call: TelnyxCall) => {
      logStateTransition('Outgoing Call Initiated', 'idle', 'dialing', {
        callId: call.getSession()?.id || 'unknown',
      });
      console.log('[SipJs Device] Outgoing call initiated', {
        callId: call.getSession()?.id,
      });
      attachCallListeners(call, 'outbound');
    };
    setOutgoingCallHandler(() => handleOutgoingCall);

    // Cleanup function
    return () => {
      client.off(DeviceEvent.IncomingInvite, handleIncomingInvite);
      callCleanupRef.current?.();
      if (resetTimeoutRef.current) {
        clearTimeout(resetTimeoutRef.current);
        resetTimeoutRef.current = null;
      }
      setOutgoingCallHandler(null);
    };
  }, [client, setCallNotification, setCallStatus, setOutgoingCallHandler]);

  return null;
};

export default SipJsCallNotificationHandler;
