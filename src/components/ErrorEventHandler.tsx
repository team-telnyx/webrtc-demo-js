/**
 * ErrorEventHandler — WEBRTC-3248 test component
 *
 * Listens for the new `telnyx.error` event introduced in WEBRTC-3248 and
 * surfaces it in two ways:
 *   1. Pushes a log entry (visible in the call log panel)
 *   2. Sets a global error atom (consumed by ErrorBanner for in-your-face visibility)
 *
 * This component is intentionally verbose so it's easy to verify the new
 * error shape during manual testing.
 */
import { useLog } from '@/atoms/log';
import { useTelnyxSdkClient } from '@/atoms/telnyxClient';
import { atom, useAtom } from 'jotai';
import { useEffect } from 'react';

// --- Atom to hold the last telnyx.error payload ---
export type SdkErrorPayload = {
  code: number;
  name: string;
  description: string;
  explanation: string;
  causes: string[];
  solutions: string[];
  canRetry: boolean;
  callId?: string;
  sessionId?: string;
  receivedAt: string;
};

export const lastSdkErrorAtom = atom<SdkErrorPayload | null>(null);

// --- Handler component ---
const ErrorEventHandler = () => {
  const [client] = useTelnyxSdkClient();
  const { pushLog } = useLog();
  const [, setLastError] = useAtom(lastSdkErrorAtom);

  useEffect(() => {
    if (!client) return;

    const onError = (payload: {
      error?: {
        code?: number;
        name?: string;
        description?: string;
        explanation?: string;
        causes?: string[];
        solutions?: string[];
        canRetry?: boolean;
      };
      callId?: string;
      sessionId?: string;
    }) => {
      const error = payload?.error ?? payload;
      const code = error?.code;
      const name = error?.name ?? 'UnknownError';
      const description = error?.description ?? String(error);

      // Push to call log
      pushLog({
        id: `telnyx.error-${Date.now()}`,
        description: `⛔ telnyx.error [${code ?? '?'}] ${name}: ${description}`,
      });

      // Store structured payload for ErrorBanner display
      setLastError({
        code: code ?? 0,
        name,
        description,
        explanation: error?.explanation ?? '',
        causes: error?.causes ?? [],
        solutions: error?.solutions ?? [],
        canRetry: error?.canRetry ?? false,
        callId: payload?.callId,
        sessionId: payload?.sessionId,
        receivedAt: new Date().toISOString(),
      });
    };

    client.on('telnyx.error', onError);
    return () => {
      client.off('telnyx.error', onError);
    };
  }, [client, pushLog, setLastError]);

  return null;
};

export default ErrorEventHandler;
