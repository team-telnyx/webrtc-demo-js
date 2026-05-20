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

import {
  ICallOptions,
  useCallOptions,
  LocalStreamReproSource,
  LocalStreamReproStartMode,
} from '@/atoms/callOptions';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useCallback } from 'react';
import CodecSelectInput from './CodecInput';
import CustomHeadersInput from './CustomHeadersInput';
import { useClientOptions } from '@/atoms/clientOptions';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const startModeLabels: Record<LocalStreamReproStartMode, string> = {
  'before-call': 'Before call (audio running before newCall/answer)',
  'on-active': 'On active (immediately when call.active)',
  'after-active-delay': 'After active + delay',
  manual: 'Manual (user clicks Start in active call)',
};

const sourceLabels: Record<LocalStreamReproSource, string> = {
  sine: 'Sine wave',
  noise: 'White noise',
};

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

            {/* ── LocalStream Repro Section ── */}
            <div className="border-t pt-6 space-y-4">
              <h3 className="text-sm font-semibold">LocalStream Repro</h3>
              <p className="text-xs text-muted-foreground">
                Inject synthetic audio via SDK{"'"}s <code>localStream</code>{' '}
                option to reproduce startup distortion.
              </p>

              {/* Enable */}
              <FormField
                control={form.control}
                name="localStreamRepro.enabled"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between">
                    <div>
                      <FormLabel>Enable LocalStream Repro</FormLabel>
                      <FormDescription>
                        Pass synthetic MediaStream as localStream
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
                  {/* Audio source */}
                  <FormField
                    control={form.control}
                    name="localStreamRepro.source"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Audio source</FormLabel>
                        <FormControl>
                          <Select
                            value={field.value ?? 'sine'}
                            onValueChange={(v) =>
                              field.onChange(v as LocalStreamReproSource)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(sourceLabels).map(
                                ([key, label]) => (
                                  <SelectItem key={key} value={key}>
                                    {label}
                                  </SelectItem>
                                ),
                              )}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Start mode */}
                  <FormField
                    control={form.control}
                    name="localStreamRepro.startMode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start mode</FormLabel>
                        <FormControl>
                          <Select
                            value={field.value ?? 'on-active'}
                            onValueChange={(v) =>
                              field.onChange(v as LocalStreamReproStartMode)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(startModeLabels).map(
                                ([key, label]) => (
                                  <SelectItem key={key} value={key}>
                                    {label}
                                  </SelectItem>
                                ),
                              )}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Delay after active */}
                  {repro.startMode === 'after-active-delay' && (
                    <FormField
                      control={form.control}
                      name="localStreamRepro.delayMs"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Delay after active, ms</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={0}
                              step={100}
                              value={field.value ?? 3000}
                              onChange={(e) =>
                                field.onChange(Number(e.target.value) || 0)
                              }
                            />
                          </FormControl>
                          <FormDescription>
                            Milliseconds after call.active before audio starts
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {/* Frequency (sine only) */}
                  {repro.source === 'sine' && (
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
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {/* Volume */}
                  <FormField
                    control={form.control}
                    name="localStreamRepro.volume"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Volume (0–1)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={0}
                            max={1}
                            step={0.05}
                            value={field.value ?? 0.25}
                            onChange={(e) => {
                              let v = Number(e.target.value);
                              if (v < 0) v = 0;
                              if (v > 1) v = 1;
                              field.onChange(v);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Log timing */}
                  <FormField
                    control={form.control}
                    name="localStreamRepro.logTiming"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <div>
                          <FormLabel>Log detailed timing</FormLabel>
                          <FormDescription>
                            Console + WS log timestamps for start/stop/delay
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value ?? true}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
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
