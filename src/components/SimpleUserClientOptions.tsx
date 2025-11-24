import { useSimpleUserClientOptions } from "@/atoms/simpleUserClientOptions";
import { ISimpleUserClientOptions, SipJsLogLevel } from "@/lib/types";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const logLevels: SipJsLogLevel[] = ["debug", "log", "warn", "error", "off"];

const SimpleUserClientOptions = () => {
  const [clientOptions, setClientOptions] = useSimpleUserClientOptions();
  const form = useForm<ISimpleUserClientOptions>({
    values: clientOptions,
  });

  const onSubmit = (values: ISimpleUserClientOptions) => {
    setClientOptions({
      ...values,
      stunServers: values.stunServers
        ? values.stunServers.filter(Boolean)
        : undefined,
      turnServer:
        values.turnServer &&
        values.turnServer.urls &&
        values.turnServer.urls.length > 0
          ? {
              urls: values.turnServer.urls.trim(),
              username: values.turnServer.username?.trim(),
              password: values.turnServer.password?.trim(),
            }
          : undefined,
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
                      <Input placeholder="sip.telnyx.com" {...field} />
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
                      <Input placeholder="7443" {...field} />
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
                    <Input placeholder="wss://sip.telnyx.com:7443" {...field} />
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
                      <Input placeholder="SIP username" {...field} />
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
                      <Input type="password" placeholder="••••••" {...field} />
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
                      <Input placeholder="Phone User" {...field} />
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
                      <Input placeholder="sip:sip.telnyx.com:7443" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="logLevel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Log Level</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {logLevels.map((level) => (
                        <SelectItem key={level} value={level}>
                          {level.toUpperCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="stunServers"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>STUN Servers</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="One server per line"
                      value={(field.value ?? []).join("\n")}
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
            <div className="grid md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="turnServer.urls"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>TURN Server URL</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="turn:turn.telnyx.com:3478?transport=tcp"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="turnServer.username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>TURN Username</FormLabel>
                    <FormControl>
                      <Input placeholder="Username" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="turnServer.password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>TURN Password</FormLabel>
                    <FormControl>
                      <Input placeholder="Password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="remoteAudioElementId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Remote Audio Element ID</FormLabel>
                  <FormControl>
                    <Input
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
            <Button type="submit">Save Client Options</Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
};

export default SimpleUserClientOptions;
