import { CallEvent } from '@telnyx/rtc-sipjs-simple-user';
import type { TelnyxCall } from '@telnyx/rtc-sipjs-simple-user/dist/types/lib/telnyx-call';
import { useEffect, useState } from 'react';

type Props = {
  call: TelnyxCall;
};

interface StatsFrame {
  rtt: number;
  jitter: number;
  mos: number;
  quality: string;
}

function formatMS(s: number) {
  return `${(s * 1000).toFixed(2)}ms`;
}

function getQuality(mos: number): string {
  if (mos >= 4.0) return 'excellent';
  if (mos >= 3.5) return 'good';
  if (mos >= 3.0) return 'fair';
  if (mos >= 2.5) return 'poor';
  return 'bad';
}

function calculateMOS(jitter: number, rtt: number, packetLoss: number): number {
  // Simplified E-model calculation for MOS
  // R = 93.2 - Id - Ie
  // Id = 0.024 * delay + 0.11 * (delay - 177.3) * H(delay - 177.3)
  // Ie = effective equipment impairment factor (based on codec and packet loss)

  const delay = rtt * 1000; // Convert to ms
  const jitterMs = jitter * 1000;

  // Delay impairment
  let Id = 0.024 * delay;
  if (delay > 177.3) {
    Id += 0.11 * (delay - 177.3);
  }

  // Jitter and packet loss impairment (simplified)
  const Ie = 10 * Math.log10(1 + packetLoss) + jitterMs * 0.5;

  // R-factor
  let R = 93.2 - Id - Ie;
  R = Math.max(0, Math.min(100, R));

  // Convert R to MOS
  if (R < 0) return 1.0;
  if (R > 100) return 4.5;

  const mos = 1 + 0.035 * R + R * (R - 60) * (100 - R) * 7e-6;
  return Math.max(1, Math.min(4.5, mos));
}

const SipJsCallQualityMetrics = ({ call }: Props) => {
  const [frame, setFrame] = useState<StatsFrame>({
    rtt: 0,
    jitter: 0,
    mos: 0,
    quality: 'bad',
  });

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleStats = (event: any) => {
      const data = event?.data;
      if (!data) return;

      // Extract audio stats from the parsed data
      const audio = data.audio;
      const inbound = audio?.inbound?.[0];
      const connection = data.connection;

      const jitter = inbound?.jitter ?? 0;
      const rtt = connection?.currentRoundTripTime ?? 0;
      const packetLoss = inbound?.packetsLost ?? 0;

      const mos = calculateMOS(jitter, rtt, packetLoss);
      const quality = getQuality(mos);

      setFrame({
        rtt,
        jitter,
        mos,
        quality,
      });
    };

    call.on(CallEvent.Stats, handleStats);

    return () => {
      call.off(CallEvent.Stats, handleStats);
    };
  }, [call]);

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
        <div className="text-lg">{formatMS(frame.rtt)}</div>
      </div>
      <div className="rounded border p-2">
        <div className="text-sm text-gray-500">MOS</div>
        <div className="text-lg">{frame.mos.toFixed(2)}</div>
      </div>
    </div>
  );
};

export default SipJsCallQualityMetrics;
