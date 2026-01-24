import { useSimpleUserClientOptions } from '@/atoms/simpleUserClientOptions';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useForm } from 'react-hook-form';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { TelnyxDeviceConfig } from '@telnyx/rtc-sipjs-simple-user';
import { TurnServersFormField } from './TurnServersFormField';
import { StunServersFormField } from './StunServersFormField';
import { ExtendedTelnyxDeviceConfig } from '@/atoms/simpleUserClientOptions';

type FormValues = Omit<ExtendedTelnyxDeviceConfig, 'remoteAudioElement'> & {
  remoteAudioElementId?: string;
  inboundAliasesAsString?: string;
};

const SimpleUserClientOptions = () => {
  const [clientOptions, setClientOptions] = useSimpleUserClientOptions();
  const form = useForm<FormValues>({
    values: {
      ...clientOptions,
      remoteAudioElementId: clientOptions.remoteAudioElement?.id,
      inboundAliasesAsString: clientOptions.inboundAliases?.join(', ') || '',
    },
  });

  const onSubmit = (values: FormValues) => {
    const { remoteAudioElementId, inboundAliasesAsString, ...rest } = values;
    const remoteAudioElement = remoteAudioElementId
      ? (document.getElementById(
          remoteAudioElementId,
        ) as HTMLAudioElement | null)
      : undefined;

    // Parse comma-separated aliases string into array
    const inboundAliases = inboundAliasesAsString
      ? inboundAliasesAsString
          .split(',')
          .map((alias) => alias.trim())
          .filter((alias) => alias.length > 0)
      : undefined;

    setClientOptions({
      ...rest,
      stunServers: values.stunServers
        ? (values.stunServers as string[]).filter(Boolean)
        : undefined,
      turnServers: values.turnServers ?? undefined,
      remoteAudioElement: remoteAudioElement ?? undefined,
      inboundAliases: inboundAliases && inboundAliases.length > 0 ? inboundAliases : undefined,
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
              name="inboundAliasesAsString"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Inbound Phone Number Aliases</FormLabel>
                  <FormControl>
                    <Input
                      data-testid="input-inbound-aliases"
                      placeholder="14843068733, 15551234567"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Phone numbers that should accept incoming calls (comma-separated). Required when phone number differs from username.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <StunServersFormField control={form.control} name="stunServers" />
            <TurnServersFormField control={form.control} name="turnServers" />
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
