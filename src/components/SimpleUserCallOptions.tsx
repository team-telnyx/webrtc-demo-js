import { useSimpleUserCallOptions } from "@/atoms/simpleUserCallOptions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

const SimpleUserCallOptions = () => {
  const [callOptions, setCallOptions] = useSimpleUserCallOptions();

  const onSetExtraHeaders = (value: string) => {
    const headers = value
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    setCallOptions((prev) => ({ ...prev, extraHeaders: headers }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>SIP.js Call Options</CardTitle>
        <CardDescription>
          Configure how the SimpleUser client registers with the SIP network.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between rounded border px-3 py-2">
          <div>
            <Label htmlFor="auto-register">Auto Register</Label>
            <p className="text-xs text-muted-foreground">
              Automatically register after the WebSocket is connected.
            </p>
          </div>
          <Switch
            id="auto-register"
            checked={callOptions.autoRegister}
            onCheckedChange={(checked) =>
              setCallOptions((prev) => ({ ...prev, autoRegister: checked }))
            }
          />
        </div>
        <div>
          <Label htmlFor="simple-user-extra-headers">Extra Headers</Label>
          <Textarea
            id="simple-user-extra-headers"
            placeholder="X-Custom-Header: value"
            value={callOptions.extraHeaders.join("\n")}
            onChange={(event) => onSetExtraHeaders(event.target.value)}
            rows={4}
          />
          <p className="text-xs text-muted-foreground mt-2">
            Provide SIP headers (one per line) to include when registering or
            unregistering.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default SimpleUserCallOptions;
