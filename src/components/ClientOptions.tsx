import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { Button } from "./ui/button";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useClientOptions, useClientProfiles } from "@/atoms/clientOptions";
import { LoginMethod, useLoginMethod } from "@/atoms/loginMethod";
import { useConnectionStatus } from "@/atoms/telnyxClient";
import { Input } from "@/components/ui/input";
import { useCallback } from "react";
import { toast } from "sonner";
import FileUploadButton from "./FileUploadButton";
import { Label } from "./ui/label";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Switch } from "./ui/switch";
import { IClientOptionsDemo } from "@/lib/types";

const ClientOptions = () => {
  const [profiles, setProfiles] = useClientProfiles();
  const [clientOptions, setClientOptions] = useClientOptions();
  const [connectionStatus] = useConnectionStatus();
  const [loginMethod, _setLoginMethod] = useLoginMethod();

  const form = useForm<Partial<IClientOptionsDemo>>({
    values: clientOptions,
    defaultValues: {
      debug: true,
      debugOutput: "socket",
      login: "",
      password: "",
      login_token: "",
      prefetchIceCandidates: false,
      forceRelayCandidate: false,
      trickleIce: false,
      ringbackFile: "/ringback.mp3",
      ringtoneFile: "/ringtone.mp3",
      rtcIp: "",
      rtcPort: undefined,
      anonymous_login: {
        target_type: "",
        target_id: "",
      },
    },
  });

  const setLoginMethod = useCallback(
    (method: string) => {
      form.setValue("login_token", "");
      form.setValue("login", "");
      form.setValue("password", "");
      form.setValue("anonymous_login.target_id", "");
      form.setValue("anonymous_login.target_type", "ai_assistant");
      _setLoginMethod(method as LoginMethod);
    },
    [_setLoginMethod, form]
  );

  const onSubmit = (values: Partial<IClientOptionsDemo>) => {
    setClientOptions(values);
    onSaveProfile(values);
  };

  const onSaveProfile = (values: Partial<IClientOptionsDemo>) => {
    if (!values.login && !values.password) {
      return;
    }
    const profileIndex = profiles.findIndex(
      (profile) => profile.login === values.login
    );
    if (profileIndex !== -1) {
      setProfiles((prevProfiles) => {
        const newProfiles = [...prevProfiles];
        newProfiles[profileIndex] = values;
        return newProfiles;
      });

      return toast("Profile Updated");
    }
    setProfiles([...profiles, values]);
    return toast("Profile Created");
  };

  const onSelectProfile = (value: string) => {
    const profile = profiles.find((profile) => profile.login === value);
    if (!profile) {
      return;
    }

    form.reset(profile);

    return setClientOptions(profile);
  };

  const loginMethodForm = () => {
    if (loginMethod === "anonymous") {
      return (
        <FormField
          rules={{ required: "AI Assistant ID is required" }}
          control={form.control}
          name="anonymous_login.target_id"
          render={({ field }) => (
            <FormItem className="mb-4">
              <FormLabel>AI Assistant ID</FormLabel>
              <FormControl>
                <Input
                  data-testid="input-anonymous-login-target-id"
                  type="text"
                  placeholder="AI Assistant ID"
                  {...field}
                />
              </FormControl>

              <FormMessage />
            </FormItem>
          )}
        />
      );
    }
    if (loginMethod === "credentials") {
      return (
        <>
          <FormField
            rules={{ required: "Login is required" }}
            control={form.control}
            name="login"
            render={({ field }) => (
              <FormItem className="mb-4">
                <FormLabel>Login</FormLabel>
                <FormControl>
                  <Input
                    data-testid="input-username"
                    placeholder="Username"
                    {...field}
                  />
                </FormControl>
                <FormDescription>Enter your SIP username.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            rules={{ required: "Password is required" }}
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem className="mb-4">
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input
                    data-testid="input-password"
                    type="password"
                    placeholder="Password"
                    {...field}
                  />
                </FormControl>

                <FormMessage />
              </FormItem>
            )}
          />
        </>
      );
    }
    if (loginMethod === "token") {
      return (
        <FormField
          rules={{ required: "Login token is required" }}
          control={form.control}
          name="login_token"
          render={({ field }) => (
            <FormItem className="mb-4">
              <FormLabel>Login Token</FormLabel>
              <FormControl>
                <Input
                  data-testid="input-login-token"
                  type="text"
                  placeholder="Login Token"
                  {...field}
                />
              </FormControl>

              <FormMessage />
            </FormItem>
          )}
        />
      );
    }
  };
  return (
    <Card>
      <CardHeader>
        <CardTitle>Client Options</CardTitle>
        <CardDescription>
          Options passed to the client constructor.
          <a
            className="inline-flex underline"
            href="https://developers.telnyx.com/docs/voice/webrtc/js-sdk/interfaces/iclientoptions"
          >
            Reference <ExternalLinkIcon className="w-4" target="_blank" />
          </a>
        </CardDescription>
      </CardHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent>
            <FormItem className="mb-4">
              <FormLabel>Profile</FormLabel>
              <FormControl>
                <Select onValueChange={onSelectProfile}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Profile" />
                  </SelectTrigger>
                  <SelectContent>
                    {profiles.map((profile) => (
                      <SelectItem
                        key={profile.login}
                        value={profile.login ?? ""}
                      >
                        {profile.login}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormDescription>Select a saved profile</FormDescription>
              <FormMessage />
            </FormItem>

            <FormField
              control={form.control}
              name="rtcIp"
              render={({ field }) => (
                <FormItem className="mb-4">
                  <FormLabel>RTC IP</FormLabel>
                  <FormControl>
                    <Input
                      data-testid="input-rtc_ip"
                      type="text"
                      placeholder="RTC_IP"
                      {...field}
                    />
                  </FormControl>

                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="rtcPort"
              render={({ field }) => (
                <FormItem className="mb-4">
                  <FormLabel>RTC PORT</FormLabel>
                  <FormControl>
                    <Input
                      data-testid="input_rtc_port"
                      type="text"
                      placeholder="RTC PORT"
                      {...field}
                    />
                  </FormControl>

                  <FormMessage />
                </FormItem>
              )}
            />
            <Label className="block mb-4">Login Method</Label>
            <RadioGroup
              defaultValue="credentials"
              value={loginMethod}
              className="flex mb-4"
              onValueChange={setLoginMethod}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem
                  value="credentials"
                  id="radio-credentials"
                  data-testid="radio-credentials"
                />
                <Label htmlFor="radio-credentials">Credentials</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem
                  value="token"
                  id="radio-token"
                  data-testid="radio-token"
                />
                <Label htmlFor="radio-token">Token</Label>
              </div>

              <div className="flex items-center space-x-2">
                <RadioGroupItem
                  value="anonymous"
                  id="radio-anonymous"
                  data-testid="radio-anonymous"
                />
                <Label htmlFor="radio-anonymous">
                  Anonymous-login (AI Assistant)
                </Label>
              </div>
            </RadioGroup>
            {loginMethodForm()}
            <FormField
              control={form.control}
              name="debug"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between mb-4">
                  <div>
                    <FormLabel>Enable Debugging</FormLabel>
                    <FormDescription>
                      Allow the SDK to collect WebRTC debug information.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>

                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="debugOutput"
              render={({ field }) => (
                <FormItem className="mb-4">
                  <FormLabel>Debug Output</FormLabel>
                  <FormControl>
                    <Select
                      defaultValue="socket"
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Debug output" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="socket">Socket</SelectItem>
                        <SelectItem value="file">File</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormDescription>
                    Choose where the WebRTC Debug data will be sent
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="trickleIce"
              render={({ field }) => (
                <FormItem className="flex items-center mb-4 justify-between">
                  <div>
                    <FormLabel>Trickle Ice</FormLabel>
                    <FormDescription>
                      Outgoing and incoming call flows using Trickle ICE.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>

                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="prefetchIceCandidates"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between mb-4">
                  <div>
                    <FormLabel>Prefetch Ice Candidates</FormLabel>
                    <FormDescription>
                      Allow the SDK to prefetch ICE candidates.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>

                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="forceRelayCandidate"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between mb-4">
                  <div>
                    <FormLabel>Force Relay Candidate</FormLabel>
                    <FormDescription>
                      Force the usage of a relay ICE candidate during signaling.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>

                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="ringbackFile"
              render={({ field }) => (
                <FormItem className="mb-4">
                  <FormLabel>Ringback File</FormLabel>
                  <FormControl>
                    <FileUploadButton
                      accept="audio/*"
                      id="ringbackFile"
                      value={field.value}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormDescription>
                    The ringback audio file to play during an outbound call.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="ringtoneFile"
              render={({ field }) => (
                <FormItem className="mb-4">
                  <FormLabel>Ringtone File</FormLabel>
                  <FormControl>
                    <FileUploadButton
                      id="ringtoneFile"
                      accept="audio/*"
                      value={field.value}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormDescription>
                    The Ringtone audio file to play during an inbound call.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="gap-2">
            <Button
              data-testid="btn-connect"
              onClick={form.handleSubmit(onSubmit)}
              className="w-full"
            >
              {connectionStatus === "connected" ? "Reconnect" : "Connect"}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
};

export default ClientOptions;
