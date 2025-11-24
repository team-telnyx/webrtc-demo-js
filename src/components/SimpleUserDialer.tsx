import { useCallback, useEffect, useMemo, useRef } from "react";
import { useSimpleUserCallOptions } from "@/atoms/simpleUserCallOptions";
import { useSimpleUserClientOptions } from "@/atoms/simpleUserClientOptions";
import {
  useSipJsClient,
  useSipJsWsStatus,
  useSipJsRegistrationStatus,
  useSipJsCallStatus,
} from "@/atoms/telnyxClient";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DialButton } from "./DialButton";
import { toast } from "sonner";
import type { TelnyxCall } from "@telnyx/rtc-sipjs-simple-user/dist/types/lib/telnyx-call";
import { DeviceEvent, CallEvent } from "@telnyx/rtc-sipjs-simple-user";

const SimpleUserDialer = () => {
  const [client] = useSipJsClient();
  const [callOptions, setCallOptions] = useSimpleUserCallOptions();
  const [clientOptions] = useSimpleUserClientOptions();
  const [wsStatus, setWsStatus] = useSipJsWsStatus();
  const [registrationStatus, setRegistrationStatus] =
    useSipJsRegistrationStatus();
  const [callStatus, setCallStatus] = useSipJsCallStatus();
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
      // Clean up previous call listeners
      callCleanupRef.current?.();
      activeCallRef.current = call;
      setCallStatus(direction === "incoming" ? "incoming" : "dialing");

      // Set up call event listeners
      const handleConnecting = () => {
        console.log("[Call] Connecting");
        setCallStatus("connecting");
      };

      const handleAccepted = () => {
        console.log("[Call] Accepted");
        setCallStatus("connected");
      };

      const handleTerminated = () => {
        console.log("[Call] Terminated");
        setCallStatus("ended");
        activeCallRef.current = null;
        callCleanupRef.current = null;
      };

      const handleFailed = (error: Error) => {
        console.error("[Call] Failed:", error);
        setCallStatus("failed");
        toast.error(`Call failed: ${error.message}`);
        activeCallRef.current = null;
        callCleanupRef.current = null;
      };

      const handleRejected = () => {
        console.log("[Call] Rejected");
        setCallStatus("ended");
        activeCallRef.current = null;
        callCleanupRef.current = null;
      };

      const handleMuted = () => {
        console.log("[Call] Muted");
      };

      const handleUnmuted = () => {
        console.log("[Call] Unmuted");
      };

      const handleHeld = () => {
        console.log("[Call] Held");
      };

      const handleResumed = () => {
        console.log("[Call] Resumed");
      };

      // Attach call event listeners
      call.on(CallEvent.Connecting, handleConnecting);
      call.on(CallEvent.Accepted, handleAccepted);
      call.on(CallEvent.Terminated, handleTerminated);
      call.on(CallEvent.Failed, handleFailed);
      call.on(CallEvent.Rejected, handleRejected);
      call.on(CallEvent.Muted, handleMuted);
      call.on(CallEvent.Unmuted, handleUnmuted);
      call.on(CallEvent.Held, handleHeld);
      call.on(CallEvent.Resumed, handleResumed);

      // Store cleanup function
      callCleanupRef.current = () => {
        call.off(CallEvent.Connecting, handleConnecting);
        call.off(CallEvent.Accepted, handleAccepted);
        call.off(CallEvent.Terminated, handleTerminated);
        call.off(CallEvent.Failed, handleFailed);
        call.off(CallEvent.Rejected, handleRejected);
        call.off(CallEvent.Muted, handleMuted);
        call.off(CallEvent.Unmuted, handleUnmuted);
        call.off(CallEvent.Held, handleHeld);
        call.off(CallEvent.Resumed, handleResumed);
      };
    },
    [setCallStatus]
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

    // Set up device event listeners
    const handleWsConnecting = ({ attempts }: { attempts: number }) => {
      console.log(`[Device] WebSocket connecting (attempt ${attempts})`);
      setWsStatus("connecting");
    };

    const handleWsConnected = () => {
      console.log("[Device] WebSocket connected");
      setWsStatus("connected");
    };

    const handleWsDisconnected = () => {
      console.log("[Device] WebSocket disconnected");
      setWsStatus("disconnected");
    };

    const handleRegistered = () => {
      console.log("[Device] Registered");
      setRegistrationStatus("registered");
    };

    const handleUnregistered = () => {
      console.log("[Device] Unregistered");
      setRegistrationStatus("unregistered");
    };

    const handleRegistrationFailed = ({ cause }: { cause: Error }) => {
      console.error("[Device] Registration failed:", cause);
      setRegistrationStatus("unregistered");
      toast.error(`Registration failed: ${cause.message}`);
    };

    const handleIncomingInvite = ({ activeCall }: { activeCall: TelnyxCall }) => {
      console.log("[Device] Incoming call");
      toast("Incoming call");
      attachCallListeners(activeCall, "incoming");
    };

    const handleMessage = ({ body }: { body: string }) => {
      console.log("[Device] SIP message received:", body);
    };

    // Attach device event listeners
    client.on(DeviceEvent.WsConnecting, handleWsConnecting);
    client.on(DeviceEvent.WsConnected, handleWsConnected);
    client.on(DeviceEvent.WsDisconnected, handleWsDisconnected);
    client.on(DeviceEvent.Registered, handleRegistered);
    client.on(DeviceEvent.Unregistered, handleUnregistered);
    client.on(DeviceEvent.RegistrationFailed, handleRegistrationFailed);
    client.on(DeviceEvent.IncomingInvite, handleIncomingInvite);
    client.on(DeviceEvent.Message, handleMessage);

    // Cleanup function
    return () => {
      client.off(DeviceEvent.WsConnecting, handleWsConnecting);
      client.off(DeviceEvent.WsConnected, handleWsConnected);
      client.off(DeviceEvent.WsDisconnected, handleWsDisconnected);
      client.off(DeviceEvent.Registered, handleRegistered);
      client.off(DeviceEvent.Unregistered, handleUnregistered);
      client.off(DeviceEvent.RegistrationFailed, handleRegistrationFailed);
      client.off(DeviceEvent.IncomingInvite, handleIncomingInvite);
      client.off(DeviceEvent.Message, handleMessage);
    };
  }, [attachCallListeners, client, setWsStatus, setRegistrationStatus, setCallStatus]);

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
      // Status will be updated via DeviceEvent.WsConnected event
    } catch (error) {
      console.error("Failed to start WebSocket", error);
      toast.error("Failed to connect WebSocket");
      setWsStatus("disconnected");
    }
  };

  const handleDisconnect = async () => {
    if (!client) return;
    try {
      await client.stopWS();
      // Status will be updated via DeviceEvent.WsDisconnected event
    } catch (error) {
      console.error("Failed to disconnect WebSocket", error);
      toast.error("Failed to disconnect WebSocket");
    }
  };

  const handleRegister = async () => {
    if (!client) return;
    setRegistrationStatus("registering");
    try {
      await client.register({ extraHeaders: registerExtraHeaders });
      // Status will be updated via DeviceEvent.Registered event
    } catch (error) {
      console.error("Failed to register", error);
      toast.error("Failed to register");
      setRegistrationStatus("unregistered");
    }
  };

  const handleUnregister = async () => {
    if (!client) return;
    try {
      await client.unregister({ extraHeaders: registerExtraHeaders });
      // Status will be updated via DeviceEvent.Unregistered event
    } catch (error) {
      console.error("Failed to unregister", error);
      toast.error("Failed to unregister");
    }
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
