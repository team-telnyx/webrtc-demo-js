import {
  useSipJsWsStatus,
  useSipJsRegistrationStatus,
  useSipJsCallStatus,
  type CallStatus,
} from "@/atoms/telnyxClient";
import { useSimpleUserClientOptions } from "@/atoms/simpleUserClientOptions";
import { clsx } from "clsx";

const statusCopy: Record<CallStatus, string> = {
  idle: "Idle",
  incoming: "Incoming call",
  dialing: "Dialing…",
  connecting: "Connecting…",
  connected: "Call active",
  ended: "Call ended",
  failed: "Call failed",
};

const SipJsConnectionStatus = () => {
  const [wsStatus] = useSipJsWsStatus();
  const [registrationStatus] = useSipJsRegistrationStatus();
  const [callStatus] = useSipJsCallStatus();
  const [clientOptions] = useSimpleUserClientOptions();

  return (
    <div className="flex flex-col text-sm text-right">
      <div
        className={clsx({
          "text-gray-500": wsStatus === "idle",
          "text-red-500": wsStatus === "disconnected",
          "text-yellow-500": wsStatus === "connecting",
          "text-green-500": wsStatus === "connected",
        })}
      >
        WebSocket: {wsStatus}
      </div>
      {wsStatus !== "idle" && (
        <div
          className={clsx({
            "text-gray-500": registrationStatus === "idle",
            "text-red-500": registrationStatus === "unregistered",
            "text-yellow-500": registrationStatus === "registering",
            "text-green-500": registrationStatus === "registered",
          })}
        >
          Registration: {registrationStatus}
          {registrationStatus === "registered" &&
            ` (${clientOptions.username})`}
        </div>
      )}
      {registrationStatus !== "idle" && (
        <div
          className={clsx({
            "text-gray-500": callStatus === "idle",
            "text-yellow-500":
              callStatus === "incoming" ||
              callStatus === "dialing" ||
              callStatus === "connecting",
            "text-green-500": callStatus === "connected",
            "text-red-500": callStatus === "failed",
          })}
        >
          Call: {statusCopy[callStatus]}
        </div>
      )}
    </div>
  );
};

export default SipJsConnectionStatus;
