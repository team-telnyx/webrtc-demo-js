/**
 * Registration timing recorded by @telnyx/webrtc >= 2.28.0 (#786).
 *
 * The SDK traces `new TelnyxRTC()` → first `telnyx.ready`, logs it as
 * `[TelnyxRTC registration <client UUID>]` lines and keeps a structured summary
 * for call reports. `client._registrationTimings.getLogEntry()` returns that
 * summary as a log entry whose `context` is the shape below. The field is
 * optional-chained here because the demo can load older SDK builds at runtime.
 */
export interface RegistrationTimingStep {
  timestamp: string;
  step: string;
  deltaMs: number;
  elapsedMs: number;
  details?: Record<string, string | number | boolean | undefined>;
}

export interface RegistrationTimingSummary {
  event: 'registration_timing';
  schemaVersion: number;
  scope: string;
  clientId: string;
  sessionId: string;
  sdkVersion: string;
  startedAt: string;
  timestamp: string;
  totalMs: number;
  constructorMs?: number;
  appWaitBeforeConnectMs?: number;
  connectToReadyMs?: number;
  socketAttempts: number;
  droppedSteps: number;
  droppedRequests: number;
  longestInterval?: { from: string; to: string; durationMs: number };
  steps: RegistrationTimingStep[];
}

type RegistrationTimingProvider = {
  _registrationTimings?: {
    getLogEntry?: () => { context?: unknown } | undefined;
  };
};

export const isRegistrationTimingSummary = (
  value: unknown,
): value is RegistrationTimingSummary => {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    candidate.event === 'registration_timing' &&
    typeof candidate.totalMs === 'number' &&
    Array.isArray(candidate.steps)
  );
};

/**
 * Reads the initial registration summary from a TelnyxRTC client.
 * Returns null on SDKs without the feature (< 2.28.0) or before `telnyx.ready`.
 */
export const readRegistrationTiming = (
  client: unknown,
): RegistrationTimingSummary | null => {
  const timings = (client as RegistrationTimingProvider | null | undefined)
    ?._registrationTimings;
  if (!timings || typeof timings.getLogEntry !== 'function') {
    return null;
  }

  try {
    const context = timings.getLogEntry()?.context;
    return isRegistrationTimingSummary(context) ? context : null;
  } catch (error) {
    console.warn('Failed to read SDK registration timing', error);
    return null;
  }
};

export const formatMs = (value: number | undefined): string =>
  value === undefined || Number.isNaN(value)
    ? 'n/a'
    : `${value >= 100 ? Math.round(value) : Number(value.toFixed(1))} ms`;

export const formatStepDetails = (
  details: RegistrationTimingStep['details'],
): string =>
  Object.entries(details ?? {})
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `${key}=${value}${key.endsWith('Ms') ? ' ms' : ''}`)
    .join(', ');
