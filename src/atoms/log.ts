import { atom, useAtom } from "jotai";
import { useCallback } from "react";
type LogItemType = {
  id: string;
  description: string;
};

const logAtom = atom<LogItemType[]>([]);

export const useLog = () => {
  const [logs, setLogs] = useAtom(logAtom);

  const pushLog = useCallback(
    (item: LogItemType) => {
      setLogs((prev) => [item, ...prev]);
    },
    [setLogs]
  );

  return { logs, pushLog };
};
