import { ICallOptions, useCallOptions } from '@/atoms/callOptions';
import { useClientOptions } from '@/atoms/clientOptions';
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
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { ExternalLinkIcon } from 'lucide-react';
import { useCallback } from 'react';
import { useForm } from 'react-hook-form';
import CodecSelectInput from './CodecInput';
import CustomHeadersInput from './CustomHeadersInput';

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
      autoAnswerInbound: false,
      localStreamRepro: {
        enabled: false,
        source: 'sine',
        startMode: 'after-answer',
        delayMs: 0,
        frequencyHz: 440,
        amplitude: 1,
        logTiming: true,
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

  const repro = callOptions.localStreamRepro;

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
              <h3 className="text-sm font-semibold">
                LocalStream Startup Repro
              </h3>
              <p className="text-xs text-muted-foreground">
                Customer-compatible flow: on inbound call event, create a
                looping WebAudio <code>AudioBufferSourceNode</code>, assign its
                stream to <code>call.options.localStream</code>, call{' '}
                <code>answer()</code>, then start audio immediately after.
              </p>

              <FormField
                control={form.control}
                name="autoAnswerInbound"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between">
                    <div>
                      <FormLabel>Auto-answer inbound calls</FormLabel>
                      <FormDescription>
                        Demo-app repro mode: immediately answer inbound calls
                        with the configured localStream repro options.
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

              <FormField
                control={form.control}
                name="localStreamRepro.enabled"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between">
                    <div>
                      <FormLabel>Enable localStream repro</FormLabel>
                      <FormDescription>
                        Mutate <code>call.options.localStream</code> before
                        answer, matching the customer app.
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
                    name="localStreamRepro.source"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Source</FormLabel>
                        <FormControl>
                          <Select
                            value={field.value ?? 'sine'}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select source" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="sine">Sine tone</SelectItem>
                              <SelectItem value="noise">White noise</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormDescription>
                          Uses a looping AudioBufferSourceNode, not the
                          microphone.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="localStreamRepro.startMode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start mode</FormLabel>
                        <FormControl>
                          <Select
                            value={field.value ?? 'after-answer'}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select start mode" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="after-answer">
                                Immediately after answer() — baseline
                              </SelectItem>
                              <SelectItem value="after-answer-delay">
                                After answer() + delay — A/B check
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormDescription>
                          Baseline starts right after <code>answer()</code>, not
                          on call.active/ICE/DTLS connected.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {repro.startMode === 'after-answer-delay' && (
                    <FormField
                      control={form.control}
                      name="localStreamRepro.delayMs"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Delay after answer, ms</FormLabel>
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
                            Use 1000–2000 ms to validate the customer-observed
                            mitigation.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={form.control}
                    name="localStreamRepro.frequencyHz"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Frequency Hz</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={20}
                            max={20000}
                            value={field.value ?? 440}
                            onChange={(e) =>
                              field.onChange(Number(e.target.value) || 440)
                            }
                          />
                        </FormControl>
                        <FormDescription>
                          Used when source is sine. Default: 440 Hz.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="localStreamRepro.amplitude"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Buffer amplitude (0–1)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={0}
                            max={1}
                            step={0.05}
                            value={field.value ?? 1}
                            onChange={(e) => {
                              let v = Number(e.target.value);
                              if (v < 0) v = 0;
                              if (v > 1) v = 1;
                              field.onChange(v);
                            }}
                          />
                        </FormControl>
                        <FormDescription>
                          Direct buffer amplitude. No GainNode/ramp is added.
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
