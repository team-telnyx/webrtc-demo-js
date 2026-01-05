import { atom, useAtom } from 'jotai';
const searchParams = new URLSearchParams(window.location.search);

const host = searchParams.get('host') ?? import.meta.env.VITE_RTC_HOST;
export const hostAtom = atom<string>(host);
export const useHost = () => useAtom(hostAtom);
