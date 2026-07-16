import { useClientOptions } from '@/atoms/clientOptions';
import { useHost } from '@/atoms/host';
import { useRegion } from '@/atoms/region';
import { useTelnyxSDKVersion } from '@/atoms/telnyxClient';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  type IClientOptions,
  type PreCallDiagnosticReason,
  type PreCallDiagnosticReport,
  type PreCallEstablishmentTimings,
  type PreCallIceReport,
  type PreCallNetworkReport,
  type PreCallServerTestReport,
  type PreCallTimingsReport,
  SwEvent,
  type TelnyxRTC,
} from '@telnyx/webrtc';
import {
  Activity,
  AlertCircle,
  Check,
  ChevronDown,
  Clipboard,
  Download,
  Gauge,
  Loader2,
  Mic,
  Network,
  PhoneCall,
  Radio,
  RotateCcw,
  ShieldCheck,
  Square,
  Timer,
  Volume2,
  Wifi,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { IS_DEV_ENV } from '@/lib/vite';

type DiagnosticKind = 'full' | 'network' | 'microphone';
type AuthenticationMode = 'credentials' | 'token';
type RunState = 'idle' | 'connecting' | 'running' | 'complete' | 'error';

type CompletedRun = {
  kind: DiagnosticKind;
  report: PreCallDiagnosticReport;
  completedAt: Date;
};

const DEFAULT_SETUP_TIMEOUT_MS = 30000;
const DEFAULT_DURATION_MS = 5000;
const CONNECTION_TIMEOUT_MS = 30000;

const diagnosticLabels: Record<DiagnosticKind, string> = {
  full: 'Full pre-call diagnostic',
  network: 'Network & ICE check',
  microphone: 'Microphone check',
};

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) return error.message;
  if (error && typeof error === 'object' && 'error' in error) {
    const nestedError = error.error;
    if (
      nestedError &&
      typeof nestedError === 'object' &&
      'message' in nestedError
    ) {
      return String(nestedError.message);
    }
  }
  return String(error);
};

const hasCredentials = (
  mode: AuthenticationMode,
  login: string,
  password: string,
  token: string,
) =>
  mode === 'token'
    ? token.trim().length > 0
    : login.trim().length > 0 && password.length > 0;

