import { atom, useAtom } from 'jotai';
import { TelnyxRTC } from '@telnyx/webrtc';
import {
  TelnyxDevice,
  TelnyxDeviceConfig,
} from '@telnyx/rtc-sipjs-simple-user';
import { clientOptionsAtom } from './clientOptions';
import { hostAtom } from './host';
import { regionAtom } from './region';
import { IClientOptionsDemo } from '@/lib/types';
import { clientModeAtom } from './clientMode';
import { simpleUserClientOptionsAtom } from './simpleUserClientOptions';
import { splitCommaSeparatedList } from '@/lib/string';
import { IS_DEV_ENV } from '@/lib/vite';
import { ExtendedTelnyxDeviceConfig } from './simpleUserClientOptions';

// Declare global type for Telnyx inbound aliases
declare global {
  // eslint-disable-next-line no-var
  var __TELNYX_INBOUND_ALIASES__: string[] | undefined;
}

type TelnyxRTCVersion = {
  version: string;
  Class: typeof TelnyxRTC;
};

type TelnyxClientInstance = TelnyxRTC | TelnyxDevice;

const telnyxRTCVersionAtom = atom<TelnyxRTCVersion>({
  version: 'latest',
  Class: TelnyxRTC,
});

const connectionStatusAtom = atom<string>('disconnected');

// SIP.js Simple User status atoms
export type WsStatus = 'idle' | 'connecting' | 'connected' | 'disconnected';
export type RegistrationStatus =
  | 'idle'
  | 'unregistered'
  | 'registering'
  | 'registered';
export type CallStatus =
  | 'idle'
  | 'incoming'
  | 'dialing'
  | 'connecting'
  | 'connected'
  | 'ended'
  | 'failed';

const sipJsWsStatusAtom = atom<WsStatus>('idle');
const sipJsRegistrationStatusAtom = atom<RegistrationStatus>('idle');
const sipJsCallStatusAtom = atom<CallStatus>('idle');

const clientAtom = atom<TelnyxClientInstance | null>((get) => {
  const mode = get(clientModeAtom);
  if (mode === 'sipjs') {
    const sipJsOptions = get(simpleUserClientOptionsAtom);
    return createSimpleUserClient(sipJsOptions as ExtendedTelnyxDeviceConfig);
  }

  const clientOptions = get(clientOptionsAtom);
  const region = get(regionAtom);
  const host = get(hostAtom);
  const { Class: TelnyxRTCClass } = get(telnyxRTCVersionAtom);

  return createTelnyxRTCClient(clientOptions, region, host, TelnyxRTCClass);
});

const telnyxRtcClientAtom = atom<TelnyxRTC | null>((get) => {
  const mode = get(clientModeAtom);
  if (mode === 'sipjs') {
    return null;
  }
  const client = get(clientAtom);

  // Since we load TelnyxRTC dynamically, when change version, we can't rely on instanceof here. So we perform additional checks.
  return ensureClientIsTelnyxRTC(client) ? client : null;
});

const telnyxSipJsClientAtom = atom<TelnyxDevice | null>((get) => {
  const mode = get(clientModeAtom);
  if (mode !== 'sipjs') {
    return null;
  }
  const client = get(clientAtom);
  return client instanceof TelnyxDevice ? client : null;
});

export const useTelnyxClient = () => useAtom(clientAtom);
export const useTelnyxSdkClient = () => useAtom(telnyxRtcClientAtom);
export const useSipJsClient = () => useAtom(telnyxSipJsClientAtom);
export const useConnectionStatus = () => useAtom(connectionStatusAtom);
export const useTelnyxSDKVersion = () => useAtom(telnyxRTCVersionAtom);

// SIP.js Simple User status hooks
export const useSipJsWsStatus = () => useAtom(sipJsWsStatusAtom);
export const useSipJsRegistrationStatus = () =>
  useAtom(sipJsRegistrationStatusAtom);
export const useSipJsCallStatus = () => useAtom(sipJsCallStatusAtom);

function createTelnyxRTCClient(
  options: IClientOptionsDemo,
  region: string,
  host: string,
  TelnyxRTCClass: typeof TelnyxRTC,
) {
  if (!hasValidCredentials(options)) {
    return null;
  }

  return new TelnyxRTCClass({
    ...options,
    // @ts-expect-error internal option
    host,
    region: region !== 'auto' ? region : undefined,

    // We can not set iceServers explicitly here, because WebRTC SDK use Telnyx STUN/TURN servers internally based on environment
    env: IS_DEV_ENV ? 'development' : 'production',
  });
}

