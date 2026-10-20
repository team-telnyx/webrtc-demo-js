import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { ExternalLinkIcon, RefreshCwIcon } from 'lucide-react';
import { useForm } from 'react-hook-form';

import { ICallOptions, useCallOptions } from '@/atoms/callOptions';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useCallback } from 'react';
import CodecSelectInput from './CodecInput';
import CustomHeadersInput from './CustomHeadersInput';
import DeviceSelect from './DeviceSelect';
import { Button } from './ui/button';
import { useClientOptions } from '@/atoms/clientOptions';
import { useMediaDeviceList } from '@/hooks/useMediaDeviceList';

const CallOptions = () => {
  const [clientOptions] = useClientOptions();
  const [callOptions, setCallOptions] = useCallOptions();
  const { devices, requestPermission, permissionError } = useMediaDeviceList(
    clientOptions.video,
  );
  const form = useForm({
    defaultValues: {
      callerName: '',
      destinationNumber: '',
      callerNumber: '',
      clientState: '',
      customHeaders: [],
      preferred_codecs: [],
      debugOutput: 'socket',
      keepConnectionAliveOnSocketClose: false,
      micId: undefined,
      speakerId: undefined,
      camId: undefined,
    },
    values: callOptions,
  });

  const onSubmit = (opt: ICallOptions) => {
    setCallOptions(opt);
  };

  form.watch(
    useCallback(
      (value: unknown) => {
        setCallOptions(value as ICallOptions);
      },
      [setCallOptions],
    ),
  );
  return (
    <Card>
      <CardHeader>
        <CardTitle>Call Options</CardTitle>
        <CardDescription>
          Options passed to the client when making new calls.{' '}
          <a
            className="underline inline-flex"
            href="https://developers.telnyx.com/docs/voice/webrtc/js-sdk/interfaces/icalloptions"
            target="_blank"
          >
            Reference <ExternalLinkIcon className="w-4" />
          </a>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="callerName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Caller Name</FormLabel>
                  <FormControl>
                    <Input
                      data-testid="input-caller-id-name"
                      placeholder="John Doe"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    The name to be displayed to the callee.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="callerNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Caller Number</FormLabel>
                  <FormControl>
                    <Input
                      data-testid="input-caller-id-number"
                      type="text"
                      placeholder="Caller Number"
                      {...field}
                    />
                  </FormControl>

                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="customHeaders"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Custom Headers</FormLabel>
                  <FormControl>
                    <CustomHeadersInput
                      value={field.value ?? []}
                      onChange={field.onChange}
                    />
                  </FormControl>

                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="preferred_codecs"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preferred Codecs</FormLabel>
                  <FormControl>
                    <CodecSelectInput
                      value={field.value ?? []}
                      onChange={field.onChange}
                      video={clientOptions.video}
                    />
                  </FormControl>

                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4 rounded-lg border p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-sm font-semibold">Devices</p>
                  <p className="text-xs text-muted-foreground">
                    Microphone, speaker and camera for the next call. Used by
                    newCall() and, since @telnyx/webrtc 2.28.0, by call.answer()
                    when you accept an incoming call. Labels appear once the
                    browser has media permission.
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  data-testid="btn-refresh-devices"
                  onClick={requestPermission}
                >
                  <RefreshCwIcon className="w-4 mr-1" /> Refresh
                </Button>
              </div>
              {permissionError && (
                <p className="text-xs text-red-500">{permissionError}</p>
              )}

              <FormField
                control={form.control}
                name="micId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Microphone</FormLabel>
                    <FormControl>
                      <DeviceSelect
                        devices={devices}
                        kind="audioinput"
                        fallbackLabel="Microphone"
                        value={field.value}
                        onChange={field.onChange}
                        testId="select-call-microphone"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="speakerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Speaker</FormLabel>
                    <FormControl>
                      <DeviceSelect
                        devices={devices}
                        kind="audiooutput"
                        fallbackLabel="Speaker"
                        value={field.value}
                        onChange={field.onChange}
                        testId="select-call-speaker"
                      />
                    </FormControl>
                    <FormDescription>
                      Applied with setSinkId on the remote audio element.
                      Firefox and Safari do not list output devices.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {clientOptions.video && (
                <FormField
                  control={form.control}
                  name="camId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Camera</FormLabel>
                      <FormControl>
                        <DeviceSelect
                          devices={devices}
                          kind="videoinput"
                          fallbackLabel="Camera"
                          value={field.value}
                          onChange={field.onChange}
                          testId="select-call-camera"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <FormField
              control={form.control}
              name="clientState"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client State</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Base 64 encoded string" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default CallOptions;
