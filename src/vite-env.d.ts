/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_RTC_HOST: string;
  readonly VITE_SIP_HOST: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
