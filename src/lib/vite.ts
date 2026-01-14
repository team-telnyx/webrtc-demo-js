// To understand how modes and NODE_ENV work in Vite, see https://vite.dev/guide/env-and-mode#node-env-and-modes
export const IS_DEV_MODE = import.meta.env.MODE === 'development';
export const IS_PROD_MODE = import.meta.env.MODE === 'production';
export const IS_DEV_ENV = import.meta.env.DEV;
export const IS_PROD_ENV = import.meta.env.PROD;
