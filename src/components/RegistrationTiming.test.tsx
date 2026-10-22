import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { RegistrationTimingDetails } from './RegistrationTiming';
import type { RegistrationTimingSummary } from '@/lib/registrationTiming';

const timing: RegistrationTimingSummary = {
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
  socketAttempts: 2,
  droppedSteps: 3,
  droppedRequests: 0,
  longestInterval: {
    from: 'send login',
    to: 'receive login',
    durationMs: 412.7,
  },
  steps: [
    {
      timestamp: '2026-10-20T10:15:30.061Z',
      step: 'receive telnyx_rtc.gatewayState',
      deltaMs: 61.2,
      elapsedMs: 539.9,
      details: { requestId: 'gateway-id', requestMs: 61.2, state: 'REGED' },
    },
  ],
};

describe('RegistrationTimingDetails', () => {
  it('renders the SDK summary and the step table', () => {
    const markup = renderToStaticMarkup(
      <RegistrationTimingDetails timing={timing} />,
    );
    expect(markup).toContain('601 ms');
    expect(markup).toContain('589 ms');
    expect(markup).toContain('Socket attempts');
    expect(markup).toContain('413 ms between send login and receive login');
    expect(markup).toContain('receive telnyx_rtc.gatewayState');
    expect(markup).toContain(
      'requestId=gateway-id, requestMs=61.2 ms, state=REGED',
    );
    expect(markup).toContain('3 earlier step(s) were evicted');
  });
});
