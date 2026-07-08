import { IClientOptions } from '@telnyx/webrtc';

export type IceServersMode = 'merge' | 'replace';

export interface IClientOptionsDemo extends IClientOptions {
  rtcIp?: string;
  rtcPort?: number;
  trickleIce?: boolean;
  singleInterfaceIce?: boolean; // TODO: remove when singleInterfaceIce is added to IClientOptions in @telnyx/webrtc
  useCanaryRtcServer?: boolean;
  keepConnectionAliveOnSocketClose?: boolean;
  hangupOnBeforeUnload?: boolean;
  stunServers?: string[];
  turnServers?: TurnServer;
  iceServersMode?: IceServersMode;
  video?: boolean;
  skipTrailing?: boolean;
  // Opt-in call recording. Defaults to false — recording must be explicitly
  // enabled. TODO: remove when enableCallRecording is added to IClientOptions
  // in @telnyx/webrtc.
  enableCallRecording?: boolean;
}

export type TurnServer = {
  urls?: string;
  username?: string;
  password?: string;
};
export interface ISimpleUserCallOptions {
  destinationNumber: string;
  extraHeaders: string[];
}
