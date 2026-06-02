import { atom, useAtom } from 'jotai';

export interface CustomHeader {
  name: string;
  value: string;
}

export type LocalStreamReproSource = 'sine' | 'noise';
export type LocalStreamReproStartMode = 'after-answer' | 'after-answer-delay';

export interface LocalStreamReproOptions {
  enabled: boolean;
  source: LocalStreamReproSource;
  startMode: LocalStreamReproStartMode;
  delayMs: number;
  frequencyHz: number;
  amplitude: number;
  logTiming: boolean;
}

export interface ICallOptions {
  destinationNumber: string;
  callerNumber: string;
  callerName: string;
  telnyxCallControlId?: string;
  telnyxSessionId?: string;
  telnyxLegId?: string;
  clientState?: string;
  iceServers?: RTCIceServer[];
  useStereo?: boolean;
  video?: boolean;
  customHeaders?: CustomHeader[];
  debug?: boolean;
  debugOutput?: 'socket' | 'file';
  preferred_codecs?: RTCRtpCodec[];
  prefetchIceCandidates?: boolean;
  trickleIce?: boolean;
  keepConnectionAliveOnSocketClose?: boolean;
  /**
   * Demo-app level repro helper. When enabled, inbound calls are answered as
   * soon as the incoming call component renders, matching customer apps that
   * auto-answer instead of waiting for a user click.
   */
  autoAnswerInbound?: boolean;
  /**
   * Demo-only localStream repro config. This is intentionally not an SDK
   * option: the demo creates a looping AudioBufferSource stream, assigns it to
   * call.options.localStream, calls answer(), then starts the source.
   */
  localStreamRepro?: LocalStreamReproOptions;
}

const defaultLocalStreamRepro: LocalStreamReproOptions = {
  enabled: false,
  source: 'sine',
  startMode: 'after-answer',
  delayMs: 0,
  frequencyHz: 440,
  amplitude: 1,
  logTiming: true,
};

const callOptionsAtom = atom({
  destinationNumber: '',
  callerName: '',
  callerNumber: '',
  clientState: undefined,
  customHeaders: [],
  telnyxCallControlId: undefined,
  telnyxLegId: undefined,
  telnyxSessionId: undefined,
  useStereo: false,
  autoAnswerInbound: false,
  localStreamRepro: { ...defaultLocalStreamRepro },
} as ICallOptions);

export const useCallOptions = () => useAtom(callOptionsAtom);
