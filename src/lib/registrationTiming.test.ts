import { describe, expect, it, vi } from 'vitest';
import {
  formatMs,
  formatStepDetails,
  readRegistrationTiming,
  RegistrationTimingSummary,
} from './registrationTiming';

const summary: RegistrationTimingSummary = {
  event: 'registration_timing',
  schemaVersion: 1,
  scope: 'initial_registration',
  clientId: 'client-a',
  sessionId: 'session-a',
  sdkVersion: '2.28.0',
  startedAt: '2026-10-20T10:15:29.522Z',
  timestamp: '2026-10-20T10:15:30.123Z',
  totalMs: 601.3,
  constructorMs: 2.1,
  appWaitBeforeConnectMs: 10.4,
  connectToReadyMs: 588.8,
  socketAttempts: 1,
  droppedSteps: 0,
  droppedRequests: 0,
  longestInterval: {
    from: 'send login',
    to: 'receive login',
    durationMs: 412.7,
  },
  steps: [
    {
      timestamp: '2026-10-20T10:15:29.522Z',
      step: 'new TelnyxRTC()',
      deltaMs: 0,
      elapsedMs: 0,
    },
  ],
};

const clientWith = (context: unknown) => ({
  _registrationTimings: {
    getLogEntry: () => ({
      timestamp: summary.timestamp,
      level: 'info',
      message: 'Registration timing',
      context,
    }),
  },
});

describe('readRegistrationTiming', () => {
  it('returns the summary exposed by @telnyx/webrtc 2.28.0', () => {
    expect(readRegistrationTiming(clientWith(summary))).toEqual(summary);
  });

  it('returns null before the SDK finished the trace', () => {
    expect(
      readRegistrationTiming({
        _registrationTimings: { getLogEntry: () => undefined },
      }),
    ).toBeNull();
  });

  it('returns null for SDK builds without registration timing', () => {
    expect(readRegistrationTiming({})).toBeNull();
    expect(readRegistrationTiming(null)).toBeNull();
    expect(readRegistrationTiming({ _registrationTimings: {} })).toBeNull();
  });

  it('ignores log entries that are not the timing summary', () => {
    expect(readRegistrationTiming(clientWith({ foo: 'bar' }))).toBeNull();
    expect(
      readRegistrationTiming(clientWith({ ...summary, totalMs: 'fast' })),
    ).toBeNull();
  });

  it('does not throw when the SDK getter fails', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(
      readRegistrationTiming({
        _registrationTimings: {
          getLogEntry: () => {
            throw new Error('boom');
          },
        },
      }),
    ).toBeNull();
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});

describe('formatting', () => {
  it('formats durations', () => {
    expect(formatMs(601.3)).toBe('601 ms');
    expect(formatMs(2.14)).toBe('2.1 ms');
    expect(formatMs(undefined)).toBe('n/a');
  });

  it('formats step details like the SDK console line', () => {
    expect(
      formatStepDetails({
        requestId: 'login-1',
        requestMs: 412.7,
        state: 'REGED',
        attempt: undefined,
      }),
    ).toBe('requestId=login-1, requestMs=412.7 ms, state=REGED');
    expect(formatStepDetails(undefined)).toBe('');
  });
});
