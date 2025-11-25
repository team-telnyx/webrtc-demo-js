import { IClientOptions } from "@telnyx/webrtc";

export interface IClientOptionsDemo extends IClientOptions {
  rtcIp?: string;
  rtcPort?: number;
  trickleIce?: boolean;
  useCanaryRtcServer?: boolean;
  keepConnectionAliveOnSocketClose?: boolean;
}