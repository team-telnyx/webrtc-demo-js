// To understand how modes and NODE_ENV work in Vite, see https://vite.dev/guide/env-and-mode#node-env-and-modes
export const IS_DEV_MODE = import.meta.env.MODE === 'development';
export const IS_PROD_MODE = import.meta.env.MODE === 'production';

// VITE_RTC_ENV can be set to 'development' to use rtcdev.telnyx.com
// Set this env var when building for webrtcdev.telnyx.com
export const IS_DEV_ENV = import.meta.env.DEV || import.meta.env.VITE_RTC_ENV === 'development';
export const IS_PROD_ENV = import.meta.env.PROD;
