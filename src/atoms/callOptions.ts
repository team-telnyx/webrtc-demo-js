import { atom, useAtom } from 'jotai';

export interface CustomHeader {
  name: string;
  value: string;
}

// --- LocalStream Repro types (demo-only, not passed to SDK) ---

export type LocalStreamReproSource = 'sine' | 'noise';

export type LocalStreamReproStartMode =
  | 'before-call'
  | 'on-active'
  | 'after-active-delay'
  | 'manual';

export interface LocalStreamReproOptions {
  enabled: boolean;
  source: LocalStreamReproSource;
  startMode: LocalStreamReproStartMode;
  delayMs: number;
  frequencyHz: number;
  volume: number;
  logTiming: boolean;
}

// --- End LocalStream Repro types ---

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
  customHeaders?: CustomHeader[];
  debug?: boolean;
  debugOutput?: 'socket' | 'file';
  preferred_codecs?: RTCRtpCodec[];
  prefetchIceCandidates?: boolean;
  trickleIce?: boolean;
  keepConnectionAliveOnSocketClose?: boolean;
  /** SDK option — synthetic MediaStream to send as local audio */
  localStream?: MediaStream;
  /** Demo-only config — controls when/how repro audio starts. NOT passed to SDK. */
  localStreamRepro?: LocalStreamReproOptions;
}

const defaultLocalStreamRepro: LocalStreamReproOptions = {
  enabled: false,
  source: 'sine',
  startMode: 'on-active',
  delayMs: 3000,
  frequencyHz: 440,
  volume: 0.25,
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
  localStreamRepro: { ...defaultLocalStreamRepro },
} as ICallOptions);

export const useCallOptions = () => useAtom(callOptionsAtom);
