/* eslint-disable @typescript-eslint/no-explicit-any */
import { atom, useAtom } from "jotai";
import { IClientOptions, TelnyxRTC } from "@telnyx/webrtc";
import { clientOptionsAtom } from "./clientOptions";
import { hostAtom } from "./host";

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

  return validCredentials || validLoginToken;
}
const clientAtom = atom<TelnyxRTC | null>((get) => {
  const clientOptions = get(clientOptionsAtom);
  const { Class: TelnyxRTCClass } = get(telnyxRTCVersionAtom);
  const host = get(hostAtom);
  if (!hasValidCredentials(clientOptions)) {
    return null;
  }

  return new TelnyxRTCClass({
    ...clientOptions,
    host,
  } as any);
});

export const useTelnyxClient = () => useAtom(clientAtom);
export const useConnectionStatus = () => useAtom(connectionStatusAtom);
export const useTelnyxSDKVersion = () => useAtom(telnyxRTCVersionAtom);
