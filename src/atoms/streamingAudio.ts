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