const parsePositiveNumber = (value: string, label: string) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${label} must be a positive number.`);
  }
  return parsed;
};

const parseIceServers = (value: string): RTCIceServer[] | undefined => {
  if (!value.trim()) {
    return undefined;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    throw new Error('Custom ICE servers must be valid JSON.');
  }

  const servers = Array.isArray(parsed) ? parsed : [parsed];
  if (
    servers.some(
      (server) =>
        !server ||
        typeof server !== 'object' ||
        !('urls' in server) ||
        (typeof server.urls !== 'string' && !Array.isArray(server.urls)),
    )
  ) {
    throw new Error('Every ICE server must contain a string or array of URLs.');
  }

  return servers as RTCIceServer[];
};

const waitForReady = (client: TelnyxRTC) =>
  new Promise<void>((resolve, reject) => {
    let settled = false;

    const cleanup = () => {
      window.clearTimeout(timeout);
      client.off(SwEvent.Ready, onReady);
      client.off(SwEvent.Error, onError);
    };
    const onReady = () => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve();
    };
    const onError = (error: unknown) => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(error);
    };
    const timeout = window.setTimeout(() => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new Error('Timed out while connecting to the Telnyx service.'));
    }, CONNECTION_TIMEOUT_MS);

    client.on(SwEvent.Ready, onReady);
    client.on(SwEvent.Error, onError);
    client.connect().catch((error: unknown) => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(error);
    });
  });

const formatMs = (value?: number) =>
  value === undefined ? '—' : `${Math.round(value).toLocaleString()} ms`;

const formatNetworkMs = (value?: number) =>
  value === undefined ? '—' : `${value.toFixed(1)} ms`;

const formatNumber = (value?: number, maximumFractionDigits = 1) =>
  value === undefined
    ? '—'
    : value.toLocaleString(undefined, { maximumFractionDigits });

const formatPercent = (value?: number) =>
  value === undefined ? '—' : `${(value * 100).toFixed(2)}%`;

const formatBitrate = (value?: number) => {
  if (value === undefined) return '—';
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)} Mbps`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)} kbps`;
  return `${value.toFixed(0)} bps`;
};

const formatBytes = (value?: number) => {
  if (value === undefined) return '—';
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)} MB`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)} KB`;
  return `${value.toLocaleString()} B`;
};

const verdictClasses: Record<string, string> = {
  ready:
    'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  degraded:
    'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400',
  blocked: 'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400',
  permission_denied:
    'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400',
  inconclusive:
    'border-slate-500/30 bg-slate-500/10 text-slate-600 dark:text-slate-400',
};

const VerdictBadge = ({ verdict }: { verdict?: string }) => (
  <Badge
    variant="outline"
    className={verdictClasses[verdict ?? 'inconclusive']}
  >
    {(verdict ?? 'inconclusive').replace('_', ' ').toUpperCase()}
  </Badge>
);

const Metric = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-lg border bg-muted/20 p-3">
    <div className="text-xs text-muted-foreground">{label}</div>
    <div className="mt-1 font-mono text-sm font-medium">{value}</div>
  </div>
);

const ReasonList = ({
  title,
  items,
  warning = false,
}: {
  title: string;
  items?: PreCallDiagnosticReason[];
  warning?: boolean;
}) => {
  if (!items?.length) return null;

  const groupedItems = Array.from(
    items
      .reduce((groups, item) => {
        const key = JSON.stringify([item.source, item.code, item.message]);
        const existing = groups.get(key);

        if (existing) {
          existing.count += 1;
        } else {
          groups.set(key, { item, count: 1 });
        }

        return groups;
      }, new Map<string, { item: PreCallDiagnosticReason; count: number }>())
      .entries(),
  );

  return (
    <Alert
      variant={warning ? 'default' : 'destructive'}
      className={warning ? 'border-amber-500/40 bg-amber-500/5' : undefined}
    >
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>
        <ul className="mt-2 space-y-2">
          {groupedItems.map(([key, { item, count }]) => (
            <li key={key}>
              <span className="font-medium">{item.message}</span>
              <span className="ml-2 font-mono text-xs text-muted-foreground">
                {item.source}:{item.code}
              </span>
              {count > 1 ? (
                <Badge variant="secondary" className="ml-2 px-1.5 py-0">
                  ×{count}
                </Badge>
              ) : null}
            </li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  );
};

const getEstablishmentDuration = (timings?: PreCallTimingsReport) => {
  const steps = timings?.callEstablishment?.steps;
  if (!steps?.length) return undefined;

  return Math.max(...steps.map((step) => step.fromStart));
};

const EstablishmentTimeline = ({
  establishment,
}: {
  establishment?: PreCallEstablishmentTimings;
}) => {
  if (!establishment?.steps.length) return null;

  return (
    <div>
      <div className="mb-2 text-sm font-medium">
        Call establishment ({establishment.mode}, {establishment.direction})
      </div>
      <div className="space-y-2">
        {establishment.steps.map((step) => (
          <div
            key={`${step.label}-${step.fromStart}-${step.delta}`}
            className="grid grid-cols-[1fr_auto_auto] gap-3 rounded-md border px-3 py-2 text-sm"
          >
            <span>{step.label}</span>
            <span className="font-mono text-muted-foreground">
              +{formatMs(step.delta)}
            </span>
            <span className="font-mono">{formatMs(step.fromStart)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const TimingsReport = ({ report }: { report: PreCallDiagnosticReport }) => {
  const timings = report.timings;
  if (!timings) return null;

  const establishment = timings.callEstablishment;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Timer className="h-4 w-4" /> Timings
        </CardTitle>
        <CardDescription>
          Diagnostic, ICE gathering, and SDK call-establishment timings.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          <Metric label="Total" value={formatMs(timings.totalMs)} />
          <Metric
            label="ICE gathering"
            value={formatMs(timings.iceGatheringMs)}
          />
          <Metric
            label="First server candidate"
            value={formatMs(timings.firstNonHostCandidateMs)}
          />
          <Metric
            label="Establishment"
            value={formatMs(getEstablishmentDuration(timings))}
          />
          <Metric
            label="Steps"
            value={formatNumber(establishment?.steps.length, 0)}
          />
          <Metric label="Mode" value={establishment?.mode ?? '—'} />
          <Metric label="Direction" value={establishment?.direction ?? '—'} />
        </div>
        <EstablishmentTimeline establishment={establishment} />
      </CardContent>
    </Card>
  );
};

const AudioDirectionDetails = ({
  label,
  direction,
}: {
  label: string;
  direction?: PreCallNetworkReport['inbound'];
}) => (
  <div className="rounded-lg border p-3">
    <div className="mb-3 flex items-center justify-between gap-3 text-sm">
      <span className="font-medium">{label}</span>
      <span className="flex items-center gap-2">
        {direction?.flowing ? (
          <Check className="h-4 w-4 text-emerald-500" />
        ) : (
          <X className="h-4 w-4 text-red-500" />
        )}
        {direction?.flowing ? 'Flowing' : 'Not detected'}
      </span>
    </div>
    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
      <span className="text-muted-foreground">Packets</span>
      <span className="text-right font-mono">
        {formatNumber(direction?.packets, 0)}
      </span>
      <span className="text-muted-foreground">Packet delta</span>
      <span className="text-right font-mono">
        {formatNumber(direction?.packetsDelta, 0)}
      </span>
      <span className="text-muted-foreground">Bytes</span>
      <span className="text-right font-mono">
        {formatBytes(direction?.bytes)}
      </span>
      <span className="text-muted-foreground">Byte delta</span>
      <span className="text-right font-mono">
        {formatBytes(direction?.bytesDelta)}
      </span>
    </div>
  </div>
);

const NetworkDetails = ({ network }: { network: PreCallNetworkReport }) => (
  <div className="space-y-4">
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
      <Metric label="Quality" value={network.quality ?? 'unknown'} />
      <Metric label="RTT minimum" value={formatNetworkMs(network.rtt?.min)} />
      <Metric
        label="RTT average"
        value={formatNetworkMs(network.rtt?.average)}
      />
      <Metric label="RTT maximum" value={formatNetworkMs(network.rtt?.max)} />
      <Metric
        label="Jitter minimum"
        value={formatNetworkMs(network.jitter?.min)}
      />
      <Metric
        label="Jitter average"
        value={formatNetworkMs(network.jitter?.average)}
      />
      <Metric
        label="Jitter maximum"
        value={formatNetworkMs(network.jitter?.max)}
      />
      <Metric
        label="Packet loss"
        value={formatPercent(network.packets?.packetLossFraction)}
      />
      <Metric
        label="Packets sent"
        value={formatNumber(network.packets?.packetsSent, 0)}
      />
      <Metric
        label="Packets received"
        value={formatNumber(network.packets?.packetsReceived, 0)}
      />
      <Metric
        label="Packets lost"
        value={formatNumber(network.packets?.packetsLost, 0)}
      />
      <Metric
        label="Bytes sent"
        value={formatBytes(network.bytes?.bytesSent)}
      />
      <Metric
        label="Bytes received"
        value={formatBytes(network.bytes?.bytesReceived)}
      />
      <Metric
        label="Outbound bitrate"
        value={formatBitrate(network.bitrate?.outbound)}
      />
      <Metric
        label="Inbound bitrate"
        value={formatBitrate(network.bitrate?.inbound)}
      />
    </div>
    <div className="grid gap-2 sm:grid-cols-2">
      <AudioDirectionDetails
        label="Outbound audio"
        direction={network.outbound}
      />
      <AudioDirectionDetails
        label="Inbound audio"
        direction={network.inbound}
      />
    </div>
    <ReasonList title="Network findings" items={network.reasons} />
  </div>
);

const NetworkReport = ({ network }: { network?: PreCallNetworkReport }) => {
  if (!network) return null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="h-4 w-4" /> Network quality
          </CardTitle>
          <Badge variant="outline">{network.quality ?? 'unknown'}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <NetworkDetails network={network} />
      </CardContent>
    </Card>
  );
};

const IceReport = ({ ice }: { ice?: PreCallIceReport }) => {
  if (!ice) return null;

  const candidateCounts = Object.entries(ice.candidateCounts ?? {});
  const selectedPair = ice.selectedPair;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Radio className="h-4 w-4" /> ICE connectivity
        </CardTitle>
        <CardDescription>
          Candidate gathering and the nominated media path.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {candidateCounts.map(([type, count]) => (
            <Metric
              key={type}
              label={`${type.toUpperCase()} candidates`}
              value={formatNumber(count, 0)}
            />
          ))}
          <Metric
            label="Selected pair"
            value={ice.hasSelectedPair ? 'Yes' : 'No'}
          />
          <Metric
            label="Relay available"
            value={ice.hasRelayCandidate ? 'Yes' : 'No'}
          />
          <Metric label="Gathering" value={ice.iceGatheringState ?? '—'} />
          <Metric label="Connection" value={ice.iceConnectionState ?? '—'} />
          <Metric
            label="VPN detected"
            value={
              ice.vpnDetected === undefined
                ? '—'
                : ice.vpnDetected
                  ? 'Yes'
                  : 'No'
            }
          />
        </div>

        {selectedPair ? (
          <div className="rounded-lg border p-4">
            <div className="mb-3 text-sm font-medium">Nominated pair</div>
            <div className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <div className="text-xs text-muted-foreground">Local</div>
                <div className="mt-1 font-mono break-all">
                  {selectedPair.localCandidate?.address ?? 'unknown'}:
                  {selectedPair.localCandidate?.port ?? '—'} ·{' '}
                  {selectedPair.localCandidate?.candidateType ?? 'unknown'} ·{' '}
                  {selectedPair.localCandidate?.protocol ?? 'unknown'}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Remote</div>
                <div className="mt-1 font-mono break-all">
                  {selectedPair.remoteCandidate?.address ?? 'unknown'}:
                  {selectedPair.remoteCandidate?.port ?? '—'} ·{' '}
                  {selectedPair.remoteCandidate?.candidateType ?? 'unknown'} ·{' '}
                  {selectedPair.remoteCandidate?.protocol ?? 'unknown'}
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {ice.candidates?.length ? (
          <details className="rounded-lg border">
            <summary className="cursor-pointer px-4 py-3 text-sm font-medium">
              All candidates ({ice.candidates.length})
            </summary>
            <div className="overflow-x-auto border-t">
              <table className="w-full min-w-[680px] text-left text-sm">
                <thead className="bg-muted/40 text-xs text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2 font-medium">Type</th>
                    <th className="px-4 py-2 font-medium">Address</th>
                    <th className="px-4 py-2 font-medium">Protocol</th>
                    <th className="px-4 py-2 font-medium">Network</th>
                    <th className="px-4 py-2 font-medium">URL</th>
                  </tr>
                </thead>
                <tbody>
                  {ice.candidates.map((candidate) => (
                    <tr
                      key={`${candidate.id ?? 'candidate'}-${candidate.address ?? ''}-${candidate.port ?? ''}-${candidate.candidateType ?? ''}`}
                      className="border-t"
                    >
                      <td className="px-4 py-2 font-mono">
                        {candidate.candidateType ?? '—'}
                      </td>
                      <td className="px-4 py-2 font-mono">
                        {candidate.address ?? '—'}:{candidate.port ?? '—'}
                      </td>
                      <td className="px-4 py-2 font-mono">
                        {candidate.protocol ?? '—'}
                      </td>
                      <td className="px-4 py-2 font-mono">
                        {candidate.networkType ?? '—'}
                      </td>
                      <td className="max-w-[260px] truncate px-4 py-2 font-mono">
                        {candidate.url ?? '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        ) : null}
      </CardContent>
    </Card>
  );
};

const MicrophoneReport = ({
  report,
  wide = false,
}: {
  report: PreCallDiagnosticReport;
  wide?: boolean;
}) => {
  const microphone = report.microphone;
  if (!microphone) return null;

  return (
    <Card>
      <CardHeader className="p-4 pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Mic className="h-4 w-4" /> Microphone
        </CardTitle>
        <CardDescription>
          Permission, devices, active capture, audio level, and recording.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 p-4 pt-0">
        <div
          className={
            wide
              ? 'grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-8'
              : 'grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4'
          }
        >
          <Metric
            label="Permission"
            value={microphone.currentPermissionState}
          />
          <Metric
            label="Devices"
            value={formatNumber(microphone.deviceCount, 0)}
          />
          <Metric
            label="Audio detected"
            value={
              microphone.audioDetected === undefined
                ? '—'
                : microphone.audioDetected
                  ? 'Yes'
                  : 'No'
            }
          />
          <Metric
            label="Audio level"
            value={formatNumber(microphone.audioLevel, 4)}
          />
          <Metric
            label="Peak level"
            value={formatNumber(microphone.audioLevelStats?.peak, 4)}
          />
          <Metric
            label="Average level"
            value={formatNumber(microphone.audioLevelStats?.average, 4)}
          />
          <Metric
            label="Capture"
            value={
              microphone.isGetUserMediaFailed
                ? 'Failed'
                : microphone.activeCapturePerformed
                  ? 'Completed'
                  : 'Not run'
            }
          />
          <Metric
            label="Recording"
            value={
              microphone.recordingPerformed
                ? formatMs(microphone.recordingDurationMs)
                : 'Not run'
            }
          />
        </div>

        {microphone.devices?.length ? (
          <div>
            <div className="mb-2 text-sm font-medium">Audio input devices</div>
            <div className={wide ? 'grid gap-2 md:grid-cols-2' : 'space-y-2'}>
              {microphone.devices.map((device) => (
                <div
                  key={device.deviceId}
                  className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
                >
                  <Mic className="h-4 w-4 text-muted-foreground" />
                  <span>{device.label || 'Unlabeled microphone'}</span>
                  <span className="ml-auto max-w-[45%] truncate font-mono text-xs text-muted-foreground">
                    {device.deviceId}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {microphone.recordingDataUrl ? (
          <div className="rounded-lg border p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium">
              <Volume2 className="h-4 w-4" /> Recording playback
            </div>
            <audio
              controls
              className="w-full"
              src={microphone.recordingDataUrl}
            >
              <track kind="captions" />
            </audio>
          </div>
        ) : null}

        {microphone.captureErrorMessage ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Microphone capture failed</AlertTitle>
            <AlertDescription>
              {microphone.captureErrorMessage}
            </AlertDescription>
          </Alert>
        ) : null}
        <ReasonList title="Microphone findings" items={microphone.reasons} />
      </CardContent>
    </Card>
  );
};

const ServerTest = ({
  test,
  index,
}: {
  test: PreCallServerTestReport;
  index: number;
}) => {
  const urls = Array.isArray(test.server.urls)
    ? test.server.urls.join(', ')
    : test.server.urls;
  const timings = test.timings;
  const ice = test.ice;
  const selectedPair = ice?.selectedPair;
  const gatheredServerCandidates =
    ice?.serverCandidateComparison?.flatMap((entry) => entry.candidates) ??
    ice?.candidates?.filter(
      (candidate) =>
        candidate.candidateType === 'srflx' ||
        candidate.candidateType === 'relay',
    ) ??
    [];

  if (!test.established) {
    return (
      <div className="overflow-hidden rounded-lg border border-destructive/40">
        <div className="flex flex-wrap items-center gap-3 bg-destructive/5 p-4">
          <div className="min-w-0 flex-1">
            <div className="text-xs text-muted-foreground">
              ICE server {index + 1}
            </div>
            <div className="mt-1 break-all font-mono text-sm">{urls}</div>
          </div>
          <Badge variant="destructive">Failed</Badge>
        </div>
        <div className="border-t border-destructive/30 px-4 py-3 text-sm text-destructive">
          {test.error ??
            'The diagnostic call did not reach the established state.'}
        </div>
      </div>
    );
  }

  return (
    <details className="group overflow-hidden rounded-lg border">
      <summary className="flex cursor-pointer list-none flex-wrap items-center gap-3 bg-muted/20 p-4 [&::-webkit-details-marker]:hidden">
        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
        <div className="min-w-0 flex-1">
          <div className="text-xs text-muted-foreground">
            ICE server {index + 1}
          </div>
          <div className="mt-1 break-all font-mono text-sm">{urls}</div>
        </div>
        <Badge variant={test.established ? 'outline' : 'destructive'}>
          {test.established ? 'Established' : 'Failed'}
        </Badge>
      </summary>
      <div className="space-y-5 border-t p-4">
        <section>
          <h4 className="mb-3 flex items-center gap-2 text-sm font-medium">
            <Timer className="h-4 w-4" /> Diagnostic timings
          </h4>
          <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            <Metric label="Total test" value={formatMs(timings?.totalMs)} />
            <Metric
              label="ICE gathering"
              value={formatMs(timings?.iceGatheringMs)}
            />
            <Metric
              label="First server candidate"
              value={formatMs(timings?.firstNonHostCandidateMs)}
            />
            <Metric
              label="Establishment"
              value={formatMs(getEstablishmentDuration(timings))}
            />
            <Metric
              label="Steps"
              value={formatNumber(timings?.callEstablishment?.steps.length, 0)}
            />
            <Metric
              label="Mode"
              value={timings?.callEstablishment?.mode ?? '—'}
            />
          </div>
          <EstablishmentTimeline establishment={timings?.callEstablishment} />
        </section>

        <section>
          <h4 className="mb-3 flex items-center gap-2 text-sm font-medium">
            <Radio className="h-4 w-4" /> ICE result
          </h4>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="rounded-lg border bg-muted/20 p-3">
              <div className="text-xs text-muted-foreground">Selected pair</div>
              <div className="mt-1 break-all font-mono text-sm font-medium">
                {selectedPair?.localCandidate ? (
                  <>
                    {selectedPair.localCandidate.candidateType ?? 'unknown'}{' '}
                    {selectedPair.localCandidate.address ?? 'unknown'}:
                    {selectedPair.localCandidate.port ?? '—'} →{' '}
                    {selectedPair.remoteCandidate?.candidateType ?? 'unknown'}{' '}
                    {selectedPair.remoteCandidate?.address ?? 'unknown'}:
                    {selectedPair.remoteCandidate?.port ?? '—'}
                  </>
                ) : (
                  '—'
                )}
              </div>
            </div>
            <Metric
              label="Candidates gathered from this server"
              value={formatNumber(gatheredServerCandidates.length, 0)}
            />
          </div>
          {gatheredServerCandidates.length ? (
            <div className="mt-2 space-y-2">
              {gatheredServerCandidates.map((candidate) => (
                <div
                  key={`${candidate.id}-${candidate.address}-${candidate.port}`}
                  className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-md border px-3 py-2 font-mono text-xs"
                >
                  <Badge variant="secondary">
                    {candidate.candidateType ?? 'unknown'}
                  </Badge>
                  <span>
                    {candidate.address ?? 'unknown'}:{candidate.port ?? '—'}
                  </span>
                  <span className="text-muted-foreground">
                    {candidate.protocol ?? 'unknown'}
                  </span>
                  <span className="min-w-0 truncate text-muted-foreground">
                    {candidate.url ?? urls}
                  </span>
                </div>
              ))}
            </div>
          ) : null}
        </section>

        {test.network ? (
          <section>
            <h4 className="mb-3 flex items-center gap-2 text-sm font-medium">
              <Activity className="h-4 w-4" /> Complete network report
            </h4>
            <NetworkDetails network={test.network} />
          </section>
        ) : null}

        {test.error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Server test failed</AlertTitle>
            <AlertDescription>{test.error}</AlertDescription>
          </Alert>
        ) : null}
      </div>
    </details>
  );
};

const DiagnosticReport = ({ run }: { run: CompletedRun }) => {
  const report = run.report;
  const reportJson = useMemo(() => JSON.stringify(report, null, 2), [report]);

  const copyReport = async () => {
    try {
      await navigator.clipboard.writeText(reportJson);
      toast.success('Diagnostic report copied');
    } catch (error) {
      toast.error('Could not copy report', {
        description: getErrorMessage(error),
      });
    }
  };

  const downloadReport = () => {
    const blob = new Blob([reportJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `telnyx-${run.kind}-diagnostic-${run.completedAt.toISOString().replace(/:/g, '-')}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="space-y-4" aria-live="polite">
      <Card className="overflow-hidden">
        <div className="border-b bg-muted/20 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <VerdictBadge verdict={report.verdict} />
                <Badge variant="secondary">Report v{report.version}</Badge>
              </div>
              <h2 className="text-xl font-semibold">
                {diagnosticLabels[run.kind]}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Completed {run.completedAt.toLocaleString()}
                {report.callId ? ` · Call ${report.callId}` : ''}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={copyReport}>
                <Clipboard className="mr-2 h-4 w-4" /> Copy JSON
              </Button>
              <Button variant="outline" size="sm" onClick={downloadReport}>
                <Download className="mr-2 h-4 w-4" /> Download
              </Button>
            </div>
          </div>
        </div>
        <CardContent className="space-y-3 pt-6">
          <ReasonList title="Diagnostic findings" items={report.reasons} />
          <ReasonList title="Warnings" items={report.warnings} warning />
          {!report.reasons?.length && !report.warnings?.length ? (
            <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="h-4 w-4" /> No blocking findings or
              warnings.
            </div>
          ) : null}
        </CardContent>
      </Card>

      <div
        className={
          report.network && report.microphone
            ? 'grid gap-4 xl:grid-cols-2'
            : 'grid gap-4'
        }
      >
        <NetworkReport network={report.network} />
        <MicrophoneReport report={report} wide={run.kind === 'microphone'} />
      </div>
      <IceReport ice={report.ice} />
      {run.kind === 'full' ? <TimingsReport report={report} /> : null}

      {report.serverTests?.length ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Network className="h-4 w-4" /> Per-server network tests
            </CardTitle>
            <CardDescription>
              Each ICE server URL is tested independently with an isolated call.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {report.serverTests.map((test, index) => (
              <ServerTest
                key={`${String(test.server.urls)}-${test.callId ?? test.error ?? String(test.established)}`}
                test={test}
                index={index}
              />
            ))}
          </CardContent>
        </Card>
      ) : null}

      <details className="rounded-xl border bg-card shadow">
        <summary className="cursor-pointer p-6 font-medium">
          Raw SDK report
        </summary>
        <pre className="max-h-[520px] overflow-auto border-t bg-muted/20 p-4 text-xs">
          {reportJson}
        </pre>
      </details>
    </section>
  );
};

