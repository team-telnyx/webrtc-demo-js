import { useClientOptions } from "@/atoms/clientOptions";
import { useConnectionStatus } from "@/atoms/telnyxClient";
import { clsx } from "clsx";

const ConnectionStatus = () => {
  const [status] = useConnectionStatus();
  const [clientOptions] = useClientOptions();
  return (
    <h3
      className={clsx({
        "text-red-500": status === "disconnected",
        "text-yellow-500": status === "connecting",
        "text-green-500": status === "registered",
      })}
    >
      {status} ({status === "registered" && clientOptions.login})
    </h3>
  );
};

export default ConnectionStatus;
