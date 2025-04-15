/* eslint-disable @typescript-eslint/no-explicit-any */
import { atom, useAtom } from "jotai";
import { IClientOptions, TelnyxRTC } from "@telnyx/webrtc";
import { clientOptionsAtom } from "./clientOptions";
import { hostAtom } from "./host";
import { regionAtom } from "./region";

type TelnyxRTCVersion = {
  version: string;
  Class: typeof TelnyxRTC;
};
const telnyxRTCVersionAtom = atom<TelnyxRTCVersion>({
  version: "latest",
  Class: TelnyxRTC,
});

const connectionStatusAtom = atom<string>("disconnected");

function hasValidCredentials(options: IClientOptions) {
  const validCredentials = !!options.login && !!options.password;
  const validLoginToken = !!options.login_token;
  const validAnonymousLoginOptions =
    options.anonymous_login &&
    !!options.anonymous_login.target_id &&
    options.anonymous_login.target_type === "ai_assistant";

  return validCredentials || validLoginToken || validAnonymousLoginOptions;
}
const clientAtom = atom<TelnyxRTC | null>((get) => {
  const clientOptions = get(clientOptionsAtom);
  const region = get(regionAtom);
  const host = get(hostAtom);

  const { Class: TelnyxRTCClass } = get(telnyxRTCVersionAtom);
  if (!hasValidCredentials(clientOptions)) {
    return null;
  }

  return new TelnyxRTCClass({
    ...clientOptions,
    host,
    region: region !== "auto" ? region : undefined,
  } as any);
});

export const useTelnyxClient = () => useAtom(clientAtom);
export const useConnectionStatus = () => useAtom(connectionStatusAtom);
export const useTelnyxSDKVersion = () => useAtom(telnyxRTCVersionAtom);
