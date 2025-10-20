import { Button } from "./ui/button";
import { useTelnyxClient } from "@/atoms/telnyxClient";

const CheckRegistrationButton = () => {
  const [client] = useTelnyxClient();

  const onCheckRegistration = async () => {
    if (!client) return;

    // @ts-expect-error getIsRegistered type support are in beta
    await client.getIsRegistered();
  };
  return (
    <Button variant="ghost" onClick={onCheckRegistration}>
      Check Registration Status
    </Button>
  );
};

export default CheckRegistrationButton;
