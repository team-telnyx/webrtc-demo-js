import { useLog } from "@/atoms/log";
import { useTelnyxSdkClient } from "@/atoms/telnyxClient";
import { useEffect } from "react";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";

// Legacy component that is only used for compatibility with the black box test suite.
const BlackBoxTestLog = () => {
  const { logs, pushLog, clear } = useLog();
  const [client] = useTelnyxSdkClient();
  useEffect(() => {
    const onReady = () => {
      pushLog({ id: "registered", description: "registered" });
    };

    const onCloseOrError = () => {
      pushLog({ id: "unregistered", description: "unregistered" });
    };

    client?.on("telnyx.ready", onReady);
    client?.on("telnyx.socket.close", onCloseOrError);
    client?.on("telnyx.socket.error", onCloseOrError);
    client?.on("telnyx.error", onCloseOrError);

    return () => {
      client?.off("telnyx.ready", onReady);
      client?.off("telnyx.socket.close", onCloseOrError);
      client?.off("telnyx.socket.error", onCloseOrError);
      client?.off("telnyx.error", onCloseOrError);
    };
  }, [client, pushLog]);
  return (
    <Card data-testid="logs">
      <CardHeader>
        <CardTitle>Logs</CardTitle>
        <CardDescription>Application Logs.</CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <pre data-testid="log-webrtc" className="font-mono">
          {logs.map((log, index) => (
            <div
              data-testid={`log-webrtc-children-${log.id}`}
              key={`${log.id}_${index}`}
            >
              {log.description}
            </div>
          ))}
        </pre>
      </CardContent>
      <CardFooter>
        <Button variant="outline" className="w-full" onClick={clear}>
          Clear Logs
        </Button>
      </CardFooter>
    </Card>
  );
};

export default BlackBoxTestLog;
