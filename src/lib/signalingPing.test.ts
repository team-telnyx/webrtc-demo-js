import { describe, expect, it } from 'vitest';
import { addSample, PingSample, PingTracker, summarize } from './signalingPing';

const ping = (id: string, extra: Record<string, unknown> = {}) =>
  JSON.stringify({
    jsonrpc: '2.0',
    id,
    method: 'telnyx_rtc.ping',
    params: {},
    ...extra,
  });

const result = (id: string) =>
  JSON.stringify({
    jsonrpc: '2.0',
    id,
    result: { method: 'telnyx_rtc.ping' },
  });

const setup = () => {
  let now = 1000;
  const samples: PingSample[] = [];
  const tracker = new PingTracker(
    'rtc.telnyx.com',
    (s) => samples.push(s),
    () => now,
  );
  return {
    tracker,
    samples,
    advance: (ms: number) => {
      now += ms;
    },
  };
};

describe('PingTracker', () => {
  it('times a ping request against the response with the same id', () => {
    const { tracker, samples, advance } = setup();
    tracker.onSend(ping('a'));
    advance(42);
    tracker.onMessage(result('a'));
    expect(samples).toHaveLength(1);
    expect(samples[0]).toMatchObject({
      rttMs: 42,
      host: 'rtc.telnyx.com',
      source: 'sdk',
    });
  });

  it('ignores the server ping request, other methods and unknown ids', () => {
    const { tracker, samples, advance } = setup();
    // Server-initiated ping arrives as a request, not a response.
    tracker.onMessage(ping('server-1'));
    tracker.onSend(
      JSON.stringify({ jsonrpc: '2.0', id: 'b', method: 'telnyx_rtc.invite' }),
    );
    advance(10);
    tracker.onMessage(result('b'));
    tracker.onMessage(result('nobody'));
    tracker.onMessage('#SPU123');
    expect(samples).toHaveLength(0);
  });

  it('does not treat the SDK acking a server ping as a ping request', () => {
    const { tracker, samples, advance } = setup();
    tracker.onSend(ping('c', { result: { method: 'telnyx_rtc.ping' } }));
    advance(5);
    tracker.onMessage(result('c'));
    expect(samples).toHaveLength(0);
  });

  it('counts each response once and labels manual pings', () => {
    const { tracker, samples, advance } = setup();
    tracker.markManual('m');
    tracker.onSend(ping('m'));
    advance(30);
    tracker.onMessage(result('m'));
    tracker.onMessage(result('m'));
    expect(samples).toHaveLength(1);
    expect(samples[0].source).toBe('manual');
  });

  it('forgets requests older than 30 s', () => {
    const { tracker, samples, advance } = setup();
    tracker.onSend(ping('old'));
    advance(31_000);
    tracker.onSend(ping('new'));
    tracker.onMessage(result('old'));
    expect(samples).toHaveLength(0);
  });
});

describe('summarize / addSample', () => {
  const sample = (rttMs: number): PingSample => ({
    rttMs,
    at: new Date(),
    host: 'rtc.telnyx.com',
    source: 'sdk',
  });

  it('returns null without samples', () => {
    expect(summarize([])).toBeNull();
  });

  it('computes last/min/avg/max with the newest sample first', () => {
    let samples: PingSample[] = [];
    for (const rtt of [40, 20, 60]) samples = addSample(samples, sample(rtt));
    const stats = summarize(samples)!;
    expect(stats.last.rttMs).toBe(60);
    expect(stats.minMs).toBe(20);
    expect(stats.avgMs).toBe(40);
    expect(stats.maxMs).toBe(60);
  });

  it('keeps the 20 newest samples', () => {
    let samples: PingSample[] = [];
    for (let i = 0; i < 25; i++) samples = addSample(samples, sample(i));
    expect(samples).toHaveLength(20);
    expect(samples[0].rttMs).toBe(24);
  });
});
