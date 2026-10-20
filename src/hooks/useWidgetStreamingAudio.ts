import { useCallback, useRef } from 'react';
import {
  applyAudioDelta,
  applyAudioLifecycle,
  emptyStreamingAudioState,
  useSetStreamingAudio,
} from '@/atoms/streamingAudio';

/**
 * Feeds the streaming-audio panel from the widget's `assistant.audio.*` DOM
 * events.
 *
 * The AI Agent tab does not own a TelnyxRTC client — @telnyx/ai-agent-lib does,
 * inside the widget — so it cannot send the subscribe or watch the ack the way
 * the SDK tab does. What it can do is observe the resulting stream, which the
 * widget forwards as metadata-only CustomEvents. Accumulation is shared with
 * the SDK path so the numbers mean the same thing in both tabs.
 *
 * Offsets are measured from the call going active, matching the SDK tab, so
 * "Greeting at" is comparable between the two.
 */
export function useWidgetStreamingAudio() {
  const setState = useSetStreamingAudio();
  const callActiveAtRef = useRef<number | null>(null);

  const reset = useCallback(() => {
    callActiveAtRef.current = null;
    setState(emptyStreamingAudioState);
  }, [setState]);

  const markCallActive = useCallback(() => {
    if (callActiveAtRef.current !== null) {
      return;
    }
    callActiveAtRef.current = performance.now();
    setState((prev) => ({ ...prev, callActiveAt: callActiveAtRef.current }));
  }, [setState]);

  const handleAudioEvent = useCallback(
    (eventType: string, detail: unknown) => {
      const payload = (detail ?? {}) as {
        responseId?: unknown;
        sequence?: unknown;
        byteLength?: unknown;
        format?: {
          encoding?: unknown;
          sampleRate?: unknown;
          channels?: unknown;
        };
      };
      const responseId =
        typeof payload.responseId === 'string' ? payload.responseId : 'unknown';

      if (eventType === 'assistant.audio.done') {
        setState((prev) => applyAudioLifecycle(prev, 'done', responseId));
        return;
      }

      if (eventType === 'assistant.audio.interrupted') {
        setState((prev) => applyAudioLifecycle(prev, 'interrupted', responseId));
        return;
      }

      if (eventType !== 'assistant.audio.delta') {
        return;
      }

      const { format } = payload;
      if (
        typeof payload.sequence !== 'number' ||
        !Number.isInteger(payload.sequence) ||
        typeof payload.byteLength !== 'number' ||
        typeof format?.encoding !== 'string' ||
        typeof format.sampleRate !== 'number' ||
        typeof format.channels !== 'number'
      ) {
        return;
      }

      const offset =
        callActiveAtRef.current === null
          ? null
          : performance.now() - callActiveAtRef.current;

      setState((prev) =>
        applyAudioDelta(
          prev,
          {
            responseId,
            sequence: payload.sequence as number,
            byteLength: payload.byteLength as number,
            format: {
              encoding: format.encoding as string,
              sampleRate: format.sampleRate as number,
              channels: format.channels as number,
            },
          },
          offset,
          // The library owns the subscribe here and does not surface its ack,
          // so there is no ack to have beaten.
          false,
        ),
      );
    },
    [setState],
  );

  return { handleAudioEvent, markCallActive, reset };
}
