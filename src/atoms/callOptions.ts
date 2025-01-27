import { atom, useAtom } from "jotai";

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
  debugOutput?: "socket" | "file";
  preferred_codecs?: RTCRtpCodec[];
  prefetchIceCandidates?: boolean;
  video?: boolean;
}

const callOptionsAtom = atom({
  destinationNumber: "",
  callerName: "",
  callerNumber: "",
  clientState: undefined,
  customHeaders: [],
  prefetchIceCandidates: false,
  telnyxCallControlId: undefined,
  telnyxLegId: undefined,
  telnyxSessionId: undefined,
  useStereo: false,
  video: false,
} as ICallOptions);

export const useCallOptions = () => useAtom(callOptionsAtom);
