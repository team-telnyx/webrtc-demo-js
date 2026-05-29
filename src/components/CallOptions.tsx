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
import { ExternalLinkIcon } from 'lucide-react';
import { useForm } from 'react-hook-form';

import { ICallOptions, useCallOptions } from '@/atoms/callOptions';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useCallback } from 'react';
import CodecSelectInput from './CodecInput';
import CustomHeadersInput from './CustomHeadersInput';
import { useClientOptions } from '@/atoms/clientOptions';
import { Switch } from '@/components/ui/switch';

const CallOptions = () => {
  const [clientOptions] = useClientOptions();
  const [callOptions, setCallOptions] = useCallOptions();
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
      audioStartupRepro: {
        enabled: false,
        frequencyHz: 440,
        gain: 0.2,
        delayMs: 0,
      },
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

  const repro = callOptions.audioStartupRepro;

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

            <div className="border-t pt-6 space-y-4">
              <h3 className="text-sm font-semibold">SDK Audio Startup Repro</h3>
              <p className="text-xs text-muted-foreground">
                Uses the SDK <code>audioStartupRepro</code> option from{' '}
                <code>team-telnyx/webrtc#feat/audio-startup-repro-harness</code>
                . When enabled, the SDK replaces outbound mic audio with a sine
                tone. Delay defaults to 0 ms, matching immediate startup.
              </p>

              <FormField
                control={form.control}
                name="audioStartupRepro.enabled"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between">
                    <div>
                      <FormLabel>Enable SDK startup tone repro</FormLabel>
                      <FormDescription>
                        Pass <code>audioStartupRepro</code> to SDK
                        newCall/answer
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value ?? false}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {repro?.enabled && (
                <>
                  <FormField
                    control={form.control}
                    name="audioStartupRepro.frequencyHz"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Frequency Hz</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={20}
                            max={4000}
                            value={field.value ?? 440}
                            onChange={(e) =>
                              field.onChange(Number(e.target.value) || 440)
                            }
                          />
                        </FormControl>
                        <FormDescription>
                          SDK clamps to 20–4000 Hz. Default: 440 Hz.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="audioStartupRepro.gain"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gain (0–1)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={0}
                            max={1}
                            step={0.05}
                            value={field.value ?? 0.2}
                            onChange={(e) => {
                              let v = Number(e.target.value);
                              if (v < 0) v = 0;
                              if (v > 1) v = 1;
                              field.onChange(v);
                            }}
                          />
                        </FormControl>
                        <FormDescription>
                          SDK default is 0.2. Keep low enough to avoid clipping.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="audioStartupRepro.delayMs"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tone delay ms</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={0}
                            max={10000}
                            step={100}
                            value={field.value ?? 0}
                            onChange={(e) => {
                              let v = Number(e.target.value) || 0;
                              if (v < 0) v = 0;
                              if (v > 10000) v = 10000;
                              field.onChange(v);
                            }}
                          />
                        </FormControl>
                        <FormDescription>
                          SDK default is 0 ms. Use this to compare immediate
                          tone against delayed first audio. SDK clamps to
                          0–10000 ms.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default CallOptions;
