import { useTelnyxNotification } from "@/atoms/telnyxNotification";
import IncomingCall from "./IncomingCall";
import ActiveCall from "./ActiveCall";
import ConnectingCall from "./ConnectingCall";
import HeldCall from "./HeldCall";
import { capitalizeFirstLetter } from "@/lib/string";

export const Call = () => {
  const [notification] = useTelnyxNotification();
  if (!notification || !notification.call) return null;

  // @ts-expect-error beta option
  if (notification.call.options.keepConnectionAliveOnSocketClose) {
    switch (notification.call.state) {
      case "trying":
      case "requesting": {
        return <IncomingCall call={notification.call} />;
      }

      case "new":
      case "ringing":
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
        console.error("Unknown call state:", notification.call.state);
        return null;
      }
    }
  }

  switch (notification.call.state) {
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
