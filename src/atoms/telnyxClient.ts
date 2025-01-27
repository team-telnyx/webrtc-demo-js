/* eslint-disable @typescript-eslint/no-explicit-any */
import { atom, useAtom } from "jotai";
import { TelnyxRTC } from "@telnyx/webrtc";
import { clientOptionsAtom } from "./clientOptions";
import { environmentAtom } from "./environment";

type TelnyxRTCVersion = {
  version: string;
  Class: typeof TelnyxRTC;
};
const telnyxRTCVersionAtom = atom<TelnyxRTCVersion>({
  version: "latest",
  Class: TelnyxRTC,
});

const connectionStatusAtom = atom<string>("disconnected");

const clientAtom = atom<TelnyxRTC | null>((get) => {
  const environment = get(environmentAtom);
  const clientOptions = get(clientOptionsAtom);
  const { Class: TelnyxRTCClass } = get(telnyxRTCVersionAtom);

  if (!clientOptions.login || !clientOptions.password) {
    return null;
  }

  return new TelnyxRTCClass({ ...clientOptions, env: environment } as any);
});

export const useTelnyxClient = () => useAtom(clientAtom);
export const useConnectionStatus = () => useAtom(connectionStatusAtom);
export const useTelnyxSDKVersion = () => useAtom(telnyxRTCVersionAtom);
