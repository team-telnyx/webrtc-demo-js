import { atom, useAtom } from 'jotai';
import { PingSample } from '@/lib/signalingPing';

/** Newest first; filled by SignalingPing from the WebSocket probe. */
const signalingPingSamplesAtom = atom<PingSample[]>([]);

export const useSignalingPingSamples = () => useAtom(signalingPingSamplesAtom);
