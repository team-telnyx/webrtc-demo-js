/* eslint-disable @typescript-eslint/no-explicit-any */
import { useTelnyxSdkClient } from "@/atoms/telnyxClient";
import { SwEvent } from "@telnyx/webrtc";
import { useEffect, useState } from "react";

function formatMS(s: number) {
  return `${(s * 1000).toFixed(2)}ms`;
}
const InCallQualityMetrics = () => {
  const [client] = useTelnyxSdkClient();
  const [frame, setFrame] = useState<any>({
    rtt: 0,
    quality: "bad",
    jitter: 0,
    mos: 0,
  });
  useEffect(() => {
    if (!client) {
      return;
    }
    
    client.on(SwEvent.StatsFrame, setFrame);

    return () => {
      client.off(SwEvent.StatsFrame, setFrame);
    };
  }, [client]);

  return (
    <div className="grid grid-cols-2 gap-2">
      <div className="rounded border p-2">
        <div className="text-sm text-gray-500">Jitter</div>
        <div className="text-lg">{formatMS(frame.jitter)}</div>
      </div>
      <div className="rounded border p-2">
        <div className="text-sm text-gray-500">Quality</div>
        <div className="text-lg">{frame.quality}</div>
      </div>
      <div className="rounded border p-2">
        <div className="text-sm text-gray-500">Round Trip Time</div>
        <div className="text-lg">{formatMS(frame?.rtt)}</div>
      </div>
      <div className="rounded border p-2">
        <div className="text-sm text-gray-500">MOS</div>
        <div className="text-lg">{frame?.mos?.toFixed(2)}</div>
      </div>
    </div>
  );
};

export default InCallQualityMetrics;
