import { Region } from '@telnyx/webrtc';
import { describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_DEV_ICE_SERVERS,
  DEFAULT_PROD_ICE_SERVERS,
  configureIceServers,
  getDefaultIceServers,
  getDisplayedIceServers,
  regionalTurnUrl,
} from './iceServers';

// Pin the environment so the helpers that default to it use the prod list.
vi.mock('./vite', () => ({ IS_DEV_ENV: false }));

const regions = Object.values(Region);

const urlsOf = (servers: RTCIceServer[] | undefined) =>
  (servers ?? []).map((server) => server.urls);

const customStun = 'stun:stun.example.com:3478';
const customTurn = {
  urls: 'turn:turn.example.com:3478?transport=udp',
  username: 'user',
  password: 'secret',
};
const customServers = [
  { urls: customStun },
  {
    urls: customTurn.urls,
    username: customTurn.username,
    credential: customTurn.password,
  },
];

describe('regionalTurnUrl', () => {
  it.each([
    [
      'turn:turn.telnyx.com:3478?transport=udp',
      'turn:eu.turn.telnyx.com:3478?transport=udp',
    ],
    [
      'turn:turn.telnyx.com:3478?transport=tcp',
      'turn:eu.turn.telnyx.com:3478?transport=tcp',
    ],
    [
      'turn:turndev.telnyx.com:3478?transport=udp',
      'turn:eu.turndev.telnyx.com:3478?transport=udp',
    ],
  ])('rewrites %s', (url, expected) => {
    expect(regionalTurnUrl(url, 'eu')).toBe(expected);
  });

  it.each([
    'stun:stun.telnyx.com:3478',
    'stun:stundev.telnyx.com:3478',
    'stun:stun.l.google.com:19302',
    // TURNS stays on the flat name: the TURN certificate only covers it.
    'turns:turn.telnyx.com:443',
    'turns:turndev.telnyx.com:443',
    'turns:turn2.telnyx.com:443',
    'turn:turn.example.com:3478',
    'turn:turn.telnyx.company.com:3478',
  ])('leaves %s unchanged', (url) => {
    expect(regionalTurnUrl(url, 'eu')).toBe(url);
  });
});

describe('getDefaultIceServers', () => {
  it.each([undefined, null, '', 'auto'])(
    'returns the environment defaults for region %j',
    (region) => {
      expect(getDefaultIceServers(region)).toBe(DEFAULT_PROD_ICE_SERVERS);
      expect(getDefaultIceServers(region, false)).toBe(
        DEFAULT_PROD_ICE_SERVERS,
      );
      expect(getDefaultIceServers(region, true)).toBe(DEFAULT_DEV_ICE_SERVERS);
    },
  );

  it.each(regions)('regionalizes only prod TURN UDP/TCP for %s', (region) => {
    expect(urlsOf(getDefaultIceServers(region, false))).toEqual([
      'stun:stun.telnyx.com:3478',
      'stun:stun.l.google.com:19302',
      `turn:${region}.turn.telnyx.com:3478?transport=udp`,
      `turn:${region}.turn.telnyx.com:3478?transport=tcp`,
      'turns:turn.telnyx.com:443',
    ]);
  });

  it.each(regions)('regionalizes only dev TURN UDP/TCP for %s', (region) => {
    expect(urlsOf(getDefaultIceServers(region, true))).toEqual([
      'stun:stundev.telnyx.com:3478',
      'stun:stun.l.google.com:19302',
      `turn:${region}.turndev.telnyx.com:3478?transport=udp`,
      `turn:${region}.turndev.telnyx.com:3478?transport=tcp`,
      'turns:turndev.telnyx.com:443',
    ]);
  });

  it('keeps TURN credentials and does not mutate the defaults', () => {
    const before = JSON.stringify(DEFAULT_PROD_ICE_SERVERS);
    const [, , udp, , turns] = getDefaultIceServers('apac', false);

    expect(udp).toEqual({
      urls: 'turn:apac.turn.telnyx.com:3478?transport=udp',
      username: 'testuser',
      credential: 'testpassword',
    });
    expect(turns).toEqual({
      urls: 'turns:turn.telnyx.com:443',
      username: 'testuser',
      credential: 'testpassword',
    });
    expect(JSON.stringify(DEFAULT_PROD_ICE_SERVERS)).toBe(before);
  });
});

describe('configureIceServers', () => {
  it('leaves the defaults to the SDK when no custom servers are set', () => {
    expect(configureIceServers([], {}, 'merge', 'eu')).toBeUndefined();
    expect(configureIceServers(undefined, undefined)).toBeUndefined();
  });

  it('merges the regional defaults with custom servers', () => {
    expect(
      configureIceServers([customStun], customTurn, 'merge', 'eu'),
    ).toEqual([...getDefaultIceServers('eu'), ...customServers]);
    expect(
      urlsOf(configureIceServers([customStun], customTurn, 'merge', 'eu')),
    ).toEqual([
      'stun:stun.telnyx.com:3478',
      'stun:stun.l.google.com:19302',
      'turn:eu.turn.telnyx.com:3478?transport=udp',
      'turn:eu.turn.telnyx.com:3478?transport=tcp',
      'turns:turn.telnyx.com:443',
      customStun,
      customTurn.urls,
    ]);
  });

  it('merges the flat defaults when no region is pinned', () => {
    for (const region of [undefined, 'auto']) {
      expect(
        configureIceServers([customStun], customTurn, 'merge', region),
      ).toEqual([...DEFAULT_PROD_ICE_SERVERS, ...customServers]);
    }
  });

  it('passes custom servers as given, even on the Telnyx TURN host', () => {
    const telnyxTurn = {
      urls: 'turn:turn.telnyx.com:3478?transport=udp',
      username: 'mine',
      password: 'mine',
    };

    expect(configureIceServers([], telnyxTurn, 'merge', 'eu')).toContainEqual({
      urls: telnyxTurn.urls,
      username: 'mine',
      credential: 'mine',
    });
    expect(configureIceServers([], telnyxTurn, 'replace', 'eu')).toEqual([
      { urls: telnyxTurn.urls, username: 'mine', credential: 'mine' },
    ]);
  });

  it('ignores the region in replace mode', () => {
    expect(
      configureIceServers([customStun], customTurn, 'replace', 'eu'),
    ).toEqual(customServers);
  });
});

describe('getDisplayedIceServers', () => {
  it('shows the regional defaults when no custom servers are set', () => {
    expect(getDisplayedIceServers([], {}, 'merge', 'us-east')).toEqual(
      getDefaultIceServers('us-east', false),
    );
    expect(getDisplayedIceServers([], {}, 'merge', 'auto')).toBe(
      DEFAULT_PROD_ICE_SERVERS,
    );
  });

  it('shows the same list the client gets', () => {
    for (const mode of ['merge', 'replace'] as const) {
      expect(
        getDisplayedIceServers([customStun], customTurn, mode, 'us-east'),
      ).toEqual(configureIceServers([customStun], customTurn, mode, 'us-east'));
    }
  });
});
