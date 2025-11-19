import { IClientOptions } from "@telnyx/webrtc";

export interface IClientOptionsDemo extends IClientOptions {
  rtcIp?: string;
  rtcPort?: number;
  trickleIce?: boolean;
  keepConnectionAliveOnSocketClose?: boolean;
}

export type SipJsLogLevel = "debug" | "log" | "warn" | "error" | "off";

export type SimpleUserTurnServer = {
  urls: string;
  username?: string;
  password?: string;
};

export interface ISimpleUserClientOptions {
  host: string;
  port: string;
  wsServers: string;
  username: string;
  password: string;
  displayName: string;
  registrarServer: string;
  stunServers?: string[];
  turnServer?: SimpleUserTurnServer;
  logLevel: SipJsLogLevel;
  remoteAudioElementId: string;
}

export interface ISimpleUserCallOptions {
  destinationNumber: string;
  extraHeaders: string[];
  autoRegister: boolean;
}
