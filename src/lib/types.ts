import { IClientOptions } from "@telnyx/webrtc";

export interface IClientOptionsDemo extends IClientOptions {
  rtcIp?: string;
  rtcPort?: number;
  trickleIce?: boolean;
  useCanaryRtcServer?: boolean;
  keepConnectionAliveOnSocketClose?: boolean;
  stunServers?: string[];
  turnServers?: TurnServer;
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
