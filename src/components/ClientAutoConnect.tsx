import {
  useConnectionStatus,
  useConnectedRegion,
  useDc,
  useTelnyxSdkClient,
} from '@/atoms/telnyxClient';
import {
  ITelnyxErrorEvent,
  ITelnyxWarningEvent,
  SwEvent,
} from '@telnyx/webrtc';
import { useEffect } from 'react';
import { toast } from 'sonner';

type SocketMessage = {
  result: {
    params: {
      state: string;
    };
  };
};

const getEventContext = (sessionId: string, callId?: string) =>
  callId ? `Call: ${callId}` : `Session: ${sessionId}`;

const getErrorDescription = (event: ITelnyxErrorEvent) => {
  const details = [
    event.error.description,
    `Code: ${event.error.code}`,
    getEventContext(event.sessionId, event.callId),
    event.recoverable ? 'The SDK may recover automatically.' : undefined,
  ];

  return details.filter(Boolean).join(' ');
};

const getWarningDescription = (event: ITelnyxWarningEvent) => {
  const details = [
    event.warning.description,
    `Code: ${event.warning.code}`,
    getEventContext(event.sessionId, event.callId),
  ];

  return details.filter(Boolean).join(' ');
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

    const onError = (event: ITelnyxErrorEvent) => {
      console.error('[Telnyx SDK] Error:', event.error);
      setStatus('disconnected');
      toast.error(event.error.message, {
        id: `telnyx-error-${event.error.code}-${event.callId ?? event.sessionId}`,
        description: getErrorDescription(event),
      });
    };

    const onWarning = (event: ITelnyxWarningEvent) => {
      console.warn('[Telnyx SDK] Warning:', event.warning);
      toast.warning(event.warning.message, {
        id: `telnyx-warning-${event.warning.code}-${event.callId ?? event.sessionId}`,
        description: getWarningDescription(event),
      });
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
      console.error('[Telnyx SDK] Socket error');
      setStatus('disconnected');
      toast.error('WebSocket connection error', {
        id: 'telnyx-socket-error',
        description:
          'The Telnyx client connection failed. Check your network and credentials, then reconnect.',
      });
    };

    client.on(SwEvent.Ready, onReady);
    client.on(SwEvent.Error, onError);
    client.on(SwEvent.Warning, onWarning);
    client.on(SwEvent.SocketMessage, onSocketMessage);
    client.on(SwEvent.SocketOpen, onSocketOpen);
    client.on(SwEvent.SocketClose, onSocketClose);
    client.on(SwEvent.SocketError, onSocketError);

    setStatus('connecting');
    client.connect().catch((error: unknown) => {
      console.error('[Telnyx SDK] Failed to connect:', error);
      setStatus('disconnected');
      toast.error('Failed to connect to Telnyx', {
        id: 'telnyx-connect-error',
        description: error instanceof Error ? error.message : String(error),
      });
    });

    return () => {
      setStatus('disconnected');
      setDc(null);
      setConnectedRegion(null);
      client.on(SwEvent.Ready, onReady);
      client.on(SwEvent.Error, onError);
      client.on(SwEvent.Warning, onWarning);
      client.on(SwEvent.SocketMessage, onSocketMessage);
      client.on(SwEvent.SocketOpen, onSocketOpen);
      client.on(SwEvent.SocketClose, onSocketClose);
      client.on(SwEvent.SocketError, onSocketError);
      client.disconnect();
    };
  }, [client, setStatus, setDc, setConnectedRegion]);
  return null;
};

export default ClientAutoConnect;
