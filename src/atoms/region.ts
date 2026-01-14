import { useAtom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

export const regionAtom = atomWithStorage('region', 'auto');
export const useRegion = () => useAtom(regionAtom);
