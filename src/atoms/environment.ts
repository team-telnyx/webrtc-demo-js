import { useAtom } from "jotai";
import { atomWithStorage } from "jotai/utils";

export enum Environment {
  Production = "production",
  Development = "development",
}

export const environmentAtom = atomWithStorage(
  "environment",
  Environment.Development
);

export const useEnvironment = () => useAtom(environmentAtom);
