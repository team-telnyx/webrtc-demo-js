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
import { Phone, PhoneOff, Pause } from "lucide-react";
import { useCallback } from "react";
import { toast } from "sonner";
import { Input } from "./ui/input";
import { useLog } from "@/atoms/log";
import { DialButton, DialButtonData } from "./DialButton";
import AudioVisualizer from "./AudioVisualizer";

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
    
  const isIncomingCall = notification?.call && 
    ["ringing", "requesting"].includes(notification.call.state);
    
  const isEstablishedCall = notification?.call && 
    ["active", "held"].includes(notification.call.state);

  const onHangupCall = () => {
    if (notification?.call) {
      pushLog({
        id: "hangingUpCall",
        description: "Hanging up call",
      });
      notification.call.hangup();
    }
  };
  
  const onAnswerCall = () => {
    if (isIncomingCall && notification?.call) {
      pushLog({
        id: "answeringCall",
        description: "Answering incoming call",
      });
      notification.call.answer(callOptions);
    }
  };
  
  const onHoldCall = () => {
    if (isEstablishedCall && notification?.call) {
      pushLog({
        id: "holdingCall",
        description: "Holding call",
      });
      notification.call.hold();
    }
  };

  const onStartCall = () => {
    if (isIncomingCall) {
      onAnswerCall();
      return;
    }
    
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
      {hasActiveCall && (
        <div className="px-4 pb-4">
          <div className="flex flex-col space-y-4 items-center">
            {notification?.call && (
              <>
                <h1 className="text-sm font-medium">Inbound</h1>
                <AudioVisualizer mediaStream={notification.call.remoteStream} />
                
                <h1 className="text-sm font-medium">Outbound</h1>
                <AudioVisualizer mediaStream={notification.call.localStream} color="#fff" />
                
                {isEstablishedCall && notification.call.debugEnabled && (
                  <div className="w-full p-2 border rounded text-xs">
                    <h2 className="font-bold mb-1">Call Metrics:</h2>
                    <p>Call ID: {notification.call.id}</p>
                    <p>State: {notification.call.state}</p>
                    {notification.call.sipCallId && <p>SIP Call ID: {notification.call.sipCallId}</p>}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
      
      <CardFooter className="justify-center gap-2">
        <DialButton
          data-testid="btn-call"
          disabled={
            !isIncomingCall && !hasActiveCall && (
              callOptions.destinationNumber == "" ||
              connectionStatus !== "registered"
            )
          }
          onClick={onStartCall}
          digit={<Phone />}
          className="bg-[#00E3AA] text-black hover:bg-[#00C99B] disabled:opacity-75 disabled:cursor-not-allowed w-10 h-10"
        />
        
        {isEstablishedCall && (
          <DialButton
            data-testid="btn-hold"
            onClick={onHoldCall}
            digit={<Pause />}
            className="bg-yellow-500 text-black hover:bg-yellow-600 w-10 h-10"
          />
        )}
        
        {hasActiveCall && (
          <DialButton
            data-testid="btn-hangup"
            onClick={onHangupCall}
            digit={<PhoneOff />}
            className="bg-red-500 text-white hover:bg-red-600 w-10 h-10"
          />
        )}
      </CardFooter>
    </Card>
  );
};

export default Dialer;
