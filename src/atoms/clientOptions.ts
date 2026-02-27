import { atomWithMergingStorage } from '@/lib/atomWithMergingStorage';
import { IClientOptionsDemo } from '@/lib/types';
import { useAtom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

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

const profilesAtom = atomWithStorage<IClientOptionsDemo[]>(
  'telnyx_client_profiles',
  [],
);

export const clientOptionsAtom = atomWithMergingStorage<IClientOptionsDemo>(
  'telnyx_client_options',
  clientOptionsDefault,
);

export const useClientOptions = () => useAtom(clientOptionsAtom);
export const useClientProfiles = () => useAtom(profilesAtom);
