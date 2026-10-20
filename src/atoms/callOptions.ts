import { atom, useAtom } from 'jotai';

export interface CustomHeader {
  name: string;
  value: string;
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
  customHeaders?: CustomHeader[];
  debug?: boolean;
  debugOutput?: 'socket' | 'file';
  preferred_codecs?: RTCRtpCodec[];
  prefetchIceCandidates?: boolean;
  trickleIce?: boolean;
  keepConnectionAliveOnSocketClose?: boolean;
  // Per-call devices. Applied by newCall() and, since @telnyx/webrtc 2.28.0,
  // by call.answer() for incoming calls. Undefined keeps the SDK defaults.
  micId?: string;
  speakerId?: string;
  camId?: string;
}

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
} as ICallOptions);

export const useCallOptions = () => useAtom(callOptionsAtom);
