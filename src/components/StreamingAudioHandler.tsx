import { useCallback, useEffect, useRef } from 'react';
import { SwEvent } from '@telnyx/webrtc';
import type { Call } from '@telnyx/webrtc';
import { useTelnyxSdkClient } from '@/atoms/telnyxClient';
import { useTelnyxNotification } from '@/atoms/telnyxNotification';
import {
  useResetStreamingAudio,
  useSetStreamingAudio,
  useStreamingAudioEnabled,
  type StreamingAudioFormat,
  type StreamingAudioResponse,
} from '@/atoms/streamingAudio';
import { useLog } from '@/atoms/log';

// ACA acks every subscribe idempotently. Retry until the ack lands to cover the
// race where the call goes active just before ACA's VSP channel is ready, but
// bound it so a proxy without support cannot spin forever. Matches the cap in
// @telnyx/ai-agent-lib.
const MAX_SUBSCRIBE_ATTEMPTS = 10;

type AudioDeltaEvent = {
  type: 'response.audio.delta';
  response_id: string;
  sequence: number;
  delta: string;
  format: StreamingAudioFormat;
};

type AudioLifecycleEvent = {
  type: 'response.audio.done' | 'response.audio.interrupted';
  response_id?: string;
};

type AudioEvent = AudioDeltaEvent | AudioLifecycleEvent;

function getParams(event: unknown): Record<string, unknown> | null {
  if (!event || typeof event !== 'object') {
    return null;
  }

  const message = event as { method?: unknown; params?: unknown };
  if (message.method !== 'ai_conversation') {
    return null;
  }

  if (!message.params || typeof message.params !== 'object') {
    return null;
  }

  return message.params as Record<string, unknown>;
}

function isSubscribedAck(event: unknown): boolean {
  return getParams(event)?.type === 'response.audio_stream.subscribed';
}

/**
 * Narrow an `ai_conversation` event to an assistant audio event, mirroring the
 * wire contract @telnyx/ai-agent-lib validates in `getAssistantAudioEvent`.
 */
function getAudioEvent(event: unknown): AudioEvent | null {
  const params = getParams(event);
  if (!params) {
    return null;
  }

  if (params.type === 'response.audio.delta') {
    const format = params.format;
    if (!format || typeof format !== 'object') {
      return null;
    }

    const wireFormat = format as Record<string, unknown>;
    if (
      typeof params.response_id !== 'string' ||
      typeof params.delta !== 'string' ||
      typeof params.sequence !== 'number' ||
      !Number.isInteger(params.sequence) ||
      typeof wireFormat.encoding !== 'string' ||
      typeof wireFormat.sample_rate !== 'number' ||
      typeof wireFormat.channels !== 'number'
    ) {
      return null;
    }

    return {
      type: 'response.audio.delta',
      response_id: params.response_id,
      sequence: params.sequence,
      delta: params.delta,
      format: {
        encoding: wireFormat.encoding,
        sampleRate: wireFormat.sample_rate,
        channels: wireFormat.channels,
      },
    };
  }

  if (
    params.type === 'response.audio.done' ||
    params.type === 'response.audio.interrupted'
  ) {
    return {
      type: params.type,
      response_id:
        typeof params.response_id === 'string' ? params.response_id : undefined,
    };
  }

  return null;
}

/** Decoded byte length of a base64 payload, without allocating the bytes. */
function decodedByteLength(base64: string): number {
  const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0;
  return Math.max(0, Math.floor((base64.length * 3) / 4) - padding);
}

/**
 * Subscribes to ACA's pre-playout audio stream and records what arrives.
 *
 * This is the client half of the `streamingAudio` opt-in: the login parameter
 * asks VSP to have ACA open the stream before the greeting, and this subscribe
 * is the fallback that covers proxies without that support. The lib does both;
 * so does the demo, gated on the same switch.
 */
