import { IClientOptions } from "@telnyx/webrtc";

export interface IClientOptionsDemo extends IClientOptions {
  rtcIp?: string;
  rtcPort?: number;
  trickleIce?: boolean;
  useCanaryRtcServer?: boolean;
  keepConnectionAliveOnSocketClose?: boolean;
}



export type SimpleUserTurnServer = {
  urls?: string;
  username?: string;
  password?: string;
};
export interface ISimpleUserCallOptions {
  destinationNumber: string;
  extraHeaders: string[];
}
