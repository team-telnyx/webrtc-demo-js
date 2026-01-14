import { useAtom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

export type ClientMode = 'sdk' | 'sipjs' | 'aiagent';

export const clientModeAtom = atomWithStorage<ClientMode>(
  'telnyx_client_mode',
  'sdk',
);

export const useClientMode = () => useAtom(clientModeAtom);
