import { atom, useAtom, useSetAtom } from 'jotai';
import { useCallback } from 'react';
import { useClientOptions } from './clientOptions';

/**
 * Observability state for ACA's pre-playout TTS stream, the opt-in behind
 * `anonymous_login.target_params.streamingAudio`.
 *
 * The assistant audio you hear is the ordinary WebRTC media stream and arrives
 * with or without the opt-in. What the opt-in adds is a *second*, earlier copy
 * of the same speech delivered as base64 PCM over the signaling socket, before
 * playout. The demo does not play it — it measures it, so the timing the opt-in
 * exists to fix is visible.
 */

export type StreamingAudioFormat = {
  encoding: string;
  sampleRate: number;
  channels: number;
};

export type StreamingAudioResponse = {
  responseId: string;
  chunks: number;
  bytes: number;
  /** Sequence on the first delta seen. Non-zero means earlier chunks were missed. */
  firstSequence: number;
  lastSequence: number;
  /** Sequence numbers that never arrived between first and last. */
  missedSequences: number;
  /** ms from call-active to this response's first delta. */
  firstDeltaOffsetMs: number | null;
  /** ms from this response's first delta to its last. */
  spanMs: number;
  format: StreamingAudioFormat | null;
  status: 'streaming' | 'done' | 'interrupted';
};

export type StreamingAudioState = {
  callActiveAt: number | null;
  subscribeAttempts: number;
  /** ms from call-active to ACA's `response.audio_stream.subscribed` ack. */
  ackOffsetMs: number | null;
  /**
   * True when audio arrived before the ack was seen. That is the signature of a
   * server-side init-subscribe: ACA already had the stream open because VSP
   * forwarded the `streaming_audio` dynamic variable at login, rather than
   * because of our post-active subscribe.
   */
  audioBeforeAck: boolean;
  responses: StreamingAudioResponse[];
  lastError: string | null;
};

export const emptyStreamingAudioState: StreamingAudioState = {
  callActiveAt: null,
  subscribeAttempts: 0,
  ackOffsetMs: null,
  audioBeforeAck: false,
  responses: [],
  lastError: null,
};

const streamingAudioAtom = atom<StreamingAudioState>(emptyStreamingAudioState);

export const useStreamingAudio = () => useAtom(streamingAudioAtom);
export const useSetStreamingAudio = () => useSetAtom(streamingAudioAtom);

export const useResetStreamingAudio = () => {
  const setState = useSetStreamingAudio();

  return useCallback(() => {
    setState(emptyStreamingAudioState);
  }, [setState]);
};

/**
 * Whether the pre-playout opt-in is on, read from the saved client options so
 * the panel can say so before a call exists.
 */
export const useStreamingAudioEnabled = () => {
  const [clientOptions] = useClientOptions();
  return Boolean(clientOptions.anonymous_login?.target_params?.streamingAudio);
};

/** Bytes of PCM to milliseconds of speech, for the encodings ACA sends. */
export function estimateAudioMs(
  bytes: number,
  format: StreamingAudioFormat | null,
): number | null {
  if (!format || !format.sampleRate || !format.channels) {
    return null;
  }

  const encoding = format.encoding.toLowerCase();
  const bytesPerSample = /(^|[_-])(?:s|u)?16|pcm16/.test(encoding)
    ? 2
    : /(^|[_-])(?:s|u)?8|mulaw|alaw|pcmu|pcma/.test(encoding)
      ? 1
      : null;

  if (!bytesPerSample) {
    return null;
  }

  return (bytes / (format.sampleRate * format.channels * bytesPerSample)) * 1000;
}

/** One pre-playout audio chunk, normalised across the SDK and widget sources. */
export type AudioDelta = {
  responseId: string;
  sequence: number;
  byteLength: number;
  format: StreamingAudioFormat;
};

/**
 * Fold one delta into the state.
 *
 * Pure, and shared by both producers: the raw-SDK handler reads deltas off
 * `SwEvent.AIConversationMessage` and sizes them from the base64 payload, while
 * the AI Agent tab reads them off the widget's `assistant.audio.delta` DOM
 * event, which reports `byteLength` directly. Neither ordering nor arithmetic
 * should differ between the two, so neither owns it.
 *
 * `offsetMs` is milliseconds since the call went active, or null when that is
 * not known yet.
 */
export function applyAudioDelta(
  state: StreamingAudioState,
  delta: AudioDelta,
  offsetMs: number | null,
  ackPending: boolean,
): StreamingAudioState {
  const responses = [...state.responses];
  const index = responses.findIndex(
    (item) => item.responseId === delta.responseId,
  );

  if (index === -1) {
    const created: StreamingAudioResponse = {
      responseId: delta.responseId,
      chunks: 1,
      bytes: delta.byteLength,
      firstSequence: delta.sequence,
      lastSequence: delta.sequence,
      missedSequences: 0,
      firstDeltaOffsetMs: offsetMs,
      spanMs: 0,
      format: delta.format,
      status: 'streaming',
    };

    return {
      ...state,
      audioBeforeAck: state.audioBeforeAck || ackPending,
      responses: [...responses, created],
    };
  }

  const existing = responses[index];
  // Sequence is monotonic per response (ACA assigns it from a per-response
  // counter starting at 0), so a jump means chunks were lost in flight rather
  // than reordered.
  const skipped = Math.max(0, delta.sequence - existing.lastSequence - 1);

  responses[index] = {
    ...existing,
    chunks: existing.chunks + 1,
    bytes: existing.bytes + delta.byteLength,
    lastSequence: Math.max(existing.lastSequence, delta.sequence),
    missedSequences: existing.missedSequences + skipped,
    spanMs:
      offsetMs === null || existing.firstDeltaOffsetMs === null
        ? existing.spanMs
        : offsetMs - existing.firstDeltaOffsetMs,
    format: existing.format ?? delta.format,
  };

  return {
    ...state,
    audioBeforeAck: state.audioBeforeAck || ackPending,
    responses,
  };
}

/** Mark a response finished or interrupted. Unknown ids are ignored. */
export function applyAudioLifecycle(
  state: StreamingAudioState,
  type: 'done' | 'interrupted',
  responseId: string | undefined,
): StreamingAudioState {
  const index = state.responses.findIndex(
    (item) => item.responseId === (responseId ?? 'unknown'),
  );
  if (index === -1) {
    return state;
  }

  const responses = [...state.responses];
  responses[index] = { ...responses[index], status: type };
  return { ...state, responses };
}

export function totalChunks(state: StreamingAudioState): number {
  return state.responses.reduce((sum, response) => sum + response.chunks, 0);
}

export function totalBytes(state: StreamingAudioState): number {
  return state.responses.reduce((sum, response) => sum + response.bytes, 0);
}

export function totalMissedSequences(state: StreamingAudioState): number {
  return state.responses.reduce(
    (sum, response) => sum + response.missedSequences,
    0,
  );
}
