import { useState, useEffect, useRef } from "react";
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

interface FormValues {
  agentId: string;
}

const AiAgentView = () => {
  const [isEmbedded, setIsEmbedded] = useState(false);
  const [currentAgentId, setCurrentAgentId] = useState<string | null>(null);
  const [invertBackground, setInvertBackground] = useState(false);
  const widgetContainerRef = useRef<HTMLDivElement>(null);
  const scriptLoadedRef = useRef(false);

  const form = useForm<FormValues>({
    defaultValues: {
      agentId: "",
    },
  });

  useEffect(() => {
    if (!scriptLoadedRef.current) {
      const existingScript = document.querySelector(
        'script[src="https://unpkg.com/@telnyx/ai-agent-widget"]'
      );
      if (!existingScript) {
        const script = document.createElement("script");
        script.src = "https://unpkg.com/@telnyx/ai-agent-widget";
        script.async = true;
        document.body.appendChild(script);
      }
      scriptLoadedRef.current = true;
    }
  }, []);

  const onSubmit = (values: FormValues) => {
    if (!values.agentId.trim()) return;

    setCurrentAgentId(values.agentId.trim());
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
            {invertBackground ? "Dark Background" : "Light Background"}
          </Button>
        </CardHeader>
        <CardContent className="flex-1">
          <div
            ref={widgetContainerRef}
            className={`h-full flex items-center justify-center border rounded-md transition-colors ${
              invertBackground ? "bg-white" : "bg-zinc-900"
            }`}
            data-testid="widget-container"
          >
            {isEmbedded && currentAgentId ? (
              <div
                key={currentAgentId}
                className="h-full w-full"
                dangerouslySetInnerHTML={{
                  __html: `<telnyx-ai-agent agent-id="${currentAgentId}"></telnyx-ai-agent>`,
                }}
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
