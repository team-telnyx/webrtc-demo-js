
import { IClientOptionsDemo } from "@/lib/types";
import { useAtom } from "jotai";
import { atomWithStorage } from "jotai/utils";

const profilesAtom = atomWithStorage<IClientOptionsDemo[]>(
  "telnyx_client_profiles",
  []
);

export const clientOptionsAtom = atomWithStorage<IClientOptionsDemo>(
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
