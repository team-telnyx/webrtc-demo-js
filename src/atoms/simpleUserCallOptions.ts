import { atomWithMergingStorage } from '@/lib/atomWithMergingStorage';
import { ISimpleUserCallOptions } from '@/lib/types';
import { useAtom } from 'jotai';

const defaultCallOptions: ISimpleUserCallOptions = {
  destinationNumber: '',
  extraHeaders: [],
};

const simpleUserCallOptionsAtom = atomWithMergingStorage<ISimpleUserCallOptions>(
  'telnyx_simple_user_call_options',
  defaultCallOptions,
);

export const useSimpleUserCallOptions = () =>
  useAtom(simpleUserCallOptionsAtom);
