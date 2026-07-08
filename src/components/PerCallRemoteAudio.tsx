import { useTelnyxCalls } from '@/atoms/telnyxNotification';
import { useRemoteElements } from '@/atoms/remoteElements';
import { useEffect, useState } from 'react';
import AudioPlayer from './AudioPlayer';

const describeSrcObject = (srcObject: MediaProvider | null) => {
  if (!srcObject) {
    return 'none';
  }

  if (srcObject instanceof MediaStream) {
    return `MediaStream(${srcObject.id})`;
  }

  return srcObject.constructor?.name || 'unknown';
};

/**
 * Renders one <audio> per active call, each with its own per-call
 * remoteElement id (shared_1, shared_2, …) allocated when the call was
 * created/answered. The SDK attaches each call's remote stream to its own
 * element via remoteElement (VSUP-121 / PR #725), so concurrent calls no
 * longer conflict on one shared element. Also shows which call owns each
 * element's srcObject to make wrong/stale stream ownership visible.
 */
const PerCallRemoteAudio = () => {
  const [calls] = useTelnyxCalls();
  const [remoteElements, setRemoteElements] = useRemoteElements();
  const activeCalls = Object.values(calls);

  // Prune mapping entries for calls that no longer exist so the atom does not
  // grow unbounded and stale <audio> elements unmount.
  useEffect(() => {
    const activeIds = new Set(activeCalls.map((c) => c.id));
    setRemoteElements((prev) => {
      const stale = Object.keys(prev).filter((id) => !activeIds.has(id));
      if (stale.length === 0) return prev;
      const next = { ...prev };
      for (const id of stale) delete next[id];
      return next;
    });
  }, [activeCalls, setRemoteElements]);

  const [srcObjects, setSrcObjects] = useState<
    Record<string, MediaProvider | null>
  >({});

  useEffect(() => {
    const syncSrcObjects = () => {
      const next: Record<string, MediaProvider | null> = {};
      for (const call of activeCalls) {
        const elId = remoteElements[call.id];
        if (!elId) continue;
        const el = document.getElementById(elId) as HTMLAudioElement | null;
        next[call.id] = el?.srcObject ?? null;
      }
      setSrcObjects(next);
    };

    const timeout = window.setTimeout(syncSrcObjects, 0);
    const interval = window.setInterval(syncSrcObjects, 500);
    return () => {
      window.clearTimeout(timeout);
      window.clearInterval(interval);
    };
  }, [activeCalls, remoteElements]);

  return (
    <div
      className="rounded border bg-background p-4 shadow-sm"
      data-testid="sdk-per-call-remote-audio-panel"
    >
      <div className="mb-3 space-y-1">
        <h2 className="text-sm font-semibold">Per-call SDK remoteElement</h2>
        <p className="text-xs text-muted-foreground">
          Each call gets its own remoteElement (shared_1, shared_2, …). The SDK
          attaches each call&apos;s remote stream to its own &lt;audio&gt; via
          remoteElement (VSUP-121 / PR #725), so concurrent calls no longer
          conflict on one shared element.
        </p>
      </div>

      {activeCalls.length === 0 && (
        <p className="text-xs text-muted-foreground">No active calls.</p>
      )}

      <div className="space-y-4">
        {activeCalls.map((call) => {
          const elId = remoteElements[call.id];
          if (!elId) return null;
          const src = srcObjects[call.id];
          const ownerCall = activeCalls.find((c) => c.remoteStream === src);

          return (
            <div
              key={call.id}
              className="space-y-1 rounded-md border p-2"
              data-testid={`sdk-remote-audio-card-${call.id}`}
            >
              <p className="text-xs text-muted-foreground">
                Call{' '}
                <span data-testid={`sdk-remote-audio-call-id-${call.id}`}>
                  {call.id}
                </span>{' '}
                → element <code>{elId}</code>
              </p>
              <p className="text-xs text-muted-foreground">
                srcObject owner:{' '}
                <span data-testid={`sdk-remote-element-owner-${call.id}`}>
                  {ownerCall?.id ?? (src ? 'unknown/stale stream' : 'none')}
                </span>
              </p>
              <p className="text-xs text-muted-foreground">
                srcObject:{' '}
                <span data-testid={`sdk-remote-element-src-object-${call.id}`}>
                  {describeSrcObject(src)}
                </span>
              </p>
              <AudioPlayer
                remoteElement={elId}
                data-testid={`sdk-remote-audio-${call.id}`}
                controls
                className="w-full"
              />
              {ownerCall && ownerCall.id !== call.id && (
                <p className="text-xs text-yellow-500">
                  This element&apos;s srcObject belongs to a different call (
                  {ownerCall.id}) — unexpected cross-call ownership.
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PerCallRemoteAudio;
