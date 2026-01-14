import { atom, useAtom } from 'jotai';
import type { TelnyxCall } from '@telnyx/rtc-sipjs-simple-user/dist/types/lib/telnyx-call';

export interface ISipJsCallNotification {
  call: TelnyxCall | null;
  direction: 'inbound' | 'outbound' | null;
}

export const sipJsCallNotificationAtom = atom<ISipJsCallNotification>({
  call: null,
  direction: null,
});

export const useSipJsCallNotification = () =>
  useAtom(sipJsCallNotificationAtom);

export type OutgoingCallHandler = (call: TelnyxCall) => void;

export const outgoingCallHandlerAtom = atom<OutgoingCallHandler | null>(null);

export const useOutgoingCallHandler = () => useAtom(outgoingCallHandlerAtom);
