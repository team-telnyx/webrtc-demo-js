import { ITelnyxError } from '@telnyx/webrtc';
import { atom, useAtom } from 'jotai';

export type MediaRecoveryState = {
  callId: string;
  error: ITelnyxError;
  retryDeadline: number;
  resume: () => void;
  reject: () => void;
  status: 'waiting' | 'retrying';
};

const mediaRecoveryAtom = atom<MediaRecoveryState | null>(null);

export const useMediaRecovery = () => useAtom(mediaRecoveryAtom);
