import { ISimpleUserCallOptions } from '@/lib/types';
import { useAtom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

const defaultCallOptions: ISimpleUserCallOptions = {
  destinationNumber: '',
  extraHeaders: [],
};

const simpleUserCallOptionsAtom = atomWithStorage<ISimpleUserCallOptions>(
  'telnyx_simple_user_call_options',
  defaultCallOptions,
);

export const useSimpleUserCallOptions = () =>
  useAtom(simpleUserCallOptionsAtom);
