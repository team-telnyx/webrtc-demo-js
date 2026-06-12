import { atom, useAtom } from 'jotai';
import { useCallback } from 'react';
type LogItemType = {
  id: string;
  description: string;
};

type StoredLogItemType = LogItemType & {
  key: string;
};

let logSequence = 0;

const logAtom = atom<StoredLogItemType[]>([]);

export const useLog = () => {
  const [logs, setLogs] = useAtom(logAtom);

  const pushLog = useCallback(
    (item: LogItemType) => {
      setLogs((prev) => [
        { ...item, key: `${item.id}-${logSequence++}` },
        ...prev,
      ]);
    },
    [setLogs],
  );

  const clear = useCallback(() => setLogs([]), [setLogs]);
  return { logs, pushLog, clear } as const;
};
