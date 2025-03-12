import { useTelnyxNotification } from "@/atoms/telnyxNotification";
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
      // Incoming calls are now handled in the Dialer component
      return null;
    }

    case "active": {
      // Active calls are now displayed in the Dialer component
      // but we still keep the ActiveCall component for the keyboard and other features
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
