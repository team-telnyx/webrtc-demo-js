import { atomWithStorage, createJSONStorage } from 'jotai/utils';

/**
 * Drop-in replacement for atomWithStorage for object-shaped atoms.
 *
 * atomWithStorage only uses its defaultValue when localStorage has no entry
 * at all. Any stored object that was saved before a new field was added will
 * be missing that field, causing it to be undefined at runtime.
 *
 * This wrapper shallow-merges the stored value with defaultValue on every
 * read, so newly added fields always fall back to their defaults for existing
 * users — no migration code required.
 */
export function atomWithMergingStorage<T extends object>(
  key: string,
  defaultValue: T,
) {
  const storage = createJSONStorage<T>(() => localStorage);
  const originalGetItem = storage.getItem.bind(storage);

  storage.getItem = (k, fallback) => {
    const stored = originalGetItem(k, fallback);
    if (stored === fallback) return fallback;
    return { ...defaultValue, ...(stored as T) };
  };

  return atomWithStorage<T>(key, defaultValue, storage);
}
