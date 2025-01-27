import { useTelnyxClient } from "@/atoms/telnyxClient";
import { useEffect, useState } from "react";
import List from "./List";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";

const WebSocketMessageLog = () => {
  const [client] = useTelnyxClient();
  const [messages, setMessages] = useState<string[]>([]);
  useEffect(() => {
    if (!client) {
      return;
    }

    const onSocketMessage = (payload: unknown) => {
      setMessages((prev) => [JSON.stringify(payload, null, 2), ...prev]);
    };

    client.on("telnyx.socket.message", onSocketMessage);
    return () => {
      client.off("telnyx.socket.message", onSocketMessage);
    };
  }, [client]);
  return (
    <Card>
      <CardHeader>
        <CardTitle>WebSocket Message Feed</CardTitle>
        <CardDescription>WebSocket message log</CardDescription>
      </CardHeader>
      <CardContent className="h-[400px] max-h-full overflow-y-auto">
        <List
          items={messages}
          renderItem={(message, i) => (
            <pre className="text-xs" key={i}>
              {message}
              <hr />
            </pre>
          )}
        />
      </CardContent>
    </Card>
  );
};

export default WebSocketMessageLog;
