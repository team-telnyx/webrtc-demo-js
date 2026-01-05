import { Call } from '@telnyx/webrtc';
import { useAtom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { useCallback } from 'react';

export type CallHistoryEntry = {
  id: string;
  destinationNumber: string;
  direction: 'inbound' | 'outbound';
};

const callHistoryAtom = atomWithStorage<CallHistoryEntry[]>(
  'telnyx_call_history',
  [],
);

export const useCallHistory = () => useAtom(callHistoryAtom);

export const useAddCallHistory = () => {
  const [, setHistory] = useCallHistory();

  return useCallback(
    (call: Call) => {
      setHistory((prev) => {
        const found = prev.find((i) => i.id === call.id);
        if (found) {
          return prev;
        }
        const destinationNumber =
          call.direction === 'inbound'
            ? call.options.remoteCallerNumber
            : call.options.destinationNumber;

        return [
          {
            id: call.id,
            destinationNumber: destinationNumber ?? '',
            direction: call.direction,
          },
          ...prev,
        ];
      });
    },
    [setHistory],
  );
};
