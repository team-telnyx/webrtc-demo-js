import { describe, expect, it } from 'vitest';
import type { ICallOptions } from '@/atoms/callOptions';
import {
  SDK_DEFAULT_DEVICE,
  getAnswerOptions,
  toDeviceId,
  toSelectValue,
} from './callDevices';

const baseOptions: ICallOptions = {
  destinationNumber: '123',
  callerName: 'Demo',
  callerNumber: '+1555',
  customHeaders: [],
};

describe('getAnswerOptions', () => {
  it('returns no device keys when nothing is selected', () => {
    expect(getAnswerOptions(baseOptions)).toEqual({});
  });

  it('passes the selected microphone, speaker and camera to answer()', () => {
    expect(
      getAnswerOptions({
        ...baseOptions,
        micId: 'mic-1',
        speakerId: 'spk-1',
        camId: 'cam-1',
      }),
    ).toEqual({ micId: 'mic-1', speakerId: 'spk-1', camId: 'cam-1' });
  });

  it('does not leak outbound-only call options into answer()', () => {
    const answerOptions = getAnswerOptions({
      ...baseOptions,
      micId: 'mic-1',
      clientState: 'abc',
      preferred_codecs: [{ mimeType: 'audio/opus', clockRate: 48000 }],
    });
    expect(answerOptions).toEqual({ micId: 'mic-1' });
    expect(answerOptions).not.toHaveProperty('destinationNumber');
    expect(answerOptions).not.toHaveProperty('clientState');
  });

  it('keeps custom headers only when some are set', () => {
    const customHeaders = [{ name: 'X-Demo', value: '1' }];
    expect(getAnswerOptions({ ...baseOptions, customHeaders })).toEqual({
      customHeaders,
    });
  });
});

describe('device select values', () => {
  it('maps the sentinel to undefined and back', () => {
    expect(toDeviceId(SDK_DEFAULT_DEVICE)).toBeUndefined();
    expect(toDeviceId(undefined)).toBeUndefined();
    expect(toDeviceId('')).toBeUndefined();
    expect(toSelectValue(undefined)).toBe(SDK_DEFAULT_DEVICE);
  });

  it("keeps Chrome's literal 'default' device id", () => {
    expect(toDeviceId('default')).toBe('default');
    expect(toSelectValue('default')).toBe('default');
  });
});
