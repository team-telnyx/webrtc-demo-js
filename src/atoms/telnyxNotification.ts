import { atom, useAtom } from "jotai";
import { Call } from "@telnyx/webrtc/lib/src/Modules/Verto/webrtc/Call";

export type NotificationType = {
  type: "callUpdate";
  call: Call;
};

export const telnyxNotificationAtom = atom<NotificationType | null>(null);
export const useTelnyxNotification = () => useAtom(telnyxNotificationAtom);
