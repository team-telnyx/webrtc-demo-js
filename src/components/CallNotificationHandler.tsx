import { useLog } from '@/atoms/log';
import { useTelnyxSdkClient } from '@/atoms/telnyxClient';
import { useTelnyxNotification } from '@/atoms/telnyxNotification';
import { INotification, TelnyxRTC } from '@telnyx/webrtc';
import { useEffect } from 'react';
import { getActiveReproController } from '@/lib/activeReproController';

const CallNotificationHandler = () => {
  const [client] = useTelnyxSdkClient();
  const [, setNotification] = useTelnyxNotification();
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

      // --- LocalStream Repro: trigger audio on call.active ---
      if (status === 'active') {
        const controller = getActiveReproController();
        if (controller) {
          pushLog({
            id: 'reproCallActive',
            description: `[Repro] call.active — triggering onCallActive()`,
          });
          controller.onCallActive();
        }
      }

      // --- LocalStream Repro: cleanup on call end ---
      if (
        status === 'done' ||
        status === 'hangup' ||
        status === 'destroy' ||
        status === 'fail'
      ) {
        const controller = getActiveReproController();
        if (controller) {
          pushLog({
            id: 'reproCallEnd',
            description: `[Repro] call ended (${status}) — stopping + cleanup`,
          });
          controller.stop(`call.${status}`);
          controller.cleanup();
        }
      }

      setNotification(notification);
    };

    client.on('telnyx.notification', onNotification);
    return () => {
      client.off('telnyx.notification', onNotification);
    };
  }, [client, pushLog, setNotification]);
  return null;
};

export default CallNotificationHandler;