const StreamingAudioHandler = () => {
  const [client] = useTelnyxSdkClient();
  const [notification] = useTelnyxNotification();
  const setState = useSetStreamingAudio();
  const reset = useResetStreamingAudio();
  const { pushLog } = useLog();

  const enabled = useStreamingAudioEnabled();

  const call = notification?.call ?? null;
  const callId = call?.id ?? null;
  const callState = call?.state ?? null;

  // Refs, not state: the event handler must not be re-registered on every delta.
  const callRef = useRef<Call | null>(null);
  const subscribedRef = useRef(false);
  const ackObservedRef = useRef(false);
  const attemptsRef = useRef(0);
  const callActiveAtRef = useRef<number | null>(null);

  // Declared before the effects that read it, so the ref is current by the time
  // they run in the same commit.
  useEffect(() => {
    callRef.current = call;
  }, [call]);

  useEffect(() => {
    if (!enabled || !callId) {
      return;
    }

    subscribedRef.current = false;
    ackObservedRef.current = false;
    attemptsRef.current = 0;
    callActiveAtRef.current = null;
    reset();
  }, [enabled, callId, reset]);

  // Part 2: subscribe once the call is active, and keep retrying until ACA
  // either acks the subscription or proves it with audio.
  const sendSubscribe = useCallback(() => {
    if (!enabled || subscribedRef.current) {
      return;
    }

    if (attemptsRef.current >= MAX_SUBSCRIBE_ATTEMPTS) {
      return;
    }

    const activeCall = callRef.current;
    if (!activeCall) {
      return;
    }

    try {
      activeCall.sendAIConversationMessage({
        type: 'response.audio_stream.subscribe',
      });
      // Count only successful sends against the cap, so a transient failure
      // does not exhaust the retry budget.
      attemptsRef.current += 1;
      setState((prev) => ({ ...prev, subscribeAttempts: attemptsRef.current }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown error';
      setState((prev) => ({ ...prev, lastError: message }));
    }
  }, [enabled, setState]);

  useEffect(() => {
    if (!enabled || callState !== 'active' || !callId) {
      return;
    }

    if (callActiveAtRef.current === null) {
      callActiveAtRef.current = performance.now();
      setState((prev) => ({ ...prev, callActiveAt: callActiveAtRef.current }));
      pushLog({
        id: `streaming-audio-subscribe-${callId}`,
        description:
          'Streaming audio: subscribing to pre-playout assistant audio',
      });
    }

    sendSubscribe();
  }, [enabled, callState, callId, sendSubscribe, setState, pushLog]);

  // Part 3: consume the stream ACA sends back.
  useEffect(() => {
    if (!enabled || !client) {
      return;
    }

    const onMessage = (event: unknown) => {
      const sinceActive = () => {
        const activeAt = callActiveAtRef.current;
        return activeAt === null ? null : performance.now() - activeAt;
      };

      if (isSubscribedAck(event)) {
        subscribedRef.current = true;

        if (!ackObservedRef.current) {
          ackObservedRef.current = true;
          const offset = sinceActive();
          setState((prev) => ({ ...prev, ackOffsetMs: offset }));
          pushLog({
            id: 'streaming-audio-subscribed',
            description: `Streaming audio: subscribed${
              offset === null ? '' : ` after ${offset.toFixed(0)}ms`
            }`,
          });
        }
        return;
      }

      const audioEvent = getAudioEvent(event);
      if (!audioEvent) {
        // Not audio, but proof the channel is live: retry the subscribe while
        // the ack is still outstanding.
        if (!subscribedRef.current) {
          sendSubscribe();
        }
        return;
      }

      // Audio is flowing, so the subscription exists even if the ack has not
      // arrived yet. Keep ack observation separate so a later ack still records
      // the offset while this signal stops subscribe retries.
      const audioArrivedBeforeAck = !ackObservedRef.current;
      subscribedRef.current = true;

      setState((prev) => {
        const responses = [...prev.responses];
        const responseId = audioEvent.response_id ?? 'unknown';
        const index = responses.findIndex(
          (item) => item.responseId === responseId,
        );

        if (audioEvent.type !== 'response.audio.delta') {
          if (index === -1) {
            return prev;
          }

          responses[index] = {
            ...responses[index],
            status:
              audioEvent.type === 'response.audio.done' ? 'done' : 'interrupted',
          };
          return { ...prev, responses };
        }

        const bytes = decodedByteLength(audioEvent.delta);
        const offset = sinceActive();

        if (index === -1) {
          const created: StreamingAudioResponse = {
            responseId,
            chunks: 1,
            bytes,
            firstSequence: audioEvent.sequence,
            lastSequence: audioEvent.sequence,
            missedSequences: 0,
            firstDeltaOffsetMs: offset,
            spanMs: 0,
            format: audioEvent.format,
            status: 'streaming',
          };

          return {
            ...prev,
            audioBeforeAck: prev.audioBeforeAck || audioArrivedBeforeAck,
            responses: [...responses, created],
          };
        }

        const existing = responses[index];
        // Sequence is monotonic per response, so a jump means chunks were lost
        // in flight rather than reordered.
        const skipped = Math.max(
          0,
          audioEvent.sequence - existing.lastSequence - 1,
        );

        responses[index] = {
          ...existing,
          chunks: existing.chunks + 1,
          bytes: existing.bytes + bytes,
          lastSequence: Math.max(existing.lastSequence, audioEvent.sequence),
          missedSequences: existing.missedSequences + skipped,
          spanMs:
            offset === null || existing.firstDeltaOffsetMs === null
              ? existing.spanMs
              : offset - existing.firstDeltaOffsetMs,
          format: existing.format ?? audioEvent.format,
        };

        return {
          ...prev,
          audioBeforeAck: prev.audioBeforeAck || audioArrivedBeforeAck,
          responses,
        };
      });
    };

    client.on(SwEvent.AIConversationMessage, onMessage);
    return () => {
      client.off(SwEvent.AIConversationMessage, onMessage);
    };
  }, [enabled, client, sendSubscribe, setState, pushLog]);

  return null;
};

export default StreamingAudioHandler;
