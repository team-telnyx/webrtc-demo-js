import { useEffect } from 'react';
import { useClientOptions } from '@/atoms/clientOptions';
import { useHost } from '@/atoms/host';
import { useRegion } from '@/atoms/region';
import { useConnectionStatus, useTelnyxSDKVersion } from '@/atoms/telnyxClient';
import { toSdkRegion } from '@/lib/regions';
import { IS_DEV_ENV } from '@/lib/vite';

/**
 * Drives `TelnyxRTC.keepConnectionWarm()` (SDK 2.28.1) from the "Keep
 * Connection Warm" client option: while the demo is not connected it keeps the
 * signaling host of the selected region resolved and a TLS connection to it
 * open, so the next connect skips DNS, TCP and TLS. Stops as soon as a client
 * connects, the option is turned off, or the region / host / SDK build changes
 * (and restarts for the new target). Older SDK builds picked in the version
 * dropdown do not have the method; then nothing runs.
 */
const ConnectionWarmer = () => {
  const [options] = useClientOptions();
  const [region] = useRegion();
  const [host] = useHost();
  const [status] = useConnectionStatus();
  const [{ Class: TelnyxRTCClass }] = useTelnyxSDKVersion();

  const enabled = options.keepConnectionWarm === true;
  const idle = status === 'disconnected';
  const supported = typeof TelnyxRTCClass.keepConnectionWarm === 'function';

  useEffect(() => {
    if (!enabled || !idle || !supported) {
      return;
    }
    const stop = TelnyxRTCClass.keepConnectionWarm({
      region: toSdkRegion(region),
      host: host || undefined,
      env: IS_DEV_ENV ? 'development' : 'production',
    });
    return stop;
  }, [enabled, idle, supported, TelnyxRTCClass, region, host]);

  return null;
};

export default ConnectionWarmer;
