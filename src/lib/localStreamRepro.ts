import { LocalStreamReproOptions } from '@/atoms/callOptions';

export type ReproStatus = 'armed' | 'audible' | 'stopped' | 'failed';

export interface LocalStreamReproController {
  /** The MediaStream to pass as SDK localStream option */
  stream: MediaStream;
  /** Current repro status */
  status: ReproStatus;
  /** Start audio output (unmute gain). reason is logged if logTiming. */
  start: (reason: string) => void;
  /** Stop audio output (mute gain). reason is logged if logTiming. */
  stop: (reason: string) => void;
  /** Full teardown — stop source, stop tracks, close AudioContext */
  cleanup: () => void;
  /** Called by CallNotificationHandler when call state = "active" */
  onCallActive: () => void;
  /** Read current status */
  getStatus: () => ReproStatus;
  /** Subscribe to status changes */
  onStatusChange: (cb: (status: ReproStatus) => void) => () => void;
}

/**
 * Build a synthetic MediaStream from repro config.
 *
 * Architecture:
 *   OscillatorNode / ScriptProcessor (noise)
 *     → GainNode (volume, starts at 0)
 *     → MediaStreamAudioDestinationNode
 *     → destination.stream (passed as localStream)
 *
 * The source is always running; gain starts at 0 (armed).
 * start() ramps gain to target volume.
 * stop() ramps gain to 0.
 */
export function buildLocalStreamRepro(
  options: LocalStreamReproOptions,
): LocalStreamReproController {
  const log = (...args: unknown[]) => {
    if (options.logTiming) {
      console.log('[LocalStreamRepro]', ...args);
    }
  };

  let status: ReproStatus = 'armed';
  const listeners = new Set<(s: ReproStatus) => void>();
  let delayTimeout: ReturnType<typeof setTimeout> | null = null;

  const setStatus = (s: ReproStatus) => {
    status = s;
    listeners.forEach((cb) => cb(s));
  };

  // Create AudioContext
  const audioCtx = new AudioContext();
  const destination = audioCtx.createMediaStreamDestination();
  const gainNode = audioCtx.createGain();
  gainNode.gain.value = 0; // Start silent (armed)
  gainNode.connect(destination);

  let sourceNode: AudioNode;

  if (options.source === 'sine') {
    const osc = audioCtx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = options.frequencyHz;
    osc.connect(gainNode);
    osc.start();
    sourceNode = osc;
    log('Created sine source', options.frequencyHz, 'Hz');
  } else {
    // White noise via ScriptProcessorNode
    const bufSize = 4096;
    const noise = audioCtx.createScriptProcessor(bufSize, 1, 1);
    noise.onaudioprocess = (e) => {
      const out = e.outputBuffer.getChannelData(0);
      for (let i = 0; i < bufSize; i++) {
        out[i] = Math.random() * 2 - 1;
      }
    };
    noise.connect(gainNode);
    sourceNode = noise;
    log('Created white noise source');
  }

  const stream = destination.stream;

  // --- Controller methods ---

  const start = (reason: string) => {
    if (status === 'audible') return;
    log('start()', reason, '→ ramping gain to', options.volume);

    // Resume AudioContext if suspended (autoplay policy)
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const now = audioCtx.currentTime;
    gainNode.gain.cancelScheduledValues(now);
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(options.volume, now + 0.02);

    setStatus('audible');
    log('start() complete — status=audible');
  };

  const stop = (reason: string) => {
    if (status !== 'audible') return;
    log('stop()', reason, '→ ramping gain to 0');

    const now = audioCtx.currentTime;
    gainNode.gain.cancelScheduledValues(now);
    gainNode.gain.setValueAtTime(gainNode.gain.value, now);
    gainNode.gain.linearRampToValueAtTime(0, now + 0.02);

    setStatus('stopped');
    log('stop() complete — status=stopped');
  };

  const cleanup = () => {
    log('cleanup()');

    if (delayTimeout) {
      clearTimeout(delayTimeout);
      delayTimeout = null;
    }

    // Ramp down if still audible
    if (status === 'audible') {
      const now = audioCtx.currentTime;
      gainNode.gain.cancelScheduledValues(now);
      gainNode.gain.setValueAtTime(gainNode.gain.value, now);
      gainNode.gain.linearRampToValueAtTime(0, now + 0.01);
    }

    // Disconnect nodes
    try {
      sourceNode.disconnect();
    } catch { /* already disconnected */ }
    try {
      gainNode.disconnect();
    } catch { /* already disconnected */ }

    // Stop stream tracks
    stream.getTracks().forEach((t) => t.stop());

    // Close AudioContext
    if (audioCtx.state !== 'closed') {
      audioCtx.close();
    }

    setStatus('stopped');
    listeners.clear();
  };

  const onCallActive = () => {
    log('onCallActive() — startMode:', options.startMode);

    if (delayTimeout) {
      clearTimeout(delayTimeout);
      delayTimeout = null;
    }

    switch (options.startMode) {
      case 'on-active':
        start('call.active → immediate');
        break;

      case 'after-active-delay':
        log('scheduling start after', options.delayMs, 'ms');
        delayTimeout = setTimeout(() => {
          start(`call.active + ${options.delayMs}ms delay`);
          delayTimeout = null;
        }, options.delayMs);
        break;

      case 'before-call':
        // Already started in Dialer before newCall()
        log('before-call mode — audio should already be audible');
        break;

      case 'manual':
        log('manual mode — waiting for user to click Start');
        break;
    }
  };

  // If startMode is 'before-call', start audio immediately
  if (options.startMode === 'before-call') {
    // Small timeout so the caller can set up first
    setTimeout(() => start('before-call mode — immediate start'), 50);
  }

  return {
    stream,
    get status() {
      return status;
    },
    start,
    stop,
    cleanup,
    onCallActive,
    getStatus: () => status,
    onStatusChange: (cb: (s: ReproStatus) => void) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
  };
}
