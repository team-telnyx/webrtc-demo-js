import { IClientOptions } from '@telnyx/webrtc';

export interface IClientOptionsDemo extends IClientOptions {
  rtcIp?: string;
  rtcPort?: number;
  trickleIce?: boolean;
  singleInterfaceIce?: boolean; // TODO: remove when singleInterfaceIce is added to IClientOptions in @telnyx/webrtc
  useCanaryRtcServer?: boolean;
  keepConnectionAliveOnSocketClose?: boolean;
  stunServers?: string[];
  turnServers?: TurnServer;
  video?: boolean;
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
