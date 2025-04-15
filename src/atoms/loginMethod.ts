import { useAtom } from "jotai";
import { atomWithStorage } from "jotai/utils";

export type LoginMethod = "credentials" | "token" | "anonymous";

const loginMethodAtom = atomWithStorage<LoginMethod>(
  "telnyx-login-method",
  "credentials"
);

export const useLoginMethod = () => useAtom(loginMethodAtom);
