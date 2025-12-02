import { useCallback, useEffect, useState } from "react";

export const useDevices = (kinds?: MediaDeviceKind[]) => {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);

  const loadDevices = useCallback(async () => {
    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices?.enumerateDevices
    ) {
      return;
    }

    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const filteredDevices =
        kinds && kinds.length
          ? devices.filter((device) => kinds.includes(device.kind))
          : devices;

      setDevices(filteredDevices);
    } catch (error) {
      console.error("Failed to load audio devices", error);
      setDevices([]);
    }
  }, [setDevices, kinds]);

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
