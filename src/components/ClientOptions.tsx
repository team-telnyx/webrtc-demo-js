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
import { Input } from "@/components/ui/input";
import { IClientOptions } from "@telnyx/webrtc";
import { toast } from "sonner";
import { Switch } from "./ui/switch";
import { useConnectionStatus } from "@/atoms/telnyxClient";
import { useState } from "react";
import FileUploadButton from "./FileUploadButton";

type LoginMethod = "credentials" | "token";
const ClientOptions = () => {
  const [profiles, setProfiles] = useClientProfiles();
  const [clientOptions, setClientOptions] = useClientOptions();
  const [connectionStatus] = useConnectionStatus();
  const [loginMethod] = useState<LoginMethod>("credentials");

  const form = useForm<Partial<IClientOptions>>({
    values: clientOptions,
    defaultValues: {
      debug: true,
      debugOutput: "socket",
      login: "",
      password: "",
      login_token: "",
      prefetchIceCandidates: false,
      forceRelayCandidate: false,
      ringbackFile: "/ringback.mp3",
      ringtoneFile: "/ringtone.mp3",
    },
  });

  const onSubmit = (values: Partial<IClientOptions>) => {
    setClientOptions(values);
    onSaveProfile(values);
  };

  const onSaveProfile = (values: Partial<IClientOptions>) => {
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Client Options</CardTitle>
        <CardDescription>
          Options passed to the client constructor.
          <a
            className="underline inline-flex"
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

            {loginMethod === "credentials" ? (
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
                          placeholder="example@sip.telnyx.com"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        The SIP username to authenticate with.
                      </FormDescription>
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
            ) : (
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
            )}
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
              name="prefetchIceCandidates"
              render={({ field }) => (
                <FormItem className="flex items-center mb-4 justify-between">
                  <div>
                    <FormLabel>Prefetch Ice Candidates</FormLabel>
                    <FormDescription>
                      Allow the SDK to prefetch ICE candidates
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
