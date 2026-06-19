import { useLog } from '@/atoms/log';
import { useTelnyxSdkClient } from '@/atoms/telnyxClient';
import {
  isTerminalCallState,
  useTelnyxCalls,
} from '@/atoms/telnyxNotification';
import { INotification, TelnyxRTC } from '@telnyx/webrtc';
import { useEffect } from 'react';

const CallNotificationHandler = () => {
  const [client] = useTelnyxSdkClient();
  const [, setCalls] = useTelnyxCalls();
  const { pushLog } = useLog();

  useEffect(() => {
    if (!client) return;

    const onNotification = (notification: INotification) => {
      if (notification.type !== 'callUpdate') return;
      if (!notification.call) return;

      const call = TelnyxRTC.telnyxStateCall(notification.call);
      notification.call = call;

      //  Log Call Status
      const status = call.state;
      const sipReason = call.sipReason;
      const sipCallId = call.sipCallId;
      const callLogPrefix = call.id ? `Call ${call.id}: ` : '';

      if (sipReason) {
        pushLog({
          id: 'sipCallId',
          description: `Sip CallId: ${sipCallId}`,
        });

        pushLog({
          id: `${call.id}-${status}`,
          description: `${callLogPrefix}Call State: ${status} ${`(${sipReason})`}`,
        });
      } else {
        pushLog({
          id: `${call.id}-${status}`,
          description: `${callLogPrefix}Call State: ${status}${
            call.cause ? ` (${call.cause})` : ''
          }`,
        });
      }

      setCalls((prevCalls) => {
        const nextCalls = { ...prevCalls };

        if (isTerminalCallState(call.state)) {
          delete nextCalls[call.id];
          return nextCalls;
        }

        nextCalls[call.id] = call;
        return nextCalls;
      });
    };

    client.on('telnyx.notification', onNotification);
    return () => {
      client.off('telnyx.notification', onNotification);
    };
  }, [client, pushLog, setCalls]);
  return null;
};

export default CallNotificationHandler;
