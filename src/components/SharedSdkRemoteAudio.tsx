import { useTelnyxCalls } from '@/atoms/telnyxNotification';
import { SDK_REMOTE_ELEMENT_ID } from '@/lib/sdkRemoteElement';
import { useEffect, useMemo, useState } from 'react';

const describeSrcObject = (srcObject: MediaProvider | null) => {
  if (!srcObject) {
    return 'none';
  }

  if (srcObject instanceof MediaStream) {
    return `MediaStream(${srcObject.id})`;
  }

  return srcObject.constructor?.name || 'unknown';
};

const SharedSdkRemoteAudio = () => {
  const [calls] = useTelnyxCalls();
  const [srcObject, setSrcObject] = useState<MediaProvider | null>(null);
  const activeCalls = useMemo(() => Object.values(calls), [calls]);

  useEffect(() => {
    const syncSrcObject = () => {
      const audio = document.getElementById(
        SDK_REMOTE_ELEMENT_ID,
      ) as HTMLAudioElement | null;
      setSrcObject(audio?.srcObject ?? null);
    };

    const timeout = window.setTimeout(syncSrcObject, 0);
    const interval = window.setInterval(syncSrcObject, 500);
    return () => {
      window.clearTimeout(timeout);
      window.clearInterval(interval);
    };
  }, [activeCalls.length]);

  const ownerCall = activeCalls.find((call) => call.remoteStream === srcObject);
  const hasActiveCalls = activeCalls.length > 0;

  return (
    <div
      className="rounded border bg-background p-4 shadow-sm"
      data-testid="sdk-shared-remote-audio-panel"
    >
      <div className="mb-3 space-y-1">
        <h2 className="text-sm font-semibold">SDK shared remoteElement</h2>
        <p className="text-xs text-muted-foreground">
          All SDK calls in this demo pass the same remoteElement id. The audio
          below is attached by @telnyx/webrtc, not by the app's per-call
          AudioPlayer component.
        </p>
        <p className="text-xs text-muted-foreground">
          Current srcObject owner:{' '}
          <span data-testid="sdk-remote-element-owner">
            {ownerCall?.id ?? (srcObject ? 'unknown/stale stream' : 'none')}
          </span>
        </p>
        <p className="text-xs text-muted-foreground">
          Current srcObject:{' '}
          <span data-testid="sdk-remote-element-src-object">
            {describeSrcObject(srcObject)}
          </span>
        </p>
      </div>
      <audio
        id={SDK_REMOTE_ELEMENT_ID}
        data-testid="sdk-shared-remote-audio"
        autoPlay
        controls
        className="w-full"
      />
      {hasActiveCalls && !ownerCall && srcObject && (
        <p className="mt-2 text-xs text-yellow-500">
          The shared remoteElement points at a stream that does not belong to
          any current call in app state.
        </p>
      )}
    </div>
  );
};

export default SharedSdkRemoteAudio;
