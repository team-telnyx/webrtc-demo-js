import { useCallback, useEffect, useState } from 'react';

const getMediaDevices = () =>
  typeof navigator === 'undefined' ? undefined : navigator.mediaDevices;

const listDevices = async (): Promise<MediaDeviceInfo[]> => {
  const mediaDevices = getMediaDevices();
  if (!mediaDevices?.enumerateDevices) {
    return [];
  }
  try {
    return await mediaDevices.enumerateDevices();
  } catch (error) {
    console.error('Failed to enumerate media devices', error);
    return [];
  }
};

/**
 * Enumerates media devices without prompting for permission on mount.
 *
 * Before the user grants microphone/camera access, browsers return devices
 * with empty labels (and Safari returns none). `requestPermission()` opens a
 * short-lived capture so the next enumeration carries labels, then stops it.
 */
export const useMediaDeviceList = (video = false) => {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    listDevices().then(setDevices);
  }, []);

  const requestPermission = useCallback(async () => {
    const mediaDevices = getMediaDevices();
    if (!mediaDevices?.getUserMedia) {
      setPermissionError('Media devices are not available in this browser.');
      return;
    }

    try {
      const stream = await mediaDevices.getUserMedia({ audio: true, video });
      stream.getTracks().forEach((track) => track.stop());
      setPermissionError(null);
    } catch (error) {
      setPermissionError(
        error instanceof Error ? error.message : String(error),
      );
    }

    refresh();
  }, [refresh, video]);

  useEffect(() => {
    refresh();

    const mediaDevices = getMediaDevices();
    if (!mediaDevices?.addEventListener) {
      return;
    }

    mediaDevices.addEventListener('devicechange', refresh);
    return () => {
      mediaDevices.removeEventListener('devicechange', refresh);
    };
  }, [refresh]);

  return { devices, requestPermission, permissionError };
};
