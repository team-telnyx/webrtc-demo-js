import {
  useConnectionStatus,
  useSource,
  useTelnyxSdkClient,
} from '@/atoms/telnyxClient';
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
  const [, setSource] = useSource();

  useEffect(() => {
    if (!client) {
      return;
    }

    const onReady = () => {
      setStatus('registered');

      // @ts-expect-error `source` is added in @telnyx/webrtc PR #583 but not yet in published types
      const source: string | undefined = client.source;
      if (source) {
        setSource(source);
      }
    };
    const onSocketMessage = (message: SocketMessage) => {
      if (['REGISTER', 'REGED'].includes(message.result?.params.state)) {
        setStatus('registered');
      }
    };

    const onError = () => {
      setStatus('disconnected');
    };

    const onSocketOpen = () => {
      setStatus('registering');
    };

    const onSocketClose = () => {
      setStatus('disconnected');
      setSource(null);
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
      setSource(null);
      client.disconnect();
      client.off('telnyx.ready', onReady);
      client.off('telnyx.error', onError);
      client.off('telnyx.socket.message', onSocketMessage);
      client.off('telnyx.socket.open', onSocketOpen);
      client.off('telnyx.socket.close', onSocketClose);
      client.off('telnyx.socket.error', onSocketError);
    };
  }, [client, setStatus, setSource]);
  return null;
};

export default ClientAutoConnect;
