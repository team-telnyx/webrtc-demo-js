import { useLog } from '@/atoms/log';
import { useTelnyxSdkClient } from '@/atoms/telnyxClient';
import { useTelnyxNotification } from '@/atoms/telnyxNotification';
import { INotification, TelnyxRTC } from '@telnyx/webrtc';
import { useEffect, useRef } from 'react';

const CallNotificationHandler = () => {
  const [client] = useTelnyxSdkClient();
  const [_notification, setNotification] = useTelnyxNotification();
  const { pushLog } = useLog();

  const activeNotificationRef = useRef(_notification);
  activeNotificationRef.current = _notification;

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
