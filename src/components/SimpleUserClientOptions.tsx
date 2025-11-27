import { useSimpleUserClientOptions } from "@/atoms/simpleUserClientOptions";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { TelnyxDeviceConfig } from "@telnyx/rtc-sipjs-simple-user";

type FormValues = Omit<TelnyxDeviceConfig, "remoteAudioElement"> & {
  remoteAudioElementId?: string;
};

const SimpleUserClientOptions = () => {
  const [clientOptions, setClientOptions] = useSimpleUserClientOptions();
  const form = useForm<FormValues>({
    values: {
      ...clientOptions,
      remoteAudioElementId: clientOptions.remoteAudioElement?.id,
    },
  });

  const onSubmit = (values: FormValues) => {
    const { remoteAudioElementId, ...rest } = values;
    const remoteAudioElement = remoteAudioElementId
      ? (document.getElementById(remoteAudioElementId) as HTMLAudioElement | null)
      : undefined;

    setClientOptions({
      ...rest,
      stunServers: values.stunServers
        ? (values.stunServers as string[]).filter(Boolean)
        : undefined,
      turnServers: values.turnServers ?? undefined,
      remoteAudioElement: remoteAudioElement ?? undefined,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>SIP.js Client Options</CardTitle>
        <CardDescription>
          Configure the SimpleUser-backed TelnyxDevice connection.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="host"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Host</FormLabel>
                    <FormControl>
                      <Input
                        data-testid="input-host"
                        placeholder="sip.telnyx.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="port"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Port</FormLabel>
                    <FormControl>
                      <Input
                        data-testid="input-port"
                        placeholder="7443"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="wsServers"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>WebSocket Servers</FormLabel>
                  <FormControl>
                    <Input
                      data-testid="input-ws-servers"
                      placeholder="wss://sip.telnyx.com:7443"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input
                        data-testid="input-username"
                        placeholder="SIP username"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        data-testid="input-password"
                        type="password"
                        placeholder="••••••"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display Name</FormLabel>
                    <FormControl>
                      <Input
                        data-testid="input-display-name"
                        placeholder="Phone User"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="registrarServer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Registrar Server</FormLabel>
                    <FormControl>
                      <Input
                        data-testid="input-registrar-server"
                        placeholder="sip:sip.telnyx.com:7443"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="stunServers"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>STUN Servers</FormLabel>
                  <FormControl>
                    <Textarea
                      data-testid="input-stun-servers"
                      placeholder="One server per line"
                      value={Array.isArray(field.value) ? field.value.join("\n") : (field.value ?? "")}
                      onChange={(event) =>
                        field.onChange(
                          event.target.value
                            .split("\n")
                            .map((line) => line.trim())
                            .filter(Boolean)
                        )
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="turnServers"
              render={({ field }) => {
                const turnServer =
                  Array.isArray(field.value) ? field.value[0] : field.value;
                const updateTurnServer = (
                  key: "urls" | "username" | "password",
                  value: string
                ) => {
                  const current =
                    Array.isArray(field.value) ? field.value[0] : field.value;
                  field.onChange({ ...current, [key]: value });
                };
                return (
                  <div className="grid md:grid-cols-3 gap-4">
                    <FormItem>
                      <FormLabel>TURN Server URL</FormLabel>
                      <FormControl>
                        <Input
                          data-testid="input-turn-server-url"
                          placeholder="turn:turn.telnyx.com:3478?transport=tcp"
                          value={(turnServer?.urls as string) ?? ""}
                          onChange={(e) =>
                            updateTurnServer("urls", e.target.value)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                    <FormItem>
                      <FormLabel>TURN Username</FormLabel>
                      <FormControl>
                        <Input
                          data-testid="input-turn-username"
                          placeholder="Username"
                          value={turnServer?.username ?? ""}
                          onChange={(e) =>
                            updateTurnServer("username", e.target.value)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                    <FormItem>
                      <FormLabel>TURN Password</FormLabel>
                      <FormControl>
                        <Input
                          data-testid="input-turn-password"
                          placeholder="Password"
                          value={turnServer?.password ?? ""}
                          onChange={(e) =>
                            updateTurnServer("password", e.target.value)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  </div>
                );
              }}
            />
            <FormField
              control={form.control}
              name="remoteAudioElementId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Remote Audio Element ID</FormLabel>
                  <FormControl>
                    <Input
                      data-testid="input-remote-audio-element-id"
                      placeholder="telnyx-simple-user-remote-audio"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="justify-end">
            <Button data-testid="btn-save-client-options" type="submit">
              Save Client Options
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
};

export default SimpleUserClientOptions;
