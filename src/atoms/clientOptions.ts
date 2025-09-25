import { IClientOptions } from "@telnyx/webrtc";
import { useAtom } from "jotai";
import { atomWithStorage } from "jotai/utils";

const profilesAtom = atomWithStorage<IClientOptions[]>(
  "telnyx_client_profiles",
  []
);

export const clientOptionsAtom = atomWithStorage<IClientOptions>(
  "telnyx_client_options",
  {
    debug: false,
    debugOutput: "socket",
    login: "",
    password: "",
    login_token: "",
    prefetchIceCandidates: false,
    forceRelayCandidate: false,
    trickleIce: false,
  }
);

export const useClientOptions = () => useAtom(clientOptionsAtom);
export const useClientProfiles = () => useAtom(profilesAtom);
