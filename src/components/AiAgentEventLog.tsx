import { format } from 'date-fns';
import List from './List';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './ui/card';

export type AiAgentEvent = {
  id: string;
  eventType: string;
  detail: unknown;
  timestamp: Date;
};

function AiAgentEventItem(props: { event: AiAgentEvent }) {
  return (
    <div className="flex border-b items-start p-2 gap-2">
      <div className="text-gray-500 text-xs whitespace-nowrap">
        {format(props.event.timestamp, 'HH:mm:ss:SSS')}
      </div>
      <div className="flex flex-col gap-1 overflow-hidden">
        <span
          className="font-semibold text-sm"
          data-testid={`aiAgentEvent-${props.event.eventType}`}
        >
          {props.event.eventType}
        </span>
        {props.event.detail != null && (
          <pre className="font-mono text-xs overflow-x-auto whitespace-pre-wrap break-all">
            {JSON.stringify(props.event.detail, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}

type AiAgentEventLogProps = {
  events: AiAgentEvent[];
};

const AiAgentEventLog = ({ events }: AiAgentEventLogProps) => {
  return (
    <Card data-testid="aiAgentEventLog">
      <CardHeader>
        <CardTitle>Widget Event Log</CardTitle>
        <CardDescription>Events emitted by the AI Agent widget</CardDescription>
      </CardHeader>
      <CardContent className="h-[400px] max-h-full overflow-y-auto">
        <List
          items={events}
          renderItem={(event) => (
            <AiAgentEventItem event={event} key={event.id} />
          )}
        />
      </CardContent>
    </Card>
  );
};

export default AiAgentEventLog;
