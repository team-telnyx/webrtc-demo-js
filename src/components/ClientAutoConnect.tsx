import { useMediaRecovery } from '@/atoms/mediaRecovery';
import {
  useConnectionStatus,
  useConnectedRegion,
  useDc,
  useTelnyxSdkClient,
} from '@/atoms/telnyxClient';
import {
  type ITelnyxErrorEvent,
  type ITelnyxWarningEvent,
  SwEvent,
  TELNYX_ERROR_CODES,
} from '@telnyx/webrtc';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

type SocketMessage = {
  result: {
    params: {
      state: string;
    };
  };
};

const DISCONNECT_ERROR_CODES = new Set<ITelnyxErrorEvent['error']['code']>([
  TELNYX_ERROR_CODES.NETWORK_OFFLINE,
  TELNYX_ERROR_CODES.GATEWAY_FAILED,
  TELNYX_ERROR_CODES.WEBSOCKET_CONNECTION_FAILED,
  TELNYX_ERROR_CODES.WEBSOCKET_ERROR,
  TELNYX_ERROR_CODES.RECONNECTION_EXHAUSTED,
]);

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
  const [mediaRecovery, setMediaRecovery] = useMediaRecovery();
  const mediaRecoveryRef = useRef(mediaRecovery);

  useEffect(() => {
    mediaRecoveryRef.current = mediaRecovery;
  }, [mediaRecovery, mediaRecoveryRef]);

  useEffect(() => {
    if (!client) {
      return;
    }

    const markDisconnected = () => {
      setStatus('disconnected');
      setDc(null);
      setConnectedRegion(null);
    };

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
      if (event.recoverable) {
        setMediaRecovery({
          callId: event.callId ?? '',
          error: event.error,
          retryDeadline: event.retryDeadline ?? 0,
          resume: event.resume,
          reject: event.reject,
        });
        return;
      }

      if (mediaRecoveryRef.current?.callId === event.callId) {
        setMediaRecovery(null);
      }

      if (DISCONNECT_ERROR_CODES.has(event.error.code)) {
        markDisconnected();
      }

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
      markDisconnected();
    };
    const onSocketError = () => {
      console.error('[Telnyx SDK] Socket error');
      markDisconnected();
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
      markDisconnected();
      toast.error('Failed to connect to Telnyx', {
        id: 'telnyx-connect-error',
        description: error instanceof Error ? error.message : String(error),
      });
    });

    return () => {
      markDisconnected();
      client.off(SwEvent.Ready, onReady);
      client.off(SwEvent.Error, onError);
      client.off(SwEvent.Warning, onWarning);
      client.off(SwEvent.SocketMessage, onSocketMessage);
      client.off(SwEvent.SocketOpen, onSocketOpen);
      client.off(SwEvent.SocketClose, onSocketClose);
      client.off(SwEvent.SocketError, onSocketError);
      client.disconnect();
    };
  }, [client, setStatus, setDc, setConnectedRegion, setMediaRecovery]);
  return null;
};

export default ClientAutoConnect;
