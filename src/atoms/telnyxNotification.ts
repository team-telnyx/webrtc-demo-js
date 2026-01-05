import { INotification } from '@telnyx/webrtc';
import { atom, useAtom } from 'jotai';

export const telnyxNotificationAtom = atom<INotification | null>(null);
export const useTelnyxNotification = () => useAtom(telnyxNotificationAtom);
