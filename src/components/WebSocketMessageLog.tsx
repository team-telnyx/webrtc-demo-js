import { useTelnyxSdkClient } from '@/atoms/telnyxClient';
import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import List from './List';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './ui/card';

type GenericMessage = {
  id: string;
  method: string;
  params?: unknown;
  result?: unknown;
  timestamp: Date;
};

function WebSocketMessage(props: { message: GenericMessage }) {
  return (
    <div className="flex border-b items-center p-2 gap-2">
      <div className="text-gray-500">
        {format(props.message.timestamp, 'HH:mm:ss:SSS')}
      </div>
      <div className="flex flex-col gap-2">
        <pre
          data-testid={`wsMessages-webrtc-children-${props.message.method}`}
          className="font-mono text-xs"
        >
          {JSON.stringify(props.message, null, 2)}
        </pre>
      </div>
    </div>
  );
}

const WebSocketMessageLog = () => {
  const [client] = useTelnyxSdkClient();
  const [messages, setMessages] = useState<GenericMessage[]>([]);
  useEffect(() => {
    if (!client) {
      return;
    }

    const onSocketMessage = (payload: GenericMessage) => {
      payload.timestamp = new Date();
      setMessages((prev) => [payload, ...prev]);
    };

    client.on('telnyx.socket.message', onSocketMessage);
    return () => {
      client.off('telnyx.socket.message', onSocketMessage);
    };
  }, [client]);
  return (
    <Card data-testid="wsMessages">
      <CardHeader>
        <CardTitle>WebSocket Message Feed</CardTitle>
        <CardDescription>WebSocket message log</CardDescription>
      </CardHeader>
      <CardContent className="h-[400px] max-h-full overflow-y-auto">
        <List
          items={messages}
          renderItem={(message) => (
            <WebSocketMessage message={message} key={message.id} />
          )}
        />
      </CardContent>
    </Card>
  );
};

export default WebSocketMessageLog;
