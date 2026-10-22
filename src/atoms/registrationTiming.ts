import { atom, useAtom } from 'jotai';
import { RegistrationTimingSummary } from '@/lib/registrationTiming';

/** Initial registration summary of the current client, null until telnyx.ready. */
const registrationTimingAtom = atom<RegistrationTimingSummary | null>(null);

export const useRegistrationTiming = () => useAtom(registrationTimingAtom);
