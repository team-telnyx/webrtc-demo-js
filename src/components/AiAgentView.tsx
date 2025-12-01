import { useState, useEffect } from "react";
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
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FormValues {
  agentId: string;
  trickleIce: boolean;
  version: string;
}

const AiAgentView = () => {
  const [isEmbedded, setIsEmbedded] = useState(false);
  const [currentAgentId, setCurrentAgentId] = useState<string | null>(null);
  const [currentTrickleIce, setCurrentTrickleIce] = useState(false);
  const [currentVersion, setCurrentVersion] = useState("latest");
  const [invertBackground, setInvertBackground] = useState(false);
  const [availableVersions, setAvailableVersions] = useState<string[]>([]);
  const [versionsLoading, setVersionsLoading] = useState(true);

  const form = useForm<FormValues>({
    defaultValues: {
      agentId: "",
      trickleIce: false,
      version: "latest",
    },
  });

  useEffect(() => {
    const fetchVersions = async () => {
      try {
        const response = await fetch(
          "https://registry.npmjs.org/@telnyx/ai-agent-widget"
        );
        const data = await response.json();
        const versions = Object.keys(data.versions).sort((a, b) => {
          const parseVersion = (v: string) => {
            const [main, prerelease] = v.split("-");
            const parts = main.split(".").map(Number);
            return { parts, prerelease };
          };
          const vA = parseVersion(a);
          const vB = parseVersion(b);
          for (let i = 0; i < Math.max(vA.parts.length, vB.parts.length); i++) {
            const diff = (vB.parts[i] || 0) - (vA.parts[i] || 0);
            if (diff !== 0) return diff;
          }
          // Same base version: stable > prerelease, then sort prereleases alphabetically descending
          if (!vA.prerelease && vB.prerelease) return -1;
          if (vA.prerelease && !vB.prerelease) return 1;
          if (vA.prerelease && vB.prerelease) {
            return vB.prerelease.localeCompare(vA.prerelease);
          }
          return 0;
        });
        setAvailableVersions(versions);
      } catch (error) {
        console.error("Failed to fetch widget versions:", error);
      } finally {
        setVersionsLoading(false);
      }
    };
    fetchVersions();
  }, []);

  const getIframeSrcDoc = (
    agentId: string,
    version: string,
    trickleIce: boolean
  ) => {
    const versionSuffix = version === "latest" ? "" : `@${version}`;
    const trickleIceAttr = trickleIce ? ' trickle-ice="true"' : "";
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { margin: 0; display: flex; justify-content: center; align-items: center; height: 100vh; }
          </style>
          <script src="https://unpkg.com/@telnyx/ai-agent-widget${versionSuffix}"></script>
        </head>
        <body>
          <telnyx-ai-agent agent-id="${agentId}"${trickleIceAttr}></telnyx-ai-agent>
        </body>
      </html>
    `;
  };

  const onSubmit = (values: FormValues) => {
    if (!values.agentId.trim()) return;

    setCurrentAgentId(values.agentId.trim());
    setCurrentTrickleIce(values.trickleIce);
    setCurrentVersion(values.version);
    setIsEmbedded(true);
  };

  const handleReset = () => {
    setIsEmbedded(false);
    setCurrentAgentId(null);
    form.reset();
  };

  return (
    <div className="grid md:grid-cols-2 gap-4 h-[calc(100vh-8rem)]">
      <Card className="h-fit">
        <CardHeader>
          <CardTitle>AI Agent Widget</CardTitle>
          <CardDescription>
            Enter the Agent ID to embed the Telnyx AI Agent widget.
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="agentId"
                rules={{ required: "Agent ID is required" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Agent ID</FormLabel>
                    <FormControl>
                      <Input
                        data-testid="input-agent-id"
                        placeholder="assistant-xxx"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="version"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Widget Version</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={versionsLoading}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-widget-version">
                          <SelectValue
                            placeholder={
                              versionsLoading ? "Loading versions..." : "Select a version"
                            }
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="latest">Latest</SelectItem>
                        {availableVersions.map((version) => (
                          <SelectItem key={version} value={version}>
                            {version}
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
                name="trickleIce"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Trickle ICE</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Enable trickle ICE for faster connection establishment
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        data-testid="switch-trickle-ice"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="justify-end gap-2">
              {isEmbedded && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleReset}
                  data-testid="btn-reset-agent"
                >
                  Reset
                </Button>
              )}
              <Button data-testid="btn-embed-agent" type="submit">
                {isEmbedded ? "Update Agent" : "Embed Agent"}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>

      <Card className="flex flex-col h-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle>Widget Preview</CardTitle>
            <CardDescription>
              {isEmbedded
                ? `Showing agent: ${currentAgentId}`
                : "Enter an Agent ID and click Embed to see the widget."}
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setInvertBackground(!invertBackground)}
            data-testid="btn-invert-background"
          >
            Invert background {invertBackground ? "(Dark)" : "(Light)"}
          </Button>
        </CardHeader>
        <CardContent className="flex-1">
          <div
            className={`h-full flex items-center justify-center border rounded-md transition-colors ${
              invertBackground ? "bg-white" : "bg-zinc-900"
            }`}
            data-testid="widget-container"
          >
            {isEmbedded && currentAgentId ? (
              <iframe
                key={`${currentAgentId}-${currentTrickleIce}-${currentVersion}`}
                srcDoc={getIframeSrcDoc(
                  currentAgentId,
                  currentVersion,
                  currentTrickleIce
                )}
                className="h-full w-full border-0"
                allow="microphone; camera; autoplay"
                title="AI Agent Widget"
              />
            ) : (
              <p className={invertBackground ? "text-zinc-500" : "text-zinc-400"}>
                No agent embedded yet
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AiAgentView;
