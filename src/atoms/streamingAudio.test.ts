import { describe, expect, it } from 'vitest';
import { estimateAudioMs, type StreamingAudioFormat } from './streamingAudio';

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
