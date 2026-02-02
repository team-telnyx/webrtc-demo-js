/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_RTC_HOST: string;
  readonly VITE_SIP_HOST: string;
  /** Set to 'development' to use rtcdev.telnyx.com instead of rtc.telnyx.com */
  readonly VITE_RTC_ENV?: 'development' | 'production';
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
