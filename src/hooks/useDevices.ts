import { useCallback, useEffect, useState } from "react";

export const useDevices = (video = false) => {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);

  const loadDevices = useCallback(async () => {
    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices?.enumerateDevices
    ) {
      return;
    }

    try {
      await navigator.mediaDevices.getUserMedia({ audio: true, video });
      const devices = await navigator.mediaDevices.enumerateDevices();
      setDevices(devices);
    } catch (error) {
      console.error("Failed to load audio devices", error);
      setDevices([]);
    }
  }, [setDevices, video]);

  useEffect(() => {
    loadDevices();

    if (typeof navigator === "undefined" || !navigator.mediaDevices) return;

    const handleDeviceChange = () => loadDevices();
    navigator.mediaDevices.addEventListener("devicechange", handleDeviceChange);

    return () => {
      navigator.mediaDevices.removeEventListener(
        "devicechange",
        handleDeviceChange
      );
    };
  }, [loadDevices]);

  return devices;
};
