import { atom, useAtom } from 'jotai';

export interface CustomHeader {
  name: string;
  value: string;
}

export interface AudioStartupReproOptions {
  enabled: boolean;
  frequencyHz: number;
  gain: number;
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
   * SDK startup-audio repro option from team-telnyx/webrtc
   * feat/audio-startup-repro-harness.
   *
   * The SDK replaces outbound microphone audio with a deterministic sine tone
   * that starts immediately when the sender track is created. This is for
   * investigation only.
   */
  audioStartupRepro?: AudioStartupReproOptions;
}

const defaultAudioStartupRepro: AudioStartupReproOptions = {
  enabled: false,
  frequencyHz: 440,
  gain: 0.2,
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
  audioStartupRepro: { ...defaultAudioStartupRepro },
} as ICallOptions);

export const useCallOptions = () => useAtom(callOptionsAtom);
