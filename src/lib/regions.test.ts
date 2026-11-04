import { describe, expect, it } from 'vitest';
import { Region } from '@telnyx/webrtc';
import { AUTO_REGION, REGION_OPTIONS, toSdkRegion } from './regions';

describe('REGION_OPTIONS', () => {
  it('starts with auto and lists every SDK region once', () => {
    expect(REGION_OPTIONS[0].value).toBe(AUTO_REGION);
    const values = REGION_OPTIONS.slice(1).map((o) => o.value);
    expect(new Set(values)).toEqual(new Set(Object.values(Region)));
    expect(values).toHaveLength(Object.values(Region).length);
  });

  it('offers the regions added in 2.28.x', () => {
    const values = REGION_OPTIONS.map((o) => o.value);
    expect(values).toEqual(expect.arrayContaining(['asia', 'in', 'me', 'au', 'sy']));
  });

  it('marks south-asia as deprecated and lists it last', () => {
    const last = REGION_OPTIONS[REGION_OPTIONS.length - 1];
    expect(last.value).toBe(Region.SOUTH_ASIA);
    expect(last.deprecated).toBe(true);
    expect(last.label).toContain('ASIA');
  });

  it('maps auto to an unpinned client', () => {
    expect(toSdkRegion(AUTO_REGION)).toBeUndefined();
    expect(toSdkRegion('in')).toBe('in');
  });
});