function createSimpleUserClient(options: ExtendedTelnyxDeviceConfig) {
  if (!hasValidSimpleUserCredentials(options)) {
    return null;
  }

  const wsServers = splitCommaSeparatedList(
    options.wsServers?.toString() || '',
  );

  // CRITICAL: Set alias BEFORE creating TelnyxDevice
  // The library checks this in user-agent-core.js receiveRequest() at runtime
  // Must be set on globalThis so the library bundle can access it
  const aliases: string[] = [];
  
  // HARDCODE the phone number that receives calls
  aliases.push('14843068733');
  
  // Also add from config if provided
  if (options.inboundAliases && Array.isArray(options.inboundAliases)) {
    aliases.push(...options.inboundAliases.filter((a): a is string => typeof a === 'string' && a.length > 0));
  }
  
  // Remove duplicates
  const uniqueAliases = Array.from(new Set(aliases));
  
  // Set on globalThis using direct property assignment (not type assertion)
  // This ensures it's actually set and accessible from the library bundle
  try {
    Object.defineProperty(globalThis, '__TELNYX_INBOUND_ALIASES__', {
      value: uniqueAliases,
      writable: true,
      configurable: true,
      enumerable: true,
    });
    if (typeof window !== 'undefined') {
      Object.defineProperty(window, '__TELNYX_INBOUND_ALIASES__', {
        value: uniqueAliases,
        writable: true,
        configurable: true,
        enumerable: true,
      });
    }
    console.log('[TelnyxDevice] ✓✓✓ ALIAS SET BEFORE DEVICE CREATION:', uniqueAliases);
    console.log('[TelnyxDevice] Verification:', {
      globalThis: (globalThis as any).__TELNYX_INBOUND_ALIASES__,
      window: typeof window !== 'undefined' ? (window as any).__TELNYX_INBOUND_ALIASES__ : 'N/A',
      isArray: Array.isArray((globalThis as any).__TELNYX_INBOUND_ALIASES__),
    });
  } catch (e) {
    // Fallback to direct assignment
    (globalThis as any).__TELNYX_INBOUND_ALIASES__ = uniqueAliases;
    if (typeof window !== 'undefined') {
      (window as any).__TELNYX_INBOUND_ALIASES__ = uniqueAliases;
    }
    console.log('[TelnyxDevice] ✓✓✓ ALIAS SET (fallback):', uniqueAliases);
  }

  return new TelnyxDevice({
    host: options.host,
    port: options.port,
    wsServers:
      wsServers.length === 0
        ? undefined
        : wsServers.length === 1
          ? wsServers[0]
          : wsServers,
    username: options.username,
    password: options.password,
    displayName: options.displayName,
    registrarServer: options.registrarServer,
    stunServers:
      options.stunServers && options.stunServers.length > 0
        ? options.stunServers
        : undefined,
    turnServers: options.turnServers ? options.turnServers : undefined,
    remoteAudioElement: options.remoteAudioElement ?? undefined,
  });
}

function hasValidCredentials(options: IClientOptionsDemo) {
  const validCredentials = !!options.login && !!options.password;
  const validLoginToken = !!options.login_token;
  const validAnonymousLoginOptions =
    options.anonymous_login &&
    !!options.anonymous_login.target_id &&
    options.anonymous_login.target_type === 'ai_assistant';

  return validCredentials || validLoginToken || validAnonymousLoginOptions;
}

function hasValidSimpleUserCredentials(options: TelnyxDeviceConfig) {
  return Boolean(
    options.host &&
    options.port &&
    options.username &&
    options.password &&
    options.wsServers,
  );
}

const ensureClientIsTelnyxRTC = (
  client: TelnyxClientInstance | null,
): client is TelnyxRTC => {
  const assumeClientIsTelnyxRTC = client as TelnyxRTC;
  if (!assumeClientIsTelnyxRTC) {
    return false;
  }

  // Check for unique properties/methods of TelnyxRTC to confirm type. The list may be expanded as needed.
  const hasConnectMethod =
    typeof assumeClientIsTelnyxRTC?.connect === 'function';
  const hasNewCallMethod =
    typeof assumeClientIsTelnyxRTC?.newCall === 'function';
  const hasOptionsProperty =
    typeof assumeClientIsTelnyxRTC?.options === 'object';

  return hasConnectMethod && hasNewCallMethod && hasOptionsProperty;
};
