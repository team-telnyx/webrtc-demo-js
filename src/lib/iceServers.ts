import { IS_DEV_ENV } from './vite';
import { IClientOptionsDemo, IceServersMode, TurnServer } from './types';

// Mirrors @telnyx/webrtc defaults from
// packages/js/src/Modules/Verto/util/constants/index.ts.
const GOOGLE_STUN_SERVER: RTCIceServer = {
  urls: 'stun:stun.l.google.com:19302',
};
const STUN_SERVER: RTCIceServer = { urls: 'stun:stun.telnyx.com:3478' };
const STUN_DEV_SERVER: RTCIceServer = { urls: 'stun:stundev.telnyx.com:3478' };
const TURN_SERVER: RTCIceServer[] = [
  {
    urls: 'turn:turn.telnyx.com:3478?transport=udp',
    username: 'testuser',
    credential: 'testpassword',
  },
  {
    urls: 'turn:turn.telnyx.com:3478?transport=tcp',
    username: 'testuser',
    credential: 'testpassword',
  },
  {
    urls: 'turns:turn.telnyx.com:443',
    username: 'testuser',
    credential: 'testpassword',
  },
];
const TURN_DEV_SERVER: RTCIceServer[] = [
  {
    urls: 'turn:turndev.telnyx.com:3478?transport=udp',
    username: 'testuser',
    credential: 'testpassword',
  },
  {
    urls: 'turn:turndev.telnyx.com:3478?transport=tcp',
    username: 'testuser',
    credential: 'testpassword',
  },
  {
    urls: 'turns:turndev.telnyx.com:443',
    username: 'testuser',
    credential: 'testpassword',
  },
];

export const DEFAULT_PROD_ICE_SERVERS: RTCIceServer[] = [
  STUN_SERVER,
  GOOGLE_STUN_SERVER,
  ...TURN_SERVER,
];

export const DEFAULT_DEV_ICE_SERVERS: RTCIceServer[] = [
  STUN_DEV_SERVER,
  GOOGLE_STUN_SERVER,
  ...TURN_DEV_SERVER,
];

// Mirrors regionalTurnUrl in @telnyx/webrtc 2.28.0. Only the plain TURN names
// (UDP/TCP 3478) have regional variants: turn.telnyx.com and
// turndev.telnyx.com become <region>.turn.telnyx.com and
// <region>.turndev.telnyx.com. TURNS/443 keeps the flat name because the
// regional names aren't on its TLS certificate, and STUN is left alone.
const REGIONAL_TURN_HOST = /^(turn:)turn(dev)?\.telnyx\.com(?=[:/?]|$)/;

export const regionalTurnUrl = (url: string, region: string): string =>
  url.replace(REGIONAL_TURN_HOST, `$1${region}.turn$2.telnyx.com`);

// The header's region select stores 'auto' for automatic routing, which the
// SDK gets as no region at all.
export const getPinnedRegion = (region?: string | null): string | undefined =>
  region && region !== 'auto' ? region : undefined;

// The defaults the SDK uses for this environment and region. With a region
// pinned, the plain TURN entries point at that region's TURN host.
export const getDefaultIceServers = (
  region?: string | null,
  isDev = IS_DEV_ENV,
): RTCIceServer[] => {
  const defaults = isDev ? DEFAULT_DEV_ICE_SERVERS : DEFAULT_PROD_ICE_SERVERS;
  const pinnedRegion = getPinnedRegion(region);

  if (!pinnedRegion) {
    return defaults;
  }

  return defaults.map((server) => ({
    ...server,
    urls: Array.isArray(server.urls)
      ? server.urls.map((url) => regionalTurnUrl(url, pinnedRegion))
      : regionalTurnUrl(server.urls, pinnedRegion),
  }));
};

const normalizeStunServers = (
  stunServers: IClientOptionsDemo['stunServers'],
): RTCIceServer[] =>
  (stunServers ?? [])
    .map((value) => value.trim())
    .filter(Boolean)
    .map((value) => ({ urls: value }));

const normalizeTurnServer = (turnServer?: TurnServer): RTCIceServer[] => {
  const urls = turnServer?.urls?.trim();

  if (!urls) {
    return [];
  }

  return [
    {
      urls,
      username: turnServer?.username?.trim() || undefined,
      credential: turnServer?.password || undefined,
    },
  ];
};

export const getCustomIceServers = (
  stunServers: IClientOptionsDemo['stunServers'],
  turnServers: IClientOptionsDemo['turnServers'],
): RTCIceServer[] => [
  ...normalizeStunServers(stunServers),
  ...normalizeTurnServer(turnServers),
];

const iceServerKey = (server: RTCIceServer) =>
  JSON.stringify({
    urls: Array.isArray(server.urls) ? server.urls : [server.urls],
    username: server.username ?? '',
    credential: server.credential ?? '',
  });

export const dedupeIceServers = (
  iceServers: RTCIceServer[],
): RTCIceServer[] => {
  const seen = new Set<string>();

  return iceServers.filter((server) => {
    const key = iceServerKey(server);

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
};

export const configureIceServers = (
  stunServers: IClientOptionsDemo['stunServers'],
  turnServers: IClientOptionsDemo['turnServers'],
  mode: IceServersMode = 'merge',
  region?: string | null,
): IClientOptionsDemo['iceServers'] => {
  const customIceServers = getCustomIceServers(stunServers, turnServers);

  if (customIceServers.length === 0) {
    // Let the SDK apply its environment-specific defaults internally.
    return undefined;
  }

  if (mode === 'replace') {
    return customIceServers;
  }

  return dedupeIceServers([
    ...getDefaultIceServers(region),
    ...customIceServers,
  ]);
};

export const getDisplayedIceServers = (
  stunServers: IClientOptionsDemo['stunServers'],
  turnServers: IClientOptionsDemo['turnServers'],
  mode: IceServersMode = 'merge',
  region?: string | null,
): RTCIceServer[] => {
  const customIceServers = getCustomIceServers(stunServers, turnServers);

  if (customIceServers.length === 0) {
    return getDefaultIceServers(region);
  }

  return mode === 'replace'
    ? customIceServers
    : dedupeIceServers([...getDefaultIceServers(region), ...customIceServers]);
};
