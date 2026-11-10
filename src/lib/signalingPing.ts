/**
 * Signaling ping latency between the SDK client and the signaling server
 * (rtc.telnyx.com), measured from the `telnyx_rtc.ping` messages on the
 * WebSocket.
 *
 * The SDK answers every server `telnyx_rtc.ping` with its own
 * `telnyx_rtc.ping` request, and its signaling health monitor sends one after
 * 20 s of silence. The server answers each of those requests with a result
 * carrying the same JSON-RPC id. The SDK resolves that response internally and
 * never emits it as `telnyx.socket.message`, so the round trip is timed on the
 * raw socket: request frame sent → response frame with the same id received.
 */

export const PING_METHOD = 'telnyx_rtc.ping';
const MAX_SAMPLES = 20;
const PENDING_TTL_MS = 30_000;

export type PingSample = {
  /** Round-trip time in milliseconds. */
  rttMs: number;
  /** Wall-clock time the response arrived. */
  at: Date;
  /** Host the socket is connected to, e.g. rtc.telnyx.com. */
  host: string;
  /** Who started the ping: the SDK (reply to a server ping or health probe) or the demo's "Ping now" button. */
  source: 'sdk' | 'manual';
};

export type PingStats = {
  last: PingSample;
  minMs: number;
  avgMs: number;
  maxMs: number;
  count: number;
  samples: PingSample[];
};

type Listener = (sample: PingSample) => void;

type Pending = { sentAt: number; source: PingSample['source'] };

const parse = (data: unknown): Record<string, unknown> | null => {
  if (typeof data !== 'string' || data[0] !== '{') return null;
  try {
    const msg = JSON.parse(data);
    return msg && typeof msg === 'object' ? msg : null;
  } catch {
    return null;
  }
};

const hostOf = (url: string) => {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
};

/**
 * Matches outgoing ping requests with their responses on one socket.
 * Exported for tests; the app uses it through installSignalingPingProbe().
 */
export class PingTracker {
  private pending = new Map<string, Pending>();
  private manualIds = new Set<string>();

  constructor(
    private host: string,
    private emit: Listener,
    private now: () => number = () => performance.now(),
  ) {}

  markManual(id: string) {
    this.manualIds.add(id);
  }

  onSend(data: unknown) {
    const msg = parse(data);
    if (!msg || msg.method !== PING_METHOD || 'result' in msg) return;
    const id = String(msg.id ?? '');
    if (!id) return;
    const sentAt = this.now();
    // Drop requests that never got an answer so the map cannot grow forever.
    for (const [key, p] of this.pending) {
      if (sentAt - p.sentAt > PENDING_TTL_MS) this.pending.delete(key);
    }
    const source = this.manualIds.delete(id) ? 'manual' : 'sdk';
    this.pending.set(id, { sentAt, source });
  }

  onMessage(data: unknown) {
    const msg = parse(data);
    if (!msg || !('result' in msg || 'error' in msg)) return;
    const id = String(msg.id ?? '');
    const p = this.pending.get(id);
    if (!p) return;
    this.pending.delete(id);
    this.emit({
      rttMs: this.now() - p.sentAt,
      at: new Date(),
      host: this.host,
      source: p.source,
    });
  }
}

export const summarize = (samples: PingSample[]): PingStats | null => {
  if (samples.length === 0) return null;
  const rtts = samples.map((s) => s.rttMs);
  return {
    last: samples[0],
    minMs: Math.min(...rtts),
    avgMs: rtts.reduce((a, b) => a + b, 0) / rtts.length,
    maxMs: Math.max(...rtts),
    count: samples.length,
    samples,
  };
};

/** Newest first, capped at MAX_SAMPLES. */
export const addSample = (samples: PingSample[], sample: PingSample) =>
  [sample, ...samples].slice(0, MAX_SAMPLES);

const listeners = new Set<Listener>();
const trackers = new WeakMap<WebSocket, PingTracker>();
let lastSocket: WebSocket | null = null;
let installed = false;

export const onPingSample = (listener: Listener) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

/**
 * Wraps window.WebSocket so every socket the SDK opens is observed. Must run
 * before the SDK creates its socket; idempotent.
 */
export const installSignalingPingProbe = () => {
  if (installed || typeof window === 'undefined' || !window.WebSocket) return;
  installed = true;
  const Native = window.WebSocket;

  class ObservedWebSocket extends Native {
    constructor(url: string | URL, protocols?: string | string[]) {
      super(url, protocols);
      const tracker = new PingTracker(hostOf(String(url)), (sample) =>
        listeners.forEach((l) => l(sample)),
      );
      trackers.set(this, tracker);
      // Remember the newest socket for the "ping now" button.
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      lastSocket = this;
      this.addEventListener('message', (event) =>
        tracker.onMessage(event.data),
      );
    }

    send(data: string | ArrayBufferLike | Blob | ArrayBufferView) {
      trackers.get(this)?.onSend(data);
      super.send(data);
    }
  }

  window.WebSocket = ObservedWebSocket as typeof WebSocket;
};

/**
 * Sends one telnyx_rtc.ping on the most recently opened socket. The server's
 * answer is timed like any other ping; the SDK ignores it (unknown id).
 * Returns false when there is no open socket.
 */
export const sendManualPing = () => {
  const ws = lastSocket;
  if (!ws || ws.readyState !== WebSocket.OPEN) return false;
  const id = crypto.randomUUID();
  trackers.get(ws)?.markManual(id);
  ws.send(
    JSON.stringify({ jsonrpc: '2.0', id, method: PING_METHOD, params: {} }),
  );
  return true;
};
