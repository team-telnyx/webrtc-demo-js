import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSimpleUserCallOptions } from "@/atoms/simpleUserCallOptions";
import { useSimpleUserClientOptions } from "@/atoms/simpleUserClientOptions";
import { useSipJsClient } from "@/atoms/telnyxClient";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DialButton } from "./DialButton";
import { toast } from "sonner";
import type { TelnyxCall } from "@telnyx/rtc-sipjs-simple-user/dist/types/lib/telnyx-call";

type WsStatus = "idle" | "connecting" | "connected" | "disconnected";
type RegistrationStatus = "unregistered" | "registering" | "registered";
type CallStatus =
  | "idle"
  | "incoming"
  | "dialing"
  | "connecting"
  | "connected"
  | "ended"
  | "failed";

const statusCopy: Record<CallStatus, string> = {
  idle: "Idle",
  incoming: "Incoming call",
  dialing: "Dialing…",
  connecting: "Connecting…",
  connected: "Call active",
  ended: "Call ended",
  failed: "Call failed",
};

const SimpleUserDialer = () => {
  const [client] = useSipJsClient();
  const [callOptions, setCallOptions] = useSimpleUserCallOptions();
  const [clientOptions] = useSimpleUserClientOptions();
  const [wsStatus, setWsStatus] = useState<WsStatus>("idle");
  const [registrationStatus, setRegistrationStatus] =
    useState<RegistrationStatus>("unregistered");
  const [callStatus, setCallStatus] = useState<CallStatus>("idle");
  const [callDirection, setCallDirection] = useState<
    "incoming" | "outgoing" | null
  >(null);
  const activeCallRef = useRef<TelnyxCall | null>(null);
  const callCleanupRef = useRef<(() => void) | null>(null);

  const setDestination = useCallback(
    (value: string) => {
      setCallOptions((prev) => ({
        ...prev,
        destinationNumber: value,
      }));
    },
    [setCallOptions]
  );

  const attachCallListeners = useCallback(
    (call: TelnyxCall, direction: "incoming" | "outgoing") => {
      callCleanupRef.current?.();
      activeCallRef.current = call;
      setCallDirection(direction);
      setCallStatus(direction === "incoming" ? "incoming" : "dialing");
    },
    []
  );

  useEffect(() => {
    if (!client) {
      setWsStatus("idle");
      setRegistrationStatus("unregistered");
      setCallStatus("idle");
      activeCallRef.current = null;
      callCleanupRef.current?.();
      callCleanupRef.current = null;
      return;
    }
  }, [attachCallListeners, client]);

  useEffect(() => {
    return () => {
      callCleanupRef.current?.();
      callCleanupRef.current = null;
    };
  }, []);

  const registerExtraHeaders = useMemo(
    () =>
      callOptions.extraHeaders.length > 0
        ? callOptions.extraHeaders
        : undefined,
    [callOptions.extraHeaders]
  );

  const handleConnect = async () => {
    if (!client) return;
    try {
      await client.startWS();
      if (callOptions.autoRegister) {
        client.register({ extraHeaders: registerExtraHeaders });
        setRegistrationStatus("registering");
      }
    } catch (error) {
      console.error("Failed to start WebSocket", error);
      toast.error("Failed to start SIP.js client");
    }
  };

  const handleDisconnect = async () => {
    if (!client) return;
    try {
      await client.stopWS();
    } catch (error) {
      console.error("Failed to disconnect WebSocket", error);
    } finally {
      setWsStatus("idle");
      setRegistrationStatus("unregistered");
    }
  };

  const handleRegister = () => {
    if (!client) return;
    setRegistrationStatus("registering");
    client.register({ extraHeaders: registerExtraHeaders });
  };

  const handleUnregister = () => {
    if (!client) return;
    client.unregister({ extraHeaders: registerExtraHeaders });
  };

  const handlePlaceCall = () => {
    if (!client || !callOptions.destinationNumber) {
      toast("Enter a destination number");
      return;
    }
    try {
      const call = client.initiateCall(callOptions.destinationNumber);
      attachCallListeners(call, "outgoing");
    } catch (error) {
      console.error("Failed to start call", error);
      toast.error("Failed to start call");
    }
  };

  const handleHangup = () => {
    const call = activeCallRef.current;
    if (!call) return;
    call.disconnect();
  };

  const handleAccept = () => {
    const call = activeCallRef.current;
    if (!call) return;
    call.accept();
  };

  const handleReject = () => {
    const call = activeCallRef.current;
    if (!call) return;
    call.reject();
  };

  const onDialButtonClick = (value: { digit: string }) => {
    if (!value.digit) return;
    setDestination(callOptions.destinationNumber + value.digit);
  };

  const isConnected = wsStatus === "connected";
  const hasActiveCall =
    callStatus === "incoming" ||
    callStatus === "connecting" ||
    callStatus === "connected" ||
    callStatus === "dialing";

  return (
    <Card>
      <CardHeader>
        <CardTitle>SIP.js Dialer</CardTitle>
        <CardDescription className="space-y-1">
          <div>WebSocket: {wsStatus}</div>
          <div>Registration: {registrationStatus}</div>
          <div>
            Call: {statusCopy[callStatus]}
            {callDirection ? ` (${callDirection})` : ""}
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          value={callOptions.destinationNumber}
          placeholder="Enter destination"
          onChange={(event) => setDestination(event.target.value)}
        />
        <div className="grid grid-cols-3 gap-4 place-items-center">
          <DialButton onClick={onDialButtonClick} digit="1" />
          <DialButton onClick={onDialButtonClick} digit="2" characters="ABC" />
          <DialButton onClick={onDialButtonClick} digit="3" characters="DEF" />
          <DialButton onClick={onDialButtonClick} digit="4" characters="GHI" />
          <DialButton onClick={onDialButtonClick} digit="5" characters="JKL" />
          <DialButton onClick={onDialButtonClick} digit="6" characters="MNO" />
          <DialButton onClick={onDialButtonClick} digit="7" characters="PQRS" />
          <DialButton onClick={onDialButtonClick} digit="8" characters="TUV" />
          <DialButton onClick={onDialButtonClick} digit="9" characters="WXYZ" />
          <DialButton onClick={onDialButtonClick} digit="*" />
          <DialButton onClick={onDialButtonClick} digit="0" />
          <DialButton onClick={onDialButtonClick} digit="#" />
        </div>
        {clientOptions.remoteAudioElementId && (
          <audio
            id={clientOptions.remoteAudioElementId}
            autoPlay
            className="hidden"
          />
        )}
      </CardContent>
      <CardFooter className="flex flex-col gap-2">
        <div className="grid grid-cols-2 gap-2 w-full">
          <Button
            onClick={handleConnect}
            disabled={!client || isConnected}
            variant="secondary"
          >
            Connect
          </Button>
          <Button
            onClick={handleDisconnect}
            disabled={!client || wsStatus === "idle"}
            variant="outline"
          >
            Disconnect
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-2 w-full">
          <Button
            onClick={handleRegister}
            disabled={!client || !isConnected}
            variant="secondary"
          >
            Register
          </Button>
          <Button
            onClick={handleUnregister}
            disabled={!client || registrationStatus === "unregistered"}
            variant="outline"
          >
            Unregister
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-2 w-full">
          <Button
            onClick={handlePlaceCall}
            disabled={!client || !isConnected || hasActiveCall}
          >
            Call
          </Button>
          <Button
            onClick={handleHangup}
            disabled={!hasActiveCall}
            variant="destructive"
          >
            Hangup
          </Button>
        </div>
        {callStatus === "incoming" && (
          <div className="grid grid-cols-2 gap-2 w-full">
            <Button onClick={handleAccept}>Answer</Button>
            <Button onClick={handleReject} variant="outline">
              Reject
            </Button>
          </div>
        )}
      </CardFooter>
    </Card>
  );
};

export default SimpleUserDialer;
