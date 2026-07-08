import { atom, useAtom } from 'jotai';

/**
 * Maps callId -> allocated remoteElement id (e.g. `shared_3`).
 *
 * Set when a call is created (`newCall`) or answered (`answer`), so
 * `PerCallRemoteAudio` can render the matching `<audio id=…>` element the SDK
 * attaches each call's remote stream to. Entries for ended calls are pruned by
 * `PerCallRemoteAudio` (which cross-references active calls).
 */
export const remoteElementsAtom = atom<Record<string, string>>({});

export const useRemoteElements = () => useAtom(remoteElementsAtom);
