import { Region } from '@telnyx/webrtc';

export type RegionOption = {
  value: string;
  label: string;
  /** The SDK still accepts the value but documents a replacement. */
  deprecated?: boolean;
};

/**
 * The regions a client can be pinned to, taken from the SDK's `Region` table so
 * the demo offers exactly what the installed SDK documents (plus `auto`, which
 * leaves the anycast answer to decide). `south-asia` is the former name of
 * `asia` and keeps working; it is listed last and marked so nobody picks it
 * for new tests.
 */
export const AUTO_REGION = 'auto';

const DEPRECATED_REGIONS = new Set<string>([Region.SOUTH_ASIA]);

export const REGION_OPTIONS: ReadonlyArray<RegionOption> = [
  { value: AUTO_REGION, label: 'AUTO' },
  ...Object.values(Region)
    .filter((value) => !DEPRECATED_REGIONS.has(value))
    .map((value) => ({ value, label: value.toUpperCase() })),
  ...Object.values(Region)
    .filter((value) => DEPRECATED_REGIONS.has(value))
    .map((value) => ({
      value,
      label: `${value.toUpperCase()} (deprecated, use ASIA)`,
      deprecated: true,
    })),
];

/** The SDK `region` option for a selected value: `auto` means "not pinned". */
export const toSdkRegion = (value: string): string | undefined =>
  value === AUTO_REGION ? undefined : value;
