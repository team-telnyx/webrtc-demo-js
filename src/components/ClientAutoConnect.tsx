import { useConnectionStatus, useTelnyxClient } from "@/atoms/telnyxClient";
import { useEffect } from "react";

type SocketMessage = {
  result: {
    params: {
      state: string;
    };
  };
};

const ClientAutoConnect = () => {
  const [client] = useTelnyxClient();
  const [, setStatus] = useConnectionStatus();

  useEffect(() => {
    if (!client) {
      return;
    }

    const onReady = () => {
      setStatus("registered");
    };
    const onSocketMessage = (message: SocketMessage) => {
      if (["REGISTER", "REGED"].includes(message.result?.params.state)) {
        setStatus("registered");
      }
    };

    const onError = () => {
      setStatus("disconnected");
    };

    const onSocketOpen = () => {
      setStatus("registering");
    };

    const onSocketClose = () => {
      setStatus("disconnected");
    };
    const onSocketError = () => {
      setStatus("disconnected");
    };

    setStatus("connecting");
    client.connect().then(() => {
      client.on("telnyx.ready", onReady);
      client.on("telnyx.error", onError);
      client.on("telnyx.socket.message", onSocketMessage);
      client.on("telnyx.socket.open", onSocketOpen);
      client.on("telnyx.socket.close", onSocketClose);
      client.on("telnyx.socket.error", onSocketError);
    });

    return () => {
      setStatus("disconnected");
      client.disconnect();
      client.off("telnyx.ready", onReady);
      client.off("telnyx.error", onError);
      client.off("telnyx.socket.message", onSocketMessage);
      client.off("telnyx.socket.open", onSocketOpen);
      client.off("telnyx.socket.close", onSocketClose);
      client.off("telnyx.socket.error", onSocketError);
    };
  }, [client, setStatus]);
  return null;
};

export default ClientAutoConnect;
