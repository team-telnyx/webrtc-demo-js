import { LocalStreamReproOptions } from '@/atoms/callOptions';

export type ReproStatus = 'armed' | 'audible' | 'stopped' | 'failed';

export interface LocalStreamReproController {
  stream: MediaStream;
  status: ReproStatus;
  prepare: (reason: string) => Promise<void>;
  start: (reason: string) => Promise<void>;
  cleanup: () => void;
  getStatus: () => ReproStatus;
}

const getAudioContext = (): AudioContext => {
  const AudioContextCtor =
    window.AudioContext ||
    (window as typeof window & { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;

  if (!AudioContextCtor) {
    throw new Error('AudioContext is not supported by this browser');
  }

  return new AudioContextCtor();
};

const buildLoopingBuffer = async (
  audioCtx: AudioContext,
  options: LocalStreamReproOptions,
): Promise<AudioBuffer> => {
  if (options.source === 'recording') {
    if (!options.recordingUrl) {
      throw new Error('Recorded audio source selected without an audio file');
    }

    const response = await fetch(options.recordingUrl);
    const encodedAudio = await response.arrayBuffer();
    return audioCtx.decodeAudioData(encodedAudio);
  }

  const frameCount = audioCtx.sampleRate;
  const buffer = audioCtx.createBuffer(1, frameCount, audioCtx.sampleRate);
  const channel = buffer.getChannelData(0);
  const amplitude = Math.min(Math.max(options.amplitude, 0), 1);

  if (options.source === 'sine') {
    const frequencyHz = Math.min(Math.max(options.frequencyHz, 20), 20000);
    for (let i = 0; i < frameCount; i += 1) {
      channel[i] =
        amplitude *
        Math.sin((2 * Math.PI * frequencyHz * i) / audioCtx.sampleRate);
    }
    return buffer;
  }

  for (let i = 0; i < frameCount; i += 1) {
    channel[i] = amplitude * (Math.random() * 2 - 1);
  }
  return buffer;
};

/**
 * Customer-compatible localStream repro:
 *   incoming-call event -> create looping AudioBufferSource MediaStream
 *   -> assign call.options.localStream -> call.answer() -> source.start()
 *
 * There is no GainNode/ramp. The buffer starts with immediate non-silent audio,
 * and the delayed mode is only for A/B confirmation that initial silence helps.
 */
export async function buildLocalStreamRepro(
  options: LocalStreamReproOptions,
): Promise<LocalStreamReproController> {
  const log = (...args: unknown[]) => {
    if (options.logTiming) {
      console.log('[LocalStreamRepro]', ...args);
    }
  };

  let status: ReproStatus = 'armed';
  let delayTimeout: ReturnType<typeof setTimeout> | null = null;
  let hasStarted = false;

  const audioCtx = getAudioContext();
  const destination = audioCtx.createMediaStreamDestination();
  const sourceNode = audioCtx.createBufferSource();
  sourceNode.buffer = await buildLoopingBuffer(audioCtx, options);
  sourceNode.loop = true;
  sourceNode.connect(destination);

  const stream = destination.stream;

  const describeTracks = () =>
    stream.getAudioTracks().map((track) => ({
      id: track.id,
      enabled: track.enabled,
      muted: track.muted,
      readyState: track.readyState,
    }));

  const prepare = async (reason: string) => {
    try {
      if (audioCtx.state === 'suspended') {
        log('audioContext.resume() before answer()', reason);
        await audioCtx.resume();
      }

      log('audio context prepared', {
        reason,
        audioContextState: audioCtx.state,
        tracks: describeTracks(),
      });
    } catch (error) {
      status = 'failed';
      console.error('[LocalStreamRepro] failed to prepare audio context', error);
    }
  };

  const startNow = async (reason: string) => {
    if (hasStarted) return;

    try {
      if (audioCtx.state === 'suspended') {
        log('audioContext is still suspended at source.start()', reason);
      }

      sourceNode.start();
      hasStarted = true;
      status = 'audible';
      log('source.start()', {
        reason,
        audioContextState: audioCtx.state,
        tracks: describeTracks(),
      });
    } catch (error) {
      status = 'failed';
      console.error('[LocalStreamRepro] failed to start source', error);
    }
  };

  const start = async (reason: string) => {
    if (options.startMode === 'after-answer-delay' && options.delayMs > 0) {
      await new Promise<void>((resolve) => {
        delayTimeout = setTimeout(() => {
          delayTimeout = null;
          void startNow(`${reason} + ${options.delayMs}ms`).finally(resolve);
        }, options.delayMs);
      });
      return;
    }

    await startNow(reason);
  };

  const cleanup = () => {
    if (delayTimeout) {
      clearTimeout(delayTimeout);
      delayTimeout = null;
    }

    if (hasStarted) {
      try {
        sourceNode.stop();
      } catch {
        // Already stopped.
      }
    }

    try {
      sourceNode.disconnect();
    } catch {
      // Already disconnected.
    }

    stream.getTracks().forEach((track) => track.stop());

    if (audioCtx.state !== 'closed') {
      void audioCtx.close();
    }

    status = 'stopped';
  };

  log('created localStream repro', {
    source: options.source,
    frequencyHz: options.source === 'sine' ? options.frequencyHz : undefined,
    amplitude: options.amplitude,
    recordingName:
      options.source === 'recording' ? options.recordingName : undefined,
    startMode: options.startMode,
    delayMs: options.delayMs,
  });

  return {
    stream,
    get status() {
      return status;
    },
    prepare,
    start,
    cleanup,
    getStatus: () => status,
  };
}
