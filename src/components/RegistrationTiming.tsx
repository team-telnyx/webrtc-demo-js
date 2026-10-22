import { useRegistrationTiming } from '@/atoms/registrationTiming';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  formatMs,
  formatStepDetails,
  RegistrationTimingSummary,
} from '@/lib/registrationTiming';

type DetailsProps = {
  timing: RegistrationTimingSummary;
};

export const RegistrationTimingDetails = ({ timing }: DetailsProps) => (
  <div className="space-y-3 text-xs">
    <div className="space-y-1">
      <p className="text-sm font-semibold">Registration timing</p>
      <p className="text-muted-foreground">
        From new TelnyxRTC() to the first telnyx.ready, as recorded by SDK{' '}
        {timing.sdkVersion}. The same data is in the console as [TelnyxRTC
        registration {timing.clientId}] and in the first call report segment of
        each call.
      </p>
    </div>

    <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1">
      <dt className="text-muted-foreground">Total</dt>
      <dd data-testid="registration-timing-total" className="font-medium">
        {formatMs(timing.totalMs)}
      </dd>
      <dt className="text-muted-foreground">Constructor</dt>
      <dd>{formatMs(timing.constructorMs)}</dd>
      <dt className="text-muted-foreground">App wait before connect()</dt>
      <dd>{formatMs(timing.appWaitBeforeConnectMs)}</dd>
      <dt className="text-muted-foreground">connect() to ready</dt>
      <dd>{formatMs(timing.connectToReadyMs)}</dd>
      <dt className="text-muted-foreground">Socket attempts</dt>
      <dd>{timing.socketAttempts}</dd>
      {timing.longestInterval && (
        <>
          <dt className="text-muted-foreground">Longest gap</dt>
          <dd>
            {formatMs(timing.longestInterval.durationMs)} between{' '}
            {timing.longestInterval.from} and {timing.longestInterval.to}
          </dd>
        </>
      )}
      <dt className="text-muted-foreground">Started</dt>
      <dd>{timing.startedAt}</dd>
    </dl>

    {timing.droppedSteps > 0 && (
      <p className="text-amber-500">
        {timing.droppedSteps} earlier step(s) were evicted from the SDK buffer;
        totals still cover the whole trace.
      </p>
    )}

    <table className="w-full border-collapse">
      <thead>
        <tr className="border-b text-left text-muted-foreground">
          <th className="py-1 pr-2 font-medium">Step</th>
          <th className="py-1 pr-2 font-medium text-right">Delta</th>
          <th className="py-1 pr-2 font-medium text-right">Elapsed</th>
          <th className="py-1 font-medium">Details</th>
        </tr>
      </thead>
      <tbody>
        {timing.steps.map((entry) => (
          <tr
            key={`${entry.timestamp}-${entry.elapsedMs}-${entry.step}`}
            className="border-b/50"
          >
            <td className="py-1 pr-2 align-top">{entry.step}</td>
            <td className="py-1 pr-2 align-top text-right tabular-nums">
              {formatMs(entry.deltaMs)}
            </td>
            <td className="py-1 pr-2 align-top text-right tabular-nums">
              {formatMs(entry.elapsedMs)}
            </td>
            <td className="py-1 align-top text-muted-foreground break-all">
              {formatStepDetails(entry.details)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const RegistrationTiming = () => {
  const [timing] = useRegistrationTiming();

  if (!timing) {
    return null;
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          data-testid="btn-registration-timing"
          className="ml-2 text-sm opacity-75 underline decoration-dotted underline-offset-2 hover:opacity-100"
        >
          ready in {formatMs(timing.totalMs)}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-[36rem] max-w-[calc(100vw-2rem)] max-h-[70vh] overflow-y-auto"
      >
        <RegistrationTimingDetails timing={timing} />
      </PopoverContent>
    </Popover>
  );
};

export default RegistrationTiming;
