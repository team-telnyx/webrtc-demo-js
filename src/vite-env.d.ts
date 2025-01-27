/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_RTC_HOST: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
