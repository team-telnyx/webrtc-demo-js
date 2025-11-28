
import { TelnyxDeviceConfig } from "@telnyx/rtc-sipjs-simple-user";
import { useAtom } from "jotai";
import { atomWithStorage } from "jotai/utils";

const sipHost = import.meta.env.VITE_SIP_HOST || "sip.telnyx.com";

const defaultSimpleUserOptions: TelnyxDeviceConfig = {
  host: sipHost,
  port: "7443",
  wsServers: `wss://${sipHost}:7443`,
  username: "",
  password: "",
  displayName: "Phone User",
  registrarServer: `sip:${sipHost}:7443`,
};

export const simpleUserClientOptionsAtom =
  atomWithStorage<TelnyxDeviceConfig>(
    "telnyx_simple_user_client_options",
    defaultSimpleUserOptions
  );

export const useSimpleUserClientOptions = () =>
  useAtom(simpleUserClientOptionsAtom);
