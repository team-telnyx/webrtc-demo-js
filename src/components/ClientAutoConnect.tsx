import {
  useConnectionStatus,
  useConnectedRegion,
  useDc,
  useTelnyxSdkClient,
} from '@/atoms/telnyxClient';
import {
  AUTHENTICATION_REQUIRED,
  GATEWAY_FAILED,
  INVALID_CREDENTIALS,
  LOGIN_FAILED,
  NETWORK_OFFLINE,
  RECONNECTION_EXHAUSTED,
  WEBSOCKET_CONNECTION_FAILED,
  WEBSOCKET_ERROR,
} from '@telnyx/webrtc';
import { useEffect } from 'react';

type SocketMessage = {
  result: {
    params: {
      state: string;
    };
  };
};

const ClientAutoConnect = () => {
  const [client] = useTelnyxSdkClient();
  const [, setStatus] = useConnectionStatus();
  const [, setDc] = useDc();
  const [, setConnectedRegion] = useConnectedRegion();

  useEffect(() => {
    if (!client) {
      return;
    }

    const onReady = () => {
      setStatus('registered');

      // @ts-expect-error `dc` is added in @telnyx/webrtc PR #583 but not yet in published types
      const dc: string | undefined = client.dc;
      if (dc) {
        setDc(dc);
      }

      // @ts-expect-error `region` is added in @telnyx/webrtc PR #583 but not yet in published types
      const region: string | undefined = client.region;
      if (region) {
        setConnectedRegion(region);
      }
    };
    const onSocketMessage = (message: SocketMessage) => {
      if (['REGISTER', 'REGED'].includes(message.result?.params.state)) {
        setStatus('registered');
      }
    };

    const onError = (event: { error: { code: number }; recoverable?: boolean }) => {
      if (event.recoverable) {
        return;
      }

      const disconnectCodes = [
        WEBSOCKET_CONNECTION_FAILED,
        WEBSOCKET_ERROR,
        RECONNECTION_EXHAUSTED,
        GATEWAY_FAILED,
        LOGIN_FAILED,
        INVALID_CREDENTIALS,
        AUTHENTICATION_REQUIRED,
        NETWORK_OFFLINE,
      ];

      if (disconnectCodes.includes(event.error.code)) {
        setStatus('disconnected');
      }
    };

    const onSocketOpen = () => {
      setStatus('registering');
    };

    const onSocketClose = () => {
      setStatus('disconnected');
      setDc(null);
      setConnectedRegion(null);
    };
    const onSocketError = () => {
      setStatus('disconnected');
    };

    setStatus('connecting');
    client.connect().then(() => {
      client.on('telnyx.ready', onReady);
      client.on('telnyx.error', onError);
      client.on('telnyx.socket.message', onSocketMessage);
      client.on('telnyx.socket.open', onSocketOpen);
      client.on('telnyx.socket.close', onSocketClose);
      client.on('telnyx.socket.error', onSocketError);
    });

    return () => {
      setStatus('disconnected');
      setDc(null);
      setConnectedRegion(null);
      client.disconnect();
      client.off('telnyx.ready', onReady);
      client.off('telnyx.error', onError);
      client.off('telnyx.socket.message', onSocketMessage);
      client.off('telnyx.socket.open', onSocketOpen);
      client.off('telnyx.socket.close', onSocketClose);
      client.off('telnyx.socket.error', onSocketError);
    };
  }, [client, setStatus, setDc, setConnectedRegion]);
  return null;
};

export default ClientAutoConnect;
