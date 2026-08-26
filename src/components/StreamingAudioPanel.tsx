import type { ReactNode } from 'react';
import { Badge } from './ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './ui/card';
import {
  estimateAudioMs,
  totalBytes,
  totalChunks,
  totalMissedSequences,
  useStreamingAudio,
  useStreamingAudioEnabled,
  type StreamingAudioResponse,
} from '@/atoms/streamingAudio';

function formatMs(value: number | null): string {
  return value === null ? '—' : `${value.toFixed(0)}ms`;
}

function formatBytes(value: number): string {
  if (value < 1024) {
    return `${value} B`;
  }
  return `${(value / 1024).toFixed(1)} KiB`;
}

const Stat = ({
  label,
  value,
  hint,
  testId,
}: {
  label: string;
  value: string;
  hint?: string;
  testId: string;
}) => (
  <div className="rounded border p-2">
    <div className="text-sm text-gray-500">{label}</div>
    <div className="text-lg" data-testid={testId}>
      {value}
    </div>
    {hint && <div className="text-xs text-muted-foreground">{hint}</div>}
  </div>
);

const ResponseRow = ({ response }: { response: StreamingAudioResponse }) => {
  const audioMs = estimateAudioMs(response.bytes, response.format);

  return (
    <div className="flex flex-col gap-1 border-b p-2 text-xs">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono">{response.responseId}</span>
        <Badge
          variant={
            response.status === 'interrupted'
              ? 'destructive'
              : response.status === 'done'
                ? 'secondary'
                : 'default'
          }
        >
          {response.status}
        </Badge>
        {response.firstSequence > 0 && (
          <Badge variant="destructive">
            starts at seq {response.firstSequence}
          </Badge>
        )}
        {response.missedSequences > 0 && (
          <Badge variant="destructive">
            {response.missedSequences} missed
          </Badge>
        )}
      </div>
      <div className="text-muted-foreground">
        {response.chunks} chunks · {formatBytes(response.bytes)}
        {audioMs !== null && ` · ~${(audioMs / 1000).toFixed(2)}s audio`} ·
        first delta {formatMs(response.firstDeltaOffsetMs)} after active · spans{' '}
        {formatMs(response.spanMs)}
      </div>
      {response.format && (
        <div className="font-mono text-muted-foreground">
          {response.format.encoding} · {response.format.sampleRate}Hz ·{' '}
          {response.format.channels}ch
        </div>
      )}
    </div>
  );
};

/**
 * Shows what the pre-playout audio stream actually delivered.
 *
 * The two numbers worth reading are the first response's `first delta` offset —
 * how early the greeting arrived — and whether it starts at sequence 0. A
 * non-zero start sequence is the greeting-truncation race: ACA had already
 * emitted chunks before the subscription existed, and those are gone.
 */
export const StreamingAudioStats = ({
  enabled,
  disabledHint,
  showSubscribeStats = true,
}: {
  /** Defaults to the SDK tab's anonymous-login option when omitted. */
  enabled?: boolean;
  disabledHint?: ReactNode;
  /**
   * Whether the subscribe handshake is ours to report. False on the AI Agent
   * tab, where @telnyx/ai-agent-lib owns the subscribe inside the widget and
   * does not surface the ack — so an ack latency there would be a blank tile
   * pretending to be a measurement.
   */
  showSubscribeStats?: boolean;
} = {}) => {
  const [state] = useStreamingAudio();
  const sdkEnabled = useStreamingAudioEnabled();
  const isEnabled = enabled ?? sdkEnabled;

  if (!isEnabled) {
    return (
      <p className="p-2 text-sm text-muted-foreground">
        {disabledHint ?? (
          <>
            Turn on <span className="font-semibold">Streaming Audio</span> in
            Client Options (anonymous login) to subscribe to the assistant's
            pre-playout audio stream and measure it here.
          </>
        )}
      </p>
    );
  }

  const chunks = totalChunks(state);
  const bytes = totalBytes(state);
  const missed = totalMissedSequences(state);
  const firstResponse = state.responses[0];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {showSubscribeStats && (
          <>
            <Stat
              label="Subscribe"
              value={
                state.ackOffsetMs !== null
                  ? 'acked'
                  : chunks > 0
                    ? // Audio without an ack still proves the subscription exists.
                      'streaming'
                    : state.subscribeAttempts > 0
                      ? 'pending'
                      : 'idle'
              }
              hint={`${state.subscribeAttempts} attempt${
                state.subscribeAttempts === 1 ? '' : 's'
              }`}
              testId="streaming-audio-subscribe"
            />
            <Stat
              label="Ack after"
              value={formatMs(state.ackOffsetMs)}
              hint="from call active"
              testId="streaming-audio-ack"
            />
          </>
        )}
        <Stat
          label="Chunks"
          value={String(chunks)}
          hint={formatBytes(bytes)}
          testId="streaming-audio-chunks"
        />
        <Stat
          label="Greeting at"
          value={formatMs(firstResponse?.firstDeltaOffsetMs ?? null)}
          hint="first delta, from call active"
          testId="streaming-audio-greeting"
        />
        {!showSubscribeStats && (
          <Stat
            label="Responses"
            value={String(state.responses.length)}
            hint={`${missed} sequence${missed === 1 ? '' : 's'} missed`}
            testId="streaming-audio-responses"
          />
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {showSubscribeStats && state.audioBeforeAck && (
          <Badge variant="default" data-testid="streaming-audio-init-subscribe">
            audio arrived before ack — server-side init-subscribe
          </Badge>
        )}
        {firstResponse && firstResponse.firstSequence > 0 && (
          <Badge variant="destructive">
            first response starts at sequence {firstResponse.firstSequence} —
            earlier chunks were dropped
          </Badge>
        )}
        {missed > 0 && (
          <Badge variant="destructive">{missed} sequences missed</Badge>
        )}
        {showSubscribeStats &&
          state.subscribeAttempts >= 10 &&
          state.ackOffsetMs === null && (
          <Badge variant="destructive">
            subscribe retries exhausted — no ack from ACA
          </Badge>
        )}
        {state.lastError && (
          <Badge variant="destructive">send failed: {state.lastError}</Badge>
        )}
      </div>

      {state.responses.length === 0 ? (
        <p className="p-2 text-sm text-muted-foreground">
          {showSubscribeStats
            ? 'Subscribed. Waiting for the assistant to speak.'
            : 'Waiting for streaming audio from the widget. Pick a widget build that supports streaming-audio and make the assistant speak.'}
        </p>
      ) : (
        <div className="max-h-64 overflow-y-auto rounded border">
          {state.responses.map((response) => (
            <ResponseRow key={response.responseId} response={response} />
          ))}
        </div>
      )}
    </div>
  );
};

const StreamingAudioPanel = () => (
  <Card data-testid="streaming-audio-panel">
    <CardHeader>
      <CardTitle>Streaming Audio</CardTitle>
      <CardDescription>
        Pre-playout assistant audio delivered over the signaling socket, ahead of
        the WebRTC media stream. Not played — measured.
      </CardDescription>
    </CardHeader>
    <CardContent>
      <StreamingAudioStats />
    </CardContent>
  </Card>
);

export default StreamingAudioPanel;
