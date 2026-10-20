import { describe, expect, it } from 'vitest';
import {
  applyAudioDelta,
  applyAudioLifecycle,
  emptyStreamingAudioState,
  estimateAudioMs,
  type StreamingAudioFormat,
} from './streamingAudio';

// ACA maps a voice's audio data type to exactly two encodings: `raw` and `pcm`
// both become `pcm16`, `mp3` stays `mp3`, and anything else is passed straight
// through (`ACA.VSP.AudioEvent.encoding/1`). These lock that contract, since a
// duration estimate is only meaningful for uncompressed audio.
const pcm16: StreamingAudioFormat = {
  encoding: 'pcm16',
  sampleRate: 24000,
  channels: 1,
};

describe('estimateAudioMs', () => {
  it('estimates duration for pcm16, the encoding ACA sends for PCM voices', () => {
    // 24kHz mono pcm16 is 48000 bytes per second.
    expect(estimateAudioMs(48000, pcm16)).toBe(1000);
    expect(estimateAudioMs(24000, pcm16)).toBe(500);
  });

  it('accounts for sample rate and channel count', () => {
    expect(estimateAudioMs(48000, { ...pcm16, sampleRate: 48000 })).toBe(500);
    expect(estimateAudioMs(48000, { ...pcm16, channels: 2 })).toBe(500);
  });

  it('does not estimate compressed encodings from byte count', () => {
    expect(estimateAudioMs(48000, { ...pcm16, encoding: 'mp3' })).toBeNull();
  });

  it('does not estimate an encoding it does not recognise', () => {
    // ACA passes unrecognised voice data types through untouched, so an
    // unknown encoding must read as unknown rather than as a wrong number.
    expect(estimateAudioMs(48000, { ...pcm16, encoding: 'opus' })).toBeNull();
  });

  it('returns null for a missing or unusable format', () => {
    expect(estimateAudioMs(48000, null)).toBeNull();
    expect(estimateAudioMs(48000, { ...pcm16, sampleRate: 0 })).toBeNull();
    expect(estimateAudioMs(48000, { ...pcm16, channels: 0 })).toBeNull();
  });
});

// The SDK tab and the AI Agent tab feed these same functions from different
// event sources, so the accounting is pinned once here rather than per caller.
describe('applyAudioDelta', () => {
  const delta = (sequence: number, byteLength = 100, responseId = 'r1') => ({
    responseId,
    sequence,
    byteLength,
    format: pcm16,
  });

  it('opens a response on the first delta and records its start offset', () => {
    const state = applyAudioDelta(
      emptyStreamingAudioState,
      delta(0),
      120,
      false,
    );

    expect(state.responses).toHaveLength(1);
    expect(state.responses[0]).toMatchObject({
      responseId: 'r1',
      chunks: 1,
      bytes: 100,
      firstSequence: 0,
      lastSequence: 0,
      missedSequences: 0,
      firstDeltaOffsetMs: 120,
      status: 'streaming',
    });
  });

  it('accumulates chunks and bytes, and spans from the first delta', () => {
    let state = applyAudioDelta(emptyStreamingAudioState, delta(0), 100, false);
    state = applyAudioDelta(state, delta(1), 150, false);
    state = applyAudioDelta(state, delta(2), 200, false);

    expect(state.responses).toHaveLength(1);
    expect(state.responses[0].chunks).toBe(3);
    expect(state.responses[0].bytes).toBe(300);
    expect(state.responses[0].spanMs).toBe(100);
  });

  it('counts a sequence jump as missed chunks', () => {
    let state = applyAudioDelta(emptyStreamingAudioState, delta(0), 0, false);
    // 1 and 2 never arrived.
    state = applyAudioDelta(state, delta(3), 10, false);

    expect(state.responses[0].missedSequences).toBe(2);
    expect(state.responses[0].lastSequence).toBe(3);
  });

  it('keeps a non-zero opening sequence visible as the truncation signal', () => {
    // ACA numbers each response from 0, so a first delta at 4 means the four
    // before it were emitted before anything was subscribed.
    const state = applyAudioDelta(
      emptyStreamingAudioState,
      delta(4),
      50,
      false,
    );

    expect(state.responses[0].firstSequence).toBe(4);
    expect(state.responses[0].missedSequences).toBe(0);
  });

  it('tracks responses separately', () => {
    let state = applyAudioDelta(emptyStreamingAudioState, delta(0), 0, false);
    state = applyAudioDelta(state, delta(0, 100, 'r2'), 500, false);

    expect(state.responses.map((r) => r.responseId)).toEqual(['r1', 'r2']);
  });

  it('latches audioBeforeAck without letting a later delta clear it', () => {
    let state = applyAudioDelta(emptyStreamingAudioState, delta(0), 0, true);
    expect(state.audioBeforeAck).toBe(true);

    state = applyAudioDelta(state, delta(1), 10, false);
    expect(state.audioBeforeAck).toBe(true);
  });
});

describe('applyAudioLifecycle', () => {
  const opened = applyAudioDelta(
    emptyStreamingAudioState,
    { responseId: 'r1', sequence: 0, byteLength: 10, format: pcm16 },
    0,
    false,
  );

  it('marks a known response done or interrupted', () => {
    expect(applyAudioLifecycle(opened, 'done', 'r1').responses[0].status).toBe(
      'done',
    );
    expect(
      applyAudioLifecycle(opened, 'interrupted', 'r1').responses[0].status,
    ).toBe('interrupted');
  });

  it('ignores a response it never saw audio for', () => {
    expect(applyAudioLifecycle(opened, 'done', 'nope')).toBe(opened);
    expect(applyAudioLifecycle(opened, 'done', undefined)).toBe(opened);
  });
});
