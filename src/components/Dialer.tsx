import { ICallOptions, useCallOptions } from "@/atoms/callOptions";
import { useConnectionStatus, useTelnyxClient } from "@/atoms/telnyxClient";
import { useTelnyxNotification } from "@/atoms/telnyxNotification";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Phone, PhoneOff } from "lucide-react";
import { useCallback } from "react";
import { toast } from "sonner";
import { Input } from "./ui/input";
import { useLog } from "@/atoms/log";
import { DialButton, DialButtonData } from "./DialButton";

const Dialer = () => {
  const [callOptions, setCallOptions] = useCallOptions();
  const [connectionStatus] = useConnectionStatus();
  const { pushLog } = useLog();
  const [notification] = useTelnyxNotification();

  const [client] = useTelnyxClient();
  const onDialButtonClick = useCallback(
    (data: DialButtonData) => {
      setCallOptions((prev: ICallOptions) => ({
        ...prev,
        destinationNumber: prev.destinationNumber + data.digit,
      }));
    },
    [setCallOptions]
  );

  const hasActiveCall = notification?.call && 
    ["active", "held", "connecting", "trying", "ringing", "requesting"].includes(notification.call.state);

  const onHangupCall = () => {
    if (notification?.call) {
      pushLog({
        id: "hangingUpCall",
        description: "Hanging up call",
      });
      notification.call.hangup();
    }
  };

  const onStartCall = () => {
    if (hasActiveCall) {
      onHangupCall();
      return;
    }

    if (!client) {
      toast("Telnyx client not initialized");
      return;
    }
    if (connectionStatus !== "registered") {
      toast("Telnyx is not registered yet");
      return;
    }

    if (!callOptions.destinationNumber) {
      toast("Destination number is required");
      return;
    }
    pushLog({
      id: "callingDestination",
      description: `Calling: ${callOptions.destinationNumber}`,
    });

    client.newCall(callOptions);
  };
  return (
    <Card>
      <CardHeader>
        <CardTitle>Dialer</CardTitle>
      </CardHeader>
      <CardContent>
        <Input
          data-testid="input-destination"
          onChange={(e) =>
            setCallOptions((prev: ICallOptions) => ({
              ...prev,
              destinationNumber: e.target.value,
            }))
          }
          value={callOptions.destinationNumber}
          placeholder="000-000-000"
          className="text-center font-semibold text-xl"
        />
        <div
          data-testid="dialpad"
          className="grid grid-cols-3 gap-4 mt-4 place-items-center"
        >
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
          <DialButton className="hidden" digit="Backspace" />
          <DialButton className="hidden" digit="Call" />
        </div>
      </CardContent>
      <CardFooter className="justify-center">
        <DialButton
          data-testid={hasActiveCall ? "btn-hangup" : "btn-call"}
          disabled={
            !hasActiveCall && (
              callOptions.destinationNumber == "" ||
              connectionStatus !== "registered"
            )
          }
          onClick={onStartCall}
          digit={hasActiveCall ? <PhoneOff /> : <Phone />}
          className={
            hasActiveCall
              ? "bg-red-500 text-white hover:bg-red-600 w-10 h-10"
              : "bg-[#00E3AA] text-black hover:bg-[#00C99B] disabled:opacity-75 disabled:cursor-not-allowed w-10 h-10"
          }
        ></DialButton>
      </CardFooter>
    </Card>
  );
};

export default Dialer;
