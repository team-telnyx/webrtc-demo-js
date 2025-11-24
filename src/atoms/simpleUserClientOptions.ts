import { ISimpleUserClientOptions } from "@/lib/types";
import { useAtom } from "jotai";
import { atomWithStorage } from "jotai/utils";

const sipHost = import.meta.env.VITE_SIP_HOST || "sip.telnyx.com";

const defaultSimpleUserOptions: ISimpleUserClientOptions = {
  host: sipHost,
  port: "7443",
  wsServers: `wss://${sipHost}:7443`,
  username: "",
  password: "",
  displayName: "Phone User",
  registrarServer: `sip:${sipHost}:7443`,
  logLevel: "error",
  remoteAudioElementId: "telnyx-simple-user-remote-audio",
};

export const simpleUserClientOptionsAtom =
  atomWithStorage<ISimpleUserClientOptions>(
    "telnyx_simple_user_client_options",
    defaultSimpleUserOptions
  );

export const useSimpleUserClientOptions = () =>
  useAtom(simpleUserClientOptionsAtom);
