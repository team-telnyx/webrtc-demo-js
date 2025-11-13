import { useTelnyxNotification } from "@/atoms/telnyxNotification";
import IncomingCall from "./IncomingCall";
import ActiveCall from "./ActiveCall";
import ConnectingCall from "./ConnectingCall";
import HeldCall from "./HeldCall";
import { capitalizeFirstLetter } from "@/lib/string";

export const Call = () => {
  const [notification] = useTelnyxNotification();
  if (!notification || !notification.call) return null;

  if (notification.call.options.keepConnectionAliveOnSocketClose) {
    switch (notification.call.state) {
      case "trying":
      case "requesting": {
        return <IncomingCall call={notification.call} />;
      }

      case "ringing": {
        if (notification.call.direction === "inbound") {
          return <IncomingCall call={notification.call} />;
        }

        return (
          <ActiveCall
            call={notification.call}
            title={`${capitalizeFirstLetter(notification.call.state)} Call`}
          />
        );
      }

      case "new":
      case "connecting":
      case "active": {
        return (
          <ActiveCall
            call={notification.call}
            title={`${capitalizeFirstLetter(notification.call.state)} Call`}
          />
        );
      }

      case "held": {
        return <HeldCall call={notification.call} />;
      }
      default: {
        return null;
      }
    }
  }

  switch (notification.call.state) {
    case "connecting":
    case "trying": {
      return <ConnectingCall call={notification.call} />;
    }
    case "ringing":
    case "requesting": {
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
