import { useLog } from '@/atoms/log';
import { useMediaRecovery } from '@/atoms/mediaRecovery';
import { useTelnyxSdkClient } from '@/atoms/telnyxClient';
import { useTelnyxNotification } from '@/atoms/telnyxNotification';
import { INotification, ITelnyxError, TelnyxRTC } from '@telnyx/webrtc';
import { useEffect } from 'react';
import { toast } from 'sonner';

const CallNotificationHandler = () => {
  const [client] = useTelnyxSdkClient();
  const [, setNotification] = useTelnyxNotification();
  const [mediaRecovery, setMediaRecovery] = useMediaRecovery();
  const { pushLog } = useLog();

  useEffect(() => {
    if (!client) return;

    const onNotification = (notification: INotification) => {
      if (notification.type !== 'callUpdate') return;
      if (!notification.call) return;

      notification.call = TelnyxRTC.telnyxStateCall(notification.call);
      //  Log Call Status
      const status = notification.call.state;
      const sipReason = notification.call.sipReason;
      const sipCallId = notification.call.sipCallId;

      if (sipReason) {
        pushLog({
          id: 'sipCallId',
          description: `Sip CallId: ${sipCallId}`,
        });

        pushLog({
          id: status,
          description: `Call State: ${status} ${`(${sipReason})`}`,
        });
      } else {
        pushLog({
          id: notification.call.state,
          description: `Call State: ${notification.call.state}${
            notification.call.cause ? ` (${notification.call.cause})` : ''
          }`,
        });
      }

      if (
        mediaRecovery?.callId === notification.call.id &&
        ['active', 'held', 'hangup', 'destroy', 'purge'].includes(
          notification.call.state,
        )
      ) {
        setMediaRecovery(null);
      }

      setNotification(notification);
    };

    const onError = (event: {
      error: ITelnyxError;
      callId?: string;
      sessionId?: string;
      recoverable?: boolean;
      retryDeadline?: number;
      resume?: () => void;
      reject?: () => void;
    }) => {
      if (event.recoverable) {
        const callId = event.callId ?? '';
        pushLog({
          id: `mediaRecovery-${callId}`,
          description: `Media recovery requested: ${event.error.message}`,
        });
        setMediaRecovery({
          callId,
          error: event.error,
          retryDeadline: event.retryDeadline ?? 0,
          resume: event.resume ?? (() => {}),
          reject: event.reject ?? (() => {}),
          status: 'waiting',
        });
        return;
      }

      pushLog({
        id: `sdkError-${event.error.code}`,
        description: `SDK Error: ${event.error.message}`,
      });

      if (mediaRecovery?.callId === event.callId) {
        setMediaRecovery(null);
        toast.error(event.error.message);
      }
    };

    client.on('telnyx.notification', onNotification);
    client.on('telnyx.error', onError);
    return () => {
      client.off('telnyx.notification', onNotification);
      client.off('telnyx.error', onError);
    };
  }, [client, mediaRecovery, pushLog, setMediaRecovery, setNotification]);
  return null;
};

export default CallNotificationHandler;
