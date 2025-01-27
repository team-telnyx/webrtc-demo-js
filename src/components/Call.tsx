import { useTelnyxNotification } from "@/atoms/telnyxNotification";
import IncomingCall from "./IncomingCall";
import ActiveCall from "./ActiveCall";
import ConnectingCall from "./ConnectingCall";
import HeldCall from "./HeldCall";

export const Call = () => {
  const [notification] = useTelnyxNotification();
  if (!notification) return null;

  switch (notification.call.state) {
    case "connecting":
    case "trying": {
      return <ConnectingCall call={notification.call} />;
    }
    case "ringing":
    case "requesting ": {
      return <IncomingCall call={notification.call} />;
    }

    case "active": {
      return <ActiveCall call={notification.call} />;
    }

    case "held": {
      return <HeldCall call={notification.call} />;
    }
    default: {
      return null;
    }
  }
};
