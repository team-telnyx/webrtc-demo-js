import { useEffect } from 'react';
import { format } from 'date-fns';
import { useSignalingPingSamples } from '@/atoms/signalingPing';
import { useConnectionStatus } from '@/atoms/telnyxClient';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  addSample,
  onPingSample,
  PingStats,
  sendManualPing,
  summarize,
} from '@/lib/signalingPing';

const ms = (value: number) => `${Math.round(value)} ms`;

export const SignalingPingDetails = ({ stats }: { stats: PingStats }) => (
  <div className="space-y-3 text-xs">
    <div className="space-y-1">
      <p className="text-sm font-semibold">Signaling ping</p>
      <p className="text-muted-foreground">
        Round trip of telnyx_rtc.ping on the WebSocket to {stats.last.host}:
        from the request leaving the browser to the server&apos;s response with
        the same id. It measures the signaling path only, not media.
      </p>
    </div>
    <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1">
      <dt className="text-muted-foreground">Last</dt>
      <dd data-testid="signaling-ping-last">{ms(stats.last.rttMs)}</dd>
      <dt className="text-muted-foreground">Min / avg / max</dt>
      <dd>
        {ms(stats.minMs)} / {ms(stats.avgMs)} / {ms(stats.maxMs)}
      </dd>
      <dt className="text-muted-foreground">Samples</dt>
      <dd>{stats.count}</dd>
    </dl>
    <table className="w-full border-collapse">
      <thead>
        <tr className="border-b text-left text-muted-foreground">
          <th className="py-1 pr-2 font-medium">Time</th>
          <th className="py-1 pr-2 font-medium text-right">RTT</th>
          <th className="py-1 font-medium">Source</th>
        </tr>
      </thead>
      <tbody>
        {stats.samples.map((s) => (
          <tr key={`${s.at.getTime()}-${s.rttMs}`} className="border-b/50">
            <td className="py-1 pr-2 tabular-nums">
              {format(s.at, 'HH:mm:ss')}
            </td>
            <td className="py-1 pr-2 text-right tabular-nums">{ms(s.rttMs)}</td>
            <td className="py-1 text-muted-foreground">{s.source}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const SignalingPing = () => {
  const [samples, setSamples] = useSignalingPingSamples();
  const [status] = useConnectionStatus();

  useEffect(
    () =>
      onPingSample((sample) => setSamples((prev) => addSample(prev, sample))),
    [setSamples],
  );

  useEffect(() => {
    if (status === 'disconnected') setSamples([]);
  }, [status, setSamples]);

  const stats = summarize(samples);
  const connected = status !== 'disconnected';

  return (
    <span className="ml-2 inline-flex items-center gap-1 text-sm opacity-75">
      {stats ? (
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              data-testid="btn-signaling-ping"
              className="underline decoration-dotted underline-offset-2 hover:opacity-100"
            >
              ping: {ms(stats.last.rttMs)} (avg {ms(stats.avgMs)})
            </button>
          </PopoverTrigger>
          <PopoverContent
            align="end"
            className="w-[24rem] max-w-[calc(100vw-2rem)] max-h-[70vh] overflow-y-auto"
          >
            <SignalingPingDetails stats={stats} />
          </PopoverContent>
        </Popover>
      ) : (
        connected && <span>ping: –</span>
      )}
      {connected && (
        <button
          type="button"
          data-testid="btn-signaling-ping-now"
          title="Send a telnyx_rtc.ping now"
          className="rounded border px-1 text-xs hover:opacity-100"
          onClick={() => sendManualPing()}
        >
          ping now
        </button>
      )}
    </span>
  );
};

export default SignalingPing;
