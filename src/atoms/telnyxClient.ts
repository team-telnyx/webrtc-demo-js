import { atom, useAtom } from "jotai";
import { TelnyxRTC } from "@telnyx/webrtc";
import { TelnyxDevice } from "@telnyx/rtc-sipjs-simple-user";
import { clientOptionsAtom } from "./clientOptions";
import { hostAtom } from "./host";
import { regionAtom } from "./region";
import {
  IClientOptionsDemo,
  ISimpleUserClientOptions,
} from "@/lib/types";
import { clientModeAtom } from "./clientMode";
import { simpleUserClientOptionsAtom } from "./simpleUserClientOptions";

type TelnyxRTCVersion = {
  version: string;
  Class: typeof TelnyxRTC;
};

type TelnyxClientInstance = TelnyxRTC | TelnyxDevice;

const telnyxRTCVersionAtom = atom<TelnyxRTCVersion>({
  version: "latest",
  Class: TelnyxRTC,
});

const connectionStatusAtom = atom<string>("disconnected");

// SIP.js Simple User status atoms
export type WsStatus = "idle" | "connecting" | "connected" | "disconnected";
export type RegistrationStatus = "idle" | "unregistered" | "registering" | "registered";
export type CallStatus =
  | "idle"
  | "incoming"
  | "dialing"
  | "connecting"
  | "connected"
  | "ended"
  | "failed";

const sipJsWsStatusAtom = atom<WsStatus>("idle");
const sipJsRegistrationStatusAtom = atom<RegistrationStatus>("idle");
const sipJsCallStatusAtom = atom<CallStatus>("idle");

const clientAtom = atom<TelnyxClientInstance | null>((get) => {
  const mode = get(clientModeAtom);
  if (mode === "sipjs") {
    const sipJsOptions = get(simpleUserClientOptionsAtom);
    return createSimpleUserClient(sipJsOptions);
  }

  const clientOptions = get(clientOptionsAtom);
  const region = get(regionAtom);
  const host = get(hostAtom);
  const { Class: TelnyxRTCClass } = get(telnyxRTCVersionAtom);

  return createTelnyxRTCClient(clientOptions, region, host, TelnyxRTCClass);
});

const telnyxRtcClientAtom = atom<TelnyxRTC | null>((get) => {
  const mode = get(clientModeAtom);
  if (mode === "sipjs") {
    return null;
  }
  const client = get(clientAtom);
  return client instanceof TelnyxRTC ? client : null;
});

const telnyxSipJsClientAtom = atom<TelnyxDevice | null>((get) => {
  const mode = get(clientModeAtom);
  if (mode !== "sipjs") {
    return null;
  }
  const client = get(clientAtom);
  return client instanceof TelnyxDevice ? client : null;
});

export const useTelnyxClient = () => useAtom(clientAtom);
export const useTelnyxSdkClient = () => useAtom(telnyxRtcClientAtom);
export const useSipJsClient = () => useAtom(telnyxSipJsClientAtom);
export const useConnectionStatus = () => useAtom(connectionStatusAtom);
export const useTelnyxSDKVersion = () => useAtom(telnyxRTCVersionAtom);

// SIP.js Simple User status hooks
export const useSipJsWsStatus = () => useAtom(sipJsWsStatusAtom);
export const useSipJsRegistrationStatus = () => useAtom(sipJsRegistrationStatusAtom);
export const useSipJsCallStatus = () => useAtom(sipJsCallStatusAtom);

function createTelnyxRTCClient(
  options: IClientOptionsDemo,
  region: string,
  host: string,
  TelnyxRTCClass: typeof TelnyxRTC
) {
  if (!hasValidCredentials(options)) {
    return null;
  }

  return new TelnyxRTCClass({
    ...options,
    // @ts-expect-error internal option
    host,
    region: region !== "auto" ? region : undefined,
  });
}

function createSimpleUserClient(options: ISimpleUserClientOptions) {
  if (!hasValidSimpleUserCredentials(options)) {
    return null;
  }

  const remoteAudioElement =
    typeof document !== "undefined"
      ? (document.getElementById(
          options.remoteAudioElementId
        ) as HTMLAudioElement | null)
      : null;

  const wsServers = splitCommaSeparatedList(options.wsServers);

  return new TelnyxDevice({
    host: options.host,
    port: options.port,
    wsServers:
      wsServers.length === 0
        ? undefined
        : wsServers.length === 1
          ? wsServers[0]
          : wsServers,
    username: options.username,
    password: options.password,
    displayName: options.displayName,
    registrarServer: options.registrarServer,
    stunServers:
      options.stunServers && options.stunServers.length > 0
        ? options.stunServers
        : undefined,
    turnServers: options.turnServer?.urls
      ? [
          {
            urls: options.turnServer.urls,
            username: options.turnServer.username,
            password: options.turnServer.password,
          },
        ]
      : undefined,
    logLevel: options.logLevel,
    remoteAudioElement: remoteAudioElement ?? undefined,
  });
}

function hasValidCredentials(options: IClientOptionsDemo) {
  const validCredentials = !!options.login && !!options.password;
  const validLoginToken = !!options.login_token;
  const validAnonymousLoginOptions =
    options.anonymous_login &&
    !!options.anonymous_login.target_id &&
    options.anonymous_login.target_type === "ai_assistant";

  return validCredentials || validLoginToken || validAnonymousLoginOptions;
}

function hasValidSimpleUserCredentials(options: ISimpleUserClientOptions) {
  return Boolean(
    options.host &&
      options.port &&
      options.username &&
      options.password &&
      options.wsServers
  );
}

function splitCommaSeparatedList(value: string) {
  return value
    .split(/[\s,]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}
