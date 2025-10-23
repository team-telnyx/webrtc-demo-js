import { useState } from "react";
import { Button } from "./ui/button";
import { useTelnyxClient } from "@/atoms/telnyxClient";
import clsx from "clsx";

type Props = {
  showIndicator?: boolean;
};

const CheckRegistrationButton = ({ showIndicator }: Props) => {
  const [client] = useTelnyxClient();
  const [isRegistered, setIsRegistered] = useState<boolean | null>(null);

  const onCheckRegistration = async () => {
    if (!client) return;

    setIsRegistered(await client.getIsRegistered());
  };
  return (
    <Button variant="ghost" onClick={onCheckRegistration}>
      Check Registration Status
      {showIndicator && isRegistered !== null && (
        <span
          className={clsx({
            "text-red-500": isRegistered === false,
            "text-green-500": isRegistered === true,
          })}
        >
          ●
        </span>
      )}
    </Button>
  );
};

export default CheckRegistrationButton;
