import { useState, useEffect, useCallback } from 'react';
import { IS_DEV_ENV } from '@/lib/vite';
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PlusIcon, TrashIcon } from 'lucide-react';
import AiAgentEventLog, { type AiAgentEvent } from './AiAgentEventLog';

interface CustomAttribute {
  name: string;
  value: string;
}

interface FormValues {
  agentId: string;
  trickleIce: boolean;
  version: string;
  conversationId: string;
}

const WIDGET_EVENTS = [
  'agent.connected',
  'agent.disconnected',
  'conversation.update',
  'transcript.item',
  'conversation.agent.state',
  'agent.audio.mute',
  'agent.error',
];

const AiAgentView = () => {
  const [isEmbedded, setIsEmbedded] = useState(false);
  const [currentAgentId, setCurrentAgentId] = useState<string | null>(null);
  const [currentTrickleIce, setCurrentTrickleIce] = useState(false);
  const [currentVersion, setCurrentVersion] = useState('next');
  const [currentConversationId, setCurrentConversationId] = useState('');
  const [currentCustomAttrs, setCurrentCustomAttrs] = useState<
    CustomAttribute[]
  >([]);
  const [invertBackground, setInvertBackground] = useState(false);
  const [availableVersions, setAvailableVersions] = useState<string[]>([]);
  const [versionsLoading, setVersionsLoading] = useState(true);
  const [events, setEvents] = useState<AiAgentEvent[]>([]);
  const [customAttributes, setCustomAttributes] = useState<CustomAttribute[]>(
    [],
  );

  const form = useForm<FormValues>({
    defaultValues: {
      agentId: '',
      trickleIce: false,
      version: 'next',
      conversationId: '',
    },
  });

  const handleWidgetEvent = useCallback((event: MessageEvent) => {
    if (
      event.data &&
      event.data.type === 'telnyx-ai-agent-event' &&
      event.data.eventType
    ) {
      const newEvent: AiAgentEvent = {
        id: crypto.randomUUID(),
        eventType: event.data.eventType,
        detail: event.data.detail,
        timestamp: new Date(),
      };
      setEvents((prev) => [newEvent, ...prev]);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('message', handleWidgetEvent);
    return () => {
      window.removeEventListener('message', handleWidgetEvent);
    };
  }, [handleWidgetEvent]);

  useEffect(() => {
    const fetchVersions = async () => {
      try {
        const response = await fetch(
          'https://registry.npmjs.org/@telnyx/ai-agent-widget',
        );
        const data = await response.json();

        // Filter out deprecated versions, keep stable + beta
        const filteredVersions = Object.entries(
          data.versions as Record<string, { deprecated?: string }>,
        )
          .filter(([_, metadata]) => {
            // Exclude deprecated versions
            if (metadata.deprecated) return false;
            return true;
          })
          .map(([version]) => version);

        const versions = filteredVersions.sort((a, b) => {
          const parseVersion = (v: string) => {
            const [main, pre] = v.split('-');
            const parts = main.split('.').map(Number);
            return { parts, pre: pre || '' };
          };
          const vA = parseVersion(a);
          const vB = parseVersion(b);
          for (
            let i = 0;
            i < Math.max(vA.parts.length, vB.parts.length);
            i++
          ) {
            const diff = (vB.parts[i] || 0) - (vA.parts[i] || 0);
            if (diff !== 0) return diff;
          }
          // Same major.minor.patch: stable before prerelease, then alpha by tag
          if (!vA.pre && vB.pre) return -1;
          if (vA.pre && !vB.pre) return 1;
          return vA.pre.localeCompare(vB.pre);
        });
        setAvailableVersions(versions);
      } catch (error) {
        console.error('Failed to fetch widget versions:', error);
      } finally {
        setVersionsLoading(false);
      }
    };
    fetchVersions();
  }, []);

  const getIframeSrcDoc = (
    agentId: string,
    version: string,
    trickleIce: boolean,
    conversationId: string,
    extraAttributes: CustomAttribute[],
  ) => {
    const versionSuffix = `@${version}`;
    const trickleIceAttr = trickleIce ? ' trickle-ice="true"' : '';
    const environmentAttr = IS_DEV_ENV ? ' environment="development"' : '';
    const conversationIdAttr = conversationId
      ? ` conversation-id="${conversationId}"`
      : '';
    const customAttrsStr = extraAttributes
      .filter((attr) => attr.name.trim() && attr.value.trim())
      .map((attr) => ` ${attr.name.trim()}="${attr.value.trim()}"`)
      .join('');
    const eventListenersScript = `
      const WIDGET_EVENTS = ${JSON.stringify(WIDGET_EVENTS)};

      function setupEventListeners() {
        const widget = document.querySelector('telnyx-ai-agent');
        if (!widget) {
          setTimeout(setupEventListeners, 100);
          return;
        }

        WIDGET_EVENTS.forEach(eventType => {
          widget.addEventListener(eventType, (e) => {
            window.parent.postMessage({
              type: 'telnyx-ai-agent-event',
              eventType: eventType,
              detail: e.detail
            }, '*');
          });
        });
      }

      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupEventListeners);
      } else {
        setupEventListeners();
      }
    `;
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
          <telnyx-ai-agent agent-id="${agentId}"${trickleIceAttr}${environmentAttr}${conversationIdAttr}${customAttrsStr}></telnyx-ai-agent>
          <script>${eventListenersScript}</script>
        </body>
      </html>
    `;
  };

  const onSubmit = (values: FormValues) => {
    if (!values.agentId.trim()) return;

    setCurrentAgentId(values.agentId.trim());
    setCurrentTrickleIce(values.trickleIce);
    setCurrentVersion(values.version);
    setCurrentConversationId(values.conversationId.trim());
    setCurrentCustomAttrs([...customAttributes]);
    setIsEmbedded(true);
  };

  const handleReset = () => {
    setIsEmbedded(false);
    setCurrentAgentId(null);
    setCurrentConversationId('');
    setCurrentCustomAttrs([]);
    setEvents([]);
    setCustomAttributes([]);
    form.reset();
  };

  const handleAddAttribute = () => {
    setCustomAttributes((prev) => [...prev, { name: '', value: '' }]);
  };

  const handleRemoveAttribute = (index: number) => {
    setCustomAttributes((prev) => {
      const next = [...prev];
      next.splice(index, 1);
      return next;
    });
  };

  const handleAttributeChange = (
    index: number,
    field: 'name' | 'value',
    newValue: string,
  ) => {
    setCustomAttributes((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: newValue };
      return next;
    });
  };

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div className="space-y-4">
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
                  rules={{ required: 'Agent ID is required' }}
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
                                versionsLoading
                                  ? 'Loading versions...'
                                  : 'Select a version'
                              }
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="next">Next</SelectItem>
                          <SelectItem value="latest">Latest</SelectItem>
                          {availableVersions.map((version) => (
                            <SelectItem key={version} value={version}>
                              {version.includes('-') ? `${version} 🧪` : version}
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
                <FormField
                  control={form.control}
                  name="conversationId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Conversation ID</FormLabel>
                      <FormControl>
                        <Input
                          data-testid="input-conversation-id"
                          placeholder="Optional — rejoin an existing conversation"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Custom Attributes */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <FormLabel>Custom Attributes</FormLabel>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddAttribute}
                      data-testid="btn-add-custom-attr"
                    >
                      <PlusIcon className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </div>
                  {customAttributes.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Additional HTML attributes passed to the{' '}
                      <code className="text-xs">&lt;telnyx-ai-agent&gt;</code>{' '}
                      element.
                    </p>
                  )}
                  {customAttributes.map((attr, index) => (
                    <div className="flex gap-2" key={index}>
                      <Input
                        placeholder="attribute-name"
                        value={attr.name}
                        onChange={(e) =>
                          handleAttributeChange(index, 'name', e.target.value)
                        }
                        data-testid={`input-custom-attr-name-${index}`}
                      />
                      <Input
                        placeholder="value"
                        value={attr.value}
                        onChange={(e) =>
                          handleAttributeChange(index, 'value', e.target.value)
                        }
                        data-testid={`input-custom-attr-value-${index}`}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveAttribute(index)}
                        data-testid={`btn-remove-custom-attr-${index}`}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
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
                  {isEmbedded ? 'Update Agent' : 'Embed Agent'}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>
        <AiAgentEventLog events={events} />
      </div>

      <Card className="flex flex-col min-h-[600px]">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle>Widget Preview</CardTitle>
            <CardDescription>
              {isEmbedded
                ? `Showing agent: ${currentAgentId}`
                : 'Enter an Agent ID and click Embed to see the widget.'}
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setInvertBackground(!invertBackground)}
            data-testid="btn-invert-background"
          >
            Invert background {invertBackground ? '(Dark)' : '(Light)'}
          </Button>
        </CardHeader>
        <CardContent className="flex-1">
          <div
            className={`h-full flex items-center justify-center border rounded-md transition-colors ${
              invertBackground ? 'bg-white' : 'bg-zinc-900'
            }`}
            data-testid="widget-container"
          >
            {isEmbedded && currentAgentId ? (
              <iframe
                key={`${currentAgentId}-${currentTrickleIce}-${currentVersion}-${currentConversationId}-${JSON.stringify(currentCustomAttrs)}`}
                srcDoc={getIframeSrcDoc(
                  currentAgentId,
                  currentVersion,
                  currentTrickleIce,
                  currentConversationId,
                  currentCustomAttrs,
                )}
                className="h-full w-full border-0"
                allow="microphone; camera; autoplay"
                title="AI Agent Widget"
              />
            ) : (
              <p
                className={invertBackground ? 'text-zinc-500' : 'text-zinc-400'}
              >
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