const PreCallDiagnosticsPage = () => {
  const [savedOptions] = useClientOptions();
  const [host] = useHost();
  const [region] = useRegion();
  const [{ version: sdkVersion, Class: TelnyxRTCClass }] =
    useTelnyxSDKVersion();

  const [authenticationMode, setAuthenticationMode] =
    useState<AuthenticationMode>(
      savedOptions.login_token ? 'token' : 'credentials',
    );
  const [login, setLogin] = useState(savedOptions.login ?? '');
  const [password, setPassword] = useState(savedOptions.password ?? '');
  const [token, setToken] = useState(savedOptions.login_token ?? '');
  const [destination, setDestination] = useState('');
  const [setupTimeout, setSetupTimeout] = useState(
    String(DEFAULT_SETUP_TIMEOUT_MS),
  );
  const [duration, setDuration] = useState(String(DEFAULT_DURATION_MS));
  const [customIceServers, setCustomIceServers] = useState('');
  const [recordMicrophone, setRecordMicrophone] = useState(false);
  const [runState, setRunState] = useState<RunState>('idle');
  const [activeKind, setActiveKind] = useState<DiagnosticKind | null>(null);
  const [runStartedAt, setRunStartedAt] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [completedRun, setCompletedRun] = useState<CompletedRun | null>(null);
  const [error, setError] = useState<string | null>(null);
  const activeClientRef = useRef<TelnyxRTC | null>(null);
  const cancelledRef = useRef(false);

  const busy = runState === 'connecting' || runState === 'running';
  const authenticated = hasCredentials(
    authenticationMode,
    login,
    password,
    token,
  );
  useEffect(() => {
    if (!busy || !runStartedAt) return;
    const updateElapsed = () =>
      setElapsedSeconds(
        Math.max(0, Math.floor((Date.now() - runStartedAt) / 1000)),
      );
    const interval = window.setInterval(updateElapsed, 1000);
    return () => window.clearInterval(interval);
  }, [busy, runStartedAt]);

  useEffect(
    () => () => {
      activeClientRef.current?.disconnect();
    },
    [],
  );

  const runDiagnostic = async (kind: DiagnosticKind) => {
    if (busy) return;

    setError(null);
    setCompletedRun(null);
    cancelledRef.current = false;

    try {
      const durationMs = parsePositiveNumber(duration, 'Duration');
      const callSetupTimeoutMs = parsePositiveNumber(
        setupTimeout,
        'Setup timeout',
      );
      const iceServers = parseIceServers(customIceServers);

      if (kind !== 'microphone' && !authenticated) {
        throw new Error(
          'Enter connection credentials or a login token before running a call-based diagnostic.',
        );
      }
      const credentials =
        authenticationMode === 'token'
          ? { login_token: token.trim() }
          : { login: login.trim(), password };
      const clientOptions: IClientOptions & { host?: string; region?: string } =
        {
          ...(kind === 'microphone' && !authenticated ? {} : credentials),
          debug: false,
          host,
          region: region === 'auto' ? undefined : region,
          env: IS_DEV_ENV ? 'development' : 'production',
        };
      const client = new TelnyxRTCClass(clientOptions);

      if (
        typeof client.runPreCall !== 'function' ||
        typeof client.runNetworkCheck !== 'function' ||
        typeof client.runMicrophoneCheck !== 'function'
      ) {
        throw new Error(
          `SDK ${sdkVersion} does not expose the new pre-call diagnostic API. Select Latest or a compatible SDK version.`,
        );
      }

      activeClientRef.current = client;
      setActiveKind(kind);
      setRunStartedAt(Date.now());
      setElapsedSeconds(0);

      if (kind !== 'microphone') {
        setRunState('connecting');
        await waitForReady(client);
        if (cancelledRef.current) throw new Error('Diagnostic cancelled.');
      }

      setRunState('running');
      let report: PreCallDiagnosticReport;

      if (kind === 'full') {
        report = await client.runPreCall({
          destinationNumber: destination.trim() || undefined,
          durationMs,
          callSetupTimeoutMs,
          iceServers,
        });
      } else if (kind === 'network') {
        report = await client.runNetworkCheck({
          destinationNumber: destination.trim() || undefined,
          callSetupTimeoutMs,
          iceServers,
        });
      } else {
        report = await client.runMicrophoneCheck({
          durationMs,
          record: recordMicrophone,
          warnOnRecording: recordMicrophone
            ? (notice) => window.alert(notice)
            : undefined,
        });
      }

      if (cancelledRef.current) throw new Error('Diagnostic cancelled.');
      setCompletedRun({ kind, report, completedAt: new Date() });
      setRunState('complete');
    } catch (runError) {
      const message = getErrorMessage(runError);
      setError(message);
      setRunState('error');
      toast.error('Diagnostic failed', { description: message });
    } finally {
      const client = activeClientRef.current;
      activeClientRef.current = null;
      if (client) {
        await Promise.resolve(client.disconnect()).catch(() => undefined);
      }
      setActiveKind(null);
      setRunStartedAt(null);
    }
  };

  const cancelDiagnostic = () => {
    cancelledRef.current = true;
    activeClientRef.current?.disconnect();
    toast('Cancelling diagnostic', {
      description:
        'The active client is disconnecting and cleaning up the test.',
    });
  };

  const resetReport = () => {
    setCompletedRun(null);
    setError(null);
    setRunState('idle');
  };

  return (
    <div className="mx-auto space-y-6 pb-10">
      <div className="rounded-xl border bg-gradient-to-br from-card via-card to-muted/40 p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <Badge variant="secondary" className="mb-3">
              SDK {sdkVersion}
            </Badge>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Pre-call diagnostics
            </h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground sm:text-base">
              Validate signaling, ICE routes, real media quality, and microphone
              capture before a production call. Tests run through an isolated
              TelnyxRTC client and clean up automatically.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs sm:text-sm">
            <div className="rounded-lg border bg-background/60 px-3 py-3">
              <PhoneCall className="mx-auto mb-1 h-4 w-4" /> Full call
            </div>
            <div className="rounded-lg border bg-background/60 px-3 py-3">
              <Wifi className="mx-auto mb-1 h-4 w-4" /> Network
            </div>
            <div className="rounded-lg border bg-background/60 px-3 py-3">
              <Mic className="mx-auto mb-1 h-4 w-4" /> Microphone
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Connection & test configuration
            </CardTitle>
            <CardDescription>
              Credentials remain in this browser and are never included in the
              diagnostic report.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <Label>Authentication</Label>
              <div className="mt-2 grid grid-cols-2 gap-2 rounded-lg bg-muted p-1">
                <Button
                  type="button"
                  size="sm"
                  variant={
                    authenticationMode === 'credentials' ? 'default' : 'ghost'
                  }
                  onClick={() => setAuthenticationMode('credentials')}
                  disabled={busy}
                >
                  Login & password
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={authenticationMode === 'token' ? 'default' : 'ghost'}
                  onClick={() => setAuthenticationMode('token')}
                  disabled={busy}
                >
                  Login token
                </Button>
              </div>
            </div>

            {authenticationMode === 'credentials' ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="precall-login">Login</Label>
                  <Input
                    id="precall-login"
                    value={login}
                    onChange={(event) => setLogin(event.target.value)}
                    autoComplete="username"
                    disabled={busy}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="precall-password">Password</Label>
                  <Input
                    id="precall-password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="current-password"
                    disabled={busy}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="precall-token">Login token</Label>
                <Input
                  id="precall-token"
                  type="password"
                  value={token}
                  onChange={(event) => setToken(event.target.value)}
                  autoComplete="off"
                  disabled={busy}
                />
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2 sm:col-span-3 lg:col-span-1">
                <Label htmlFor="precall-destination">
                  Custom diagnostic destination
                </Label>
                <Input
                  id="precall-destination"
                  value={destination}
                  onChange={(event) => setDestination(event.target.value)}
                  placeholder="Uses the SDK default when empty"
                  disabled={busy}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="precall-timeout">Setup timeout (ms)</Label>
                <Input
                  id="precall-timeout"
                  type="number"
                  min="1"
                  value={setupTimeout}
                  onChange={(event) => setSetupTimeout(event.target.value)}
                  disabled={busy}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="precall-duration">Sample duration (ms)</Label>
                <Input
                  id="precall-duration"
                  type="number"
                  min="1"
                  value={duration}
                  onChange={(event) => setDuration(event.target.value)}
                  disabled={busy}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="precall-ice-servers">
                Custom ICE servers (optional JSON)
              </Label>
              <Textarea
                id="precall-ice-servers"
                className="min-h-28 font-mono text-xs"
                value={customIceServers}
                onChange={(event) => setCustomIceServers(event.target.value)}
                placeholder={
                  '[\n  { "urls": "stun:stun.example.com:3478" },\n  { "urls": "turn:turn.example.com:3478", "username": "user", "credential": "secret" }\n]'
                }
                spellCheck={false}
                disabled={busy}
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to use the SDK/client defaults. Overrides apply only
                to the diagnostic run.
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label htmlFor="precall-recording">
                    Record microphone sample
                  </Label>
                  <p className="mt-1 text-xs text-muted-foreground">
                    A warning is shown before recording. Successful recordings
                    play back automatically.
                  </p>
                </div>
                <Switch
                  id="precall-recording"
                  checked={recordMicrophone}
                  onCheckedChange={setRecordMicrophone}
                  disabled={busy || !('MediaRecorder' in window)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-3 md:grid-cols-3">
          {(
            [
              [
                'full',
                PhoneCall,
                'Runs every module through a real diagnostic call.',
              ],
              [
                'network',
                Gauge,
                'Tests each configured ICE server in isolation.',
              ],
              [
                'microphone',
                Mic,
                'Checks local devices, levels, and optional recording.',
              ],
            ] as const
          ).map(([kind, Icon, description]) => (
            <Card
              key={kind}
              className={
                activeKind === kind ? 'ring-2 ring-primary' : undefined
              }
            >
              <CardContent className="flex h-full flex-col p-5">
                <Icon className="mb-3 h-5 w-5" />
                <div className="font-medium">{diagnosticLabels[kind]}</div>
                <p className="mb-5 mt-1 flex-1 text-xs leading-5 text-muted-foreground">
                  {description}
                </p>
                <Button
                  onClick={() => runDiagnostic(kind)}
                  disabled={busy || (kind !== 'microphone' && !authenticated)}
                  data-testid={`run-${kind}-diagnostic`}
                >
                  {activeKind === kind ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Activity className="mr-2 h-4 w-4" />
                  )}
                  Run {kind === 'full' ? 'full diagnostic' : `${kind} check`}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {busy ? (
          <Alert className="border-primary/30 bg-primary/5">
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertTitle>
              {runState === 'connecting'
                ? 'Connecting diagnostic client'
                : `Running ${activeKind ? diagnosticLabels[activeKind].toLowerCase() : 'diagnostic'}`}
            </AlertTitle>
            <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
              <span>
                {elapsedSeconds}s elapsed. Keep this tab open until the SDK
                finishes and cleans up the test.
              </span>
              <Button variant="outline" size="sm" onClick={cancelDiagnostic}>
                <Square className="mr-2 h-3 w-3 fill-current" /> Cancel
              </Button>
            </AlertDescription>
          </Alert>
        ) : null}

        {error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Diagnostic did not complete</AlertTitle>
            <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
              <span>{error}</span>
              <Button variant="outline" size="sm" onClick={resetReport}>
                <RotateCcw className="mr-2 h-4 w-4" /> Reset
              </Button>
            </AlertDescription>
          </Alert>
        ) : null}
      </div>

      {completedRun ? <DiagnosticReport run={completedRun} /> : null}
    </div>
  );
};

export default PreCallDiagnosticsPage;
