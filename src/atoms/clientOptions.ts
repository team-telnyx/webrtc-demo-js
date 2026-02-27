import { IClientOptionsDemo } from '@/lib/types';
import { useAtom } from 'jotai';
import { atomWithStorage, createJSONStorage } from 'jotai/utils';

const clientOptionsDefault: IClientOptionsDemo = {
  debug: false,
  debugOutput: 'socket',
  login: '',
  password: '',
  login_token: '',
  prefetchIceCandidates: false,
  forceRelayCandidate: false,
  trickleIce: false,
  keepConnectionAliveOnSocketClose: false,
  useCanaryRtcServer: false,
  mutedMicOnStart: false,
  enableCallReports: true,
};

/**
 * Custom storage that merges stored values with the current defaults.
 * This ensures newly added fields (e.g. enableCallReports) are picked up
 * by existing users who already have a saved value in localStorage.
 */
const mergingStorage = createJSONStorage<IClientOptionsDemo>(() => localStorage, {
  reviver: (_key, value) => value,
});
const originalGetItem = mergingStorage.getItem.bind(mergingStorage);
mergingStorage.getItem = (key, defaultValue) => {
  const stored = originalGetItem(key, defaultValue);
  if (stored === defaultValue) return defaultValue;
  return { ...clientOptionsDefault, ...(stored as IClientOptionsDemo) };
};

const profilesAtom = atomWithStorage<IClientOptionsDemo[]>(
  'telnyx_client_profiles',
  [],
);

export const clientOptionsAtom = atomWithStorage<IClientOptionsDemo>(
  'telnyx_client_options',
  clientOptionsDefault,
  mergingStorage,
);

export const useClientOptions = () => useAtom(clientOptionsAtom);
export const useClientProfiles = () => useAtom(profilesAtom);
