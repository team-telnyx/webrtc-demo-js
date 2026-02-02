// To understand how modes and NODE_ENV work in Vite, see https://vite.dev/guide/env-and-mode#node-env-and-modes
export const IS_DEV_MODE = import.meta.env.MODE === 'development';
export const IS_PROD_MODE = import.meta.env.MODE === 'production';

// Check if running on webrtcdev.telnyx.com to use development RTC endpoint
const isDevHost = typeof window !== 'undefined' && window.location.hostname === 'webrtcdev.telnyx.com';
export const IS_DEV_ENV = import.meta.env.DEV || isDevHost;
export const IS_PROD_ENV = import.meta.env.PROD && !isDevHost;
