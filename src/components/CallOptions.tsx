import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ExternalLinkIcon } from "lucide-react";
import { useForm } from "react-hook-form";

import { ICallOptions, useCallOptions } from "@/atoms/callOptions";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCallback } from "react";
import CodecSelectInput from "./CodecInput";
import CustomHeadersInput from "./CustomHeadersInput";

const CallOptions = () => {
  const [callOptions, setCallOptions] = useCallOptions();
  const form = useForm({
    defaultValues: {
      callerName: "",
      destinationNumber: "",
      callerNumber: "",
      clientState: "",
      customHeaders: [],
      preferred_codecs: [],
      debugOutput: "socket",
      debug: false,
      prefetchIceCandidates: false,
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
      [setCallOptions]
    )
  );
  return (
    <Card>
      <CardHeader>
        <CardTitle>Call Options</CardTitle>
        <CardDescription>
          Options passed to the client when making new calls.{" "}
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
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default CallOptions;
