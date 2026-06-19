import { Call } from '@telnyx/webrtc';
import { atom, useAtom } from 'jotai';

export type TelnyxCallsById = Record<string, Call>;

export const TERMINAL_CALL_STATES = ['hangup', 'destroy', 'purge'] as const;

export const telnyxCallsAtom = atom<TelnyxCallsById>({});
export const useTelnyxCalls = () => useAtom(telnyxCallsAtom);

export const isTerminalCallState = (state?: string) =>
  TERMINAL_CALL_STATES.includes(
    state?.toLowerCase() as (typeof TERMINAL_CALL_STATES)[number],
  );
