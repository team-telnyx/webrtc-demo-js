import {
  CallHistoryEntry,
  useAddCallHistory,
  useCallHistory,
} from "@/atoms/callHistory";
import { useCallOptions } from "@/atoms/callOptions";
import { useTelnyxClient } from "@/atoms/telnyxClient";
import { PhoneIncoming, PhoneOutgoing, TrashIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { useEffect } from "react";
import { Button } from "./ui/button";
import List from "./List";
import { INotification } from "@telnyx/webrtc";

const CallDirectionIcon = (props: { direction: "inbound" | "outbound" }) => {
  return props.direction === "inbound" ? (
    <PhoneIncoming className="flex-shrink-0 w-4 h-4 text-red-300" />
  ) : (
    <PhoneOutgoing className="flex-shrink-0 w-4 h-4 text-green-300" />
  );
};
const CallHistory = () => {
  const [history, setHistory] = useCallHistory();
  const addCallHistory = useAddCallHistory();
  const [client] = useTelnyxClient();
  const [callOptions, setCallOptions] = useCallOptions();

  const onItemClick = (item: CallHistoryEntry) => {
    const newCallOptions = {
      ...callOptions,
      destinationNumber: item.destinationNumber,
    };
    setCallOptions(newCallOptions);

    client?.newCall(newCallOptions);
  };

  useEffect(() => {
    if (!client) return;
    const onNotification = (notification: INotification) => {
      if (notification.type !== "callUpdate") return;
      if (!notification.call) return;
      if (["hangup", "done"].includes(notification.call.state)) {
        addCallHistory(notification.call);
      }
    };
    client.on("telnyx.notification", onNotification);
    return () => {
      client.off("telnyx.notification", onNotification);
    };
  }, [addCallHistory, client, history]);

  const onClearHistory = () => {
    setHistory([]);
  };
  return (
    <Card>
      <CardHeader>
        <CardTitle>Call History</CardTitle>
      </CardHeader>
      <CardContent>
        <List
          className="h-[300px] overflow-y-auto"
          items={history}
          renderItem={(hist) => (
            <div onClick={() => onItemClick(hist)} key={hist.id}>
              <li className="flex gap-2 px-2 py-4 items-center cursor-pointer ">
                <CallDirectionIcon direction={hist.direction} />
                <div>
                  <h2 className="uppercase text-xs mb-0 text-muted-foreground overflow-ellipsis">
                    {hist.direction}
                  </h2>
                  <h1 className="font-mono">{hist.destinationNumber}</h1>
                </div>
              </li>
              <hr />
            </div>
          )}
        />
      </CardContent>
      <CardFooter>
        <Button onClick={onClearHistory} className="w-full" variant={"outline"}>
          <TrashIcon className="w-4 h-4" /> Clear History
        </Button>
      </CardFooter>
    </Card>
  );
};

export default CallHistory;
