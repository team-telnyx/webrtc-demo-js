import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { IS_DEV_ENV } from '@/lib/vite';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useForm, useWatch } from 'react-hook-form';
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
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import AiAgentEventLog, { type AiAgentEvent } from './AiAgentEventLog';
import { Textarea } from '@/components/ui/textarea';

// ── Types ──

interface CustomAttribute {
  name: string;
  value: string;
}

interface FormValues {
  agentId: string;
  version: string;
  versionId: string;
  conversationId: string;
  region: string;
  // Toggles
  trickleIce: boolean;
  chatMode: boolean;
  debug: boolean;
  showUserPerceivedLatency: boolean;
  showGreetingLatency: boolean;
  skipLastVoiceSdkId: boolean;
  // Call options
  callDestinationNumber: string;
  callCallerNumber: string;
  callCallerName: string;
  callCustomHeaders: string;
  callAudio: string;
  // VAD
  vad: string;
  // Client-side tools
  clientToolsEnabled: boolean;
  smsApiKey: string;
  smsFromNumber: string;
}

// ── Client-side tool types ──

type ClientToolContext = {
  callId: string;
  toolName: string;
  rawArguments: string;
};
type ClientToolHandler = (
  args: unknown,
  context: ClientToolContext,
) => unknown | Promise<unknown>;
type TelnyxAiAgentEl = HTMLElement & {
  registerClientTool: (name: string, handler: ClientToolHandler) => void;
  unregisterClientTool: (name: string) => boolean;
  getClientTools: () => string[];
};

// Allow <telnyx-ai-agent> in JSX without pulling in widget types.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      'telnyx-ai-agent': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          'agent-id'?: string;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          [key: string]: any;
        },
        HTMLElement
      >;
    }
  }
}

type ToolLogEntry = {
  id: string;
  kind: 'invoked' | 'completed' | 'error';
  toolName: string;
  callId: string;
  detail?: string;
  timestamp: Date;
};

type WidgetVersionOption = {
  value: string;
  label: string;
  isBeta: boolean;
};

// ── Constants ──

const REGION_OPTIONS = [
  { value: 'auto', label: 'AUTO' },
  { value: 'eu', label: 'EU' },
  { value: 'us-central', label: 'US-CENTRAL' },
  { value: 'us-east', label: 'US-EAST' },
  { value: 'us-west', label: 'US-WEST' },
  { value: 'ca-central', label: 'CA-CENTRAL' },
  { value: 'apac', label: 'APAC' },
] as const;

const WIDGET_EVENTS = [
  'agent.connected',
  'agent.disconnected',
  'conversation.update',
  'transcript.item',
  'conversation.agent.state',
  'agent.audio.mute',
  'agent.error',
];

// ── Helpers ──

function asRecord(args: unknown): Record<string, unknown> {
  return args && typeof args === 'object'
    ? (args as Record<string, unknown>)
    : {};
}

// Validate that a widget version string only contains safe characters
// (npm version naming: digits, dots, hyphens, letters). This prevents DOM
// injection via the version picker — the value is user-selected but should
// never contain HTML/URL metacharacters.
function isSafeVersion(version: string): boolean {
  return /^(next|latest|beta|[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9._-]+)?)$/.test(
    version,
  );
}

function isBetaVersion(version: string): boolean {
  return /(?:^|[-.])beta(?:[-.]|$)/i.test(version);
}

function resolveWidgetVersionTag(
  version: string,
  distTags: Record<string, string>,
): string {
  return distTags[version] ?? version;
}

function isBetaWidgetVersion(
  version: string | undefined,
  distTags: Record<string, string>,
): boolean {
  if (!version) return false;
  return (
    isBetaVersion(version) ||
    isBetaVersion(resolveWidgetVersionTag(version, distTags))
  );
}

function buildWidgetVersionOptions(
  availableVersions: string[],
  distTags: Record<string, string>,
): WidgetVersionOption[] {
  const baseOptions: WidgetVersionOption[] = [
    {
      value: 'next',
      label: distTags.next ? `Next (${distTags.next})` : 'Next',
      isBeta: isBetaWidgetVersion('next', distTags),
    },
    {
      value: 'latest',
      label: distTags.latest ? `Latest (${distTags.latest})` : 'Latest',
      isBeta: isBetaWidgetVersion('latest', distTags),
    },
  ];

  if (distTags.beta) {
    baseOptions.push({
      value: 'beta',
      label: `Beta (${distTags.beta})`,
      isBeta: true,
    });
  }

  const seen = new Set(baseOptions.map((option) => option.value));
  for (const version of availableVersions) {
    if (seen.has(version)) continue;
    baseOptions.push({
      value: version,
      label: version,
      isBeta: isBetaWidgetVersion(version, distTags),
    });
    seen.add(version);
  }

  return baseOptions;
}

// Load the widget script once per version (shared across mounts). Custom
// elements can only be defined once per document, so the first version loaded
// wins; changing the version afterwards requires a page refresh for the
// direct-embed mode.
const widgetScriptPromises = new Map<string, Promise<void>>();
function loadWidgetScript(version: string): Promise<void> {
  if (!isSafeVersion(version)) {
    return Promise.reject(new Error(`Invalid widget version: ${version}`));
  }
  if (customElements.get('telnyx-ai-agent')) return Promise.resolve();
  const src = `https://unpkg.com/@telnyx/ai-agent-widget@${version}`;
  const cached = widgetScriptPromises.get(src);
  if (cached) return cached;

  const promise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${src}"]`,
    );
    if (existing) {
      customElements
        .whenDefined('telnyx-ai-agent')
        .then(() => resolve())
        .catch(reject);
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () =>
      customElements
        .whenDefined('telnyx-ai-agent')
        .then(() => resolve())
        .catch(reject);
    script.onerror = () =>
      reject(new Error(`Failed to load widget from ${src}`));
    document.head.appendChild(script);
  });
  widgetScriptPromises.set(src, promise);
  return promise;
}

// Build a props object for the direct-embed <telnyx-ai-agent> element from the
// same form values used by the iframe srcDoc — so both embed modes stay in
// sync with the single form.
function buildWidgetElementProps(
  values: FormValues,
  extraAttributes: CustomAttribute[],
): Record<string, string> {
  const props: Record<string, string> = {
    'agent-id': values.agentId,
  };

  if (values.versionId.trim())
    props['version-id'] = values.versionId.trim();
  if (values.conversationId.trim())
    props['conversation-id'] = values.conversationId.trim();

  if (values.region && values.region !== 'auto')
    props['region'] = values.region;

  if (values.trickleIce) props['trickle-ice'] = 'true';
  if (values.chatMode) props['chat-mode'] = 'true';
  if (values.debug) props['debug'] = 'true';
  if (values.showUserPerceivedLatency)
    props['show-user-perceived-latency'] = 'true';
  if (values.showGreetingLatency) props['show-greeting-latency'] = 'true';
  if (!values.skipLastVoiceSdkId) props['skip-last-voice-sdk-id'] = 'false';

  if (values.callDestinationNumber.trim())
    props['call-destination-number'] = values.callDestinationNumber.trim();
  if (values.callCallerNumber.trim())
    props['call-caller-number'] = values.callCallerNumber.trim();
  if (values.callCallerName.trim())
    props['call-caller-name'] = values.callCallerName.trim();
  if (values.callCustomHeaders.trim())
    props['call-custom-headers'] = values.callCustomHeaders.trim();
  if (values.callAudio.trim()) props['call-audio'] = values.callAudio.trim();
  if (values.vad.trim()) props['vad'] = values.vad.trim();

  if (IS_DEV_ENV) props['environment'] = 'development';

  for (const attr of extraAttributes) {
    if (attr.name.trim() && attr.value.trim()) {
      props[attr.name.trim()] = attr.value.trim();
    }
  }

  return props;
}

// ── Component ──

const AiAgentView = () => {
  const [isEmbedded, setIsEmbedded] = useState(false);
  const [currentFormValues, setCurrentFormValues] = useState<FormValues | null>(
    null,
  );
  const [currentCustomAttrs, setCurrentCustomAttrs] = useState<
    CustomAttribute[]
  >([]);
  const [invertBackground, setInvertBackground] = useState(false);
  const [availableVersions, setAvailableVersions] = useState<string[]>([]);
  const [widgetDistTags, setWidgetDistTags] = useState<Record<string, string>>(
    {},
  );
  const [versionsLoading, setVersionsLoading] = useState(true);
  const [events, setEvents] = useState<AiAgentEvent[]>([]);
  const [widgetConnectionInfo, setWidgetConnectionInfo] = useState<{
    dc: string | null;
    region: string | null;
    callReportId: string | null;
  } | null>(null);
  const [customAttributes, setCustomAttributes] = useState<CustomAttribute[]>(
    [],
  );

  // Client-side tools state
  const widgetRef = useRef<TelnyxAiAgentEl | null>(null);
  const [widgetScriptReady, setWidgetScriptReady] = useState(false);
  const [registeredTools, setRegisteredTools] = useState<string[]>([]);
  const [toolLog, setToolLog] = useState<ToolLogEntry[]>([]);
  const smsConfigRef = useRef({ apiKey: '', fromNumber: '' });

  const form = useForm<FormValues>({
    defaultValues: {
      agentId: '',
      version: 'beta',
      versionId: '',
      conversationId: '',
      region: 'auto',
      trickleIce: false,
      chatMode: false,
      debug: false,
      showUserPerceivedLatency: false,
      showGreetingLatency: false,
      skipLastVoiceSdkId: true,
      callDestinationNumber: '',
      callCallerNumber: '',
      callCallerName: '',
      callCustomHeaders: '',
      callAudio: '',
      vad: '',
      clientToolsEnabled: false,
      smsApiKey: '',
      smsFromNumber: '',
    },
  });

  const selectedWidgetVersion = useWatch({
    control: form.control,
    name: 'version',
  });
  const versionOptions = useMemo(
    () => buildWidgetVersionOptions(availableVersions, widgetDistTags),
    [availableVersions, widgetDistTags],
  );
  const clientToolsAvailableForSelectedVersion = isBetaWidgetVersion(
    selectedWidgetVersion,
    widgetDistTags,
  );

  const clientToolsActive =
    isEmbedded &&
    !!currentFormValues?.clientToolsEnabled &&
    isBetaWidgetVersion(currentFormValues.version, widgetDistTags);

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

      if (event.data.eventType === 'agent.connected') {
        const detail = event.data.detail as
          | {
              dc?: string | null;
              region?: string | null;
              callReportId?: string | null;
            }
          | undefined;
        setWidgetConnectionInfo({
          dc: detail?.dc ?? null,
          region: detail?.region ?? null,
          callReportId: detail?.callReportId ?? null,
        });
      } else if (event.data.eventType === 'agent.disconnected') {
        setWidgetConnectionInfo(null);
      }
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
        setWidgetDistTags((data['dist-tags'] as Record<string, string>) ?? {});

        const filteredVersions = Object.entries(
          data.versions as Record<string, { deprecated?: string }>,
        )
          .filter(([, metadata]) => {
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

  useEffect(() => {
    if (!clientToolsAvailableForSelectedVersion) {
      form.setValue('clientToolsEnabled', false);
    }
  }, [clientToolsAvailableForSelectedVersion, form]);

  // Keep the latest SMS config available to the (stable) tool handler.
  useEffect(() => {
    if (currentFormValues) {
      smsConfigRef.current = {
        apiKey: currentFormValues.smsApiKey.trim(),
        fromNumber: currentFormValues.smsFromNumber.trim(),
      };
    }
  }, [currentFormValues]);

  const pushLog = useCallback(
    (entry: Omit<ToolLogEntry, 'id' | 'timestamp'>) => {
      setToolLog((prev) => [
        { ...entry, id: crypto.randomUUID(), timestamp: new Date() },
        ...prev,
      ]);
    },
    [],
  );

  // Load the widget script when client-tools embed is active.
  useEffect(() => {
    if (!clientToolsActive) {
      setWidgetScriptReady(false);
      return;
    }
    let cancelled = false;
    loadWidgetScript(currentFormValues!.version)
      .then(() => {
        if (!cancelled) setWidgetScriptReady(true);
      })
      .catch((err) => {
        if (!cancelled) toast.error(String(err?.message ?? err));
      });
    return () => {
      cancelled = true;
    };
  }, [clientToolsActive, currentFormValues?.version]);

  // Register the send_message client tool.
  useEffect(() => {
    if (!widgetScriptReady || !clientToolsActive) return;
    const widget = widgetRef.current;
    if (!widget) return;

    if (
      typeof widget.registerClientTool !== 'function' ||
      typeof widget.unregisterClientTool !== 'function' ||
      typeof widget.getClientTools !== 'function'
    ) {
      toast.error(
        'Selected widget version does not support client-side tools yet.',
      );
      return;
    }

    widget.registerClientTool('send_message', async (args) => {
      const a = asRecord(args);
      const to = String(a.to ?? '').trim();
      const text = String(a.text ?? a.message ?? '').trim();
      const { apiKey, fromNumber } = smsConfigRef.current;

      if (!to || !text) {
        return { sent: false, error: 'Both "to" and "text" are required.' };
      }
      if (!apiKey || !fromNumber) {
        return {
          sent: false,
          error:
            'Demo is missing a Telnyx API key or "from" number; cannot send.',
        };
      }

      try {
        const res = await fetch('https://api.telnyx.com/v2/messages', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ from: fromNumber, to, text }),
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
          const detail = body?.errors?.[0]?.detail ?? `HTTP ${res.status}`;
          return { sent: false, to, error: detail };
        }
        toast.success(`SMS sent to ${to}`);
        return {
          sent: true,
          to,
          messageId: body?.data?.id ?? null,
        };
      } catch (err) {
        return {
          sent: false,
          to,
          error: err instanceof Error ? err.message : String(err),
        };
      }
    });

    queueMicrotask(() => setRegisteredTools(widget.getClientTools()));

    return () => {
      widget.unregisterClientTool('send_message');
      setRegisteredTools([]);
    };
  }, [widgetScriptReady, clientToolsActive]);

  // Observe tool lifecycle events (safe correlation fields only — no payloads).
  useEffect(() => {
    if (!widgetScriptReady || !clientToolsActive) return;
    const widget = widgetRef.current;
    if (!widget) return;

    const onInvoked = (e: Event) => {
      const { callId, toolName } = (e as CustomEvent).detail ?? {};
      pushLog({ kind: 'invoked', toolName, callId });
    };
    const onCompleted = (e: Event) => {
      const { callId, toolName, isError } = (e as CustomEvent).detail ?? {};
      pushLog({
        kind: 'completed',
        toolName,
        callId,
        detail: isError ? 'returned error output' : 'returned result',
      });
    };
    const onError = (e: Event) => {
      const { callId, toolName, reason } = (e as CustomEvent).detail ?? {};
      pushLog({ kind: 'error', toolName, callId, detail: reason });
    };

    widget.addEventListener('client.tool.invoked', onInvoked);
    widget.addEventListener('client.tool.completed', onCompleted);
    widget.addEventListener('client.tool.error', onError);

    return () => {
      widget.removeEventListener('client.tool.invoked', onInvoked);
      widget.removeEventListener('client.tool.completed', onCompleted);
      widget.removeEventListener('client.tool.error', onError);
    };
  }, [widgetScriptReady, clientToolsActive, pushLog]);

  const getIframeSrcDoc = (
    values: FormValues,
    extraAttributes: CustomAttribute[],
  ) => {
    const versionSuffix = `@${values.version}`;

    const attrs: string[] = [`agent-id="${values.agentId}"`];

    if (values.trickleIce) attrs.push('trickle-ice="true"');
    if (values.chatMode) attrs.push('chat-mode="true"');
    if (values.debug) attrs.push('debug="true"');
    if (values.showUserPerceivedLatency)
      attrs.push('show-user-perceived-latency="true"');
    if (values.showGreetingLatency)
      attrs.push('show-greeting-latency="true"');
    if (!values.skipLastVoiceSdkId) attrs.push('skip-last-voice-sdk-id="false"');

    if (values.region && values.region !== 'auto')
      attrs.push(`region="${values.region}"`);

    if (IS_DEV_ENV) attrs.push('environment="development"');

    if (values.versionId.trim())
      attrs.push(`version-id="${values.versionId.trim()}"`);
    if (values.conversationId.trim())
      attrs.push(`conversation-id="${values.conversationId.trim()}"`);
    if (values.callDestinationNumber.trim())
      attrs.push(
        `call-destination-number="${values.callDestinationNumber.trim()}"`,
      );
    if (values.callCallerNumber.trim())
      attrs.push(`call-caller-number="${values.callCallerNumber.trim()}"`);
    if (values.callCallerName.trim())
      attrs.push(`call-caller-name="${values.callCallerName.trim()}"`);
    if (values.callCustomHeaders.trim())
      attrs.push(
        `call-custom-headers='${values.callCustomHeaders.trim()}'`,
      );
    if (values.callAudio.trim())
      attrs.push(`call-audio='${values.callAudio.trim()}'`);
    if (values.vad.trim()) attrs.push(`vad='${values.vad.trim()}'`);

    const customAttrsStr = extraAttributes
      .filter((attr) => attr.name.trim() && attr.value.trim())
      .map((attr) => `${attr.name.trim()}="${attr.value.trim()}"`)
      .join(' ');
    if (customAttrsStr) attrs.push(customAttrsStr);

    const attrString = attrs.join(' ');

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
          <telnyx-ai-agent ${attrString}></telnyx-ai-agent>
          <script>${eventListenersScript}</script>
        </body>
      </html>
    `;
  };

  const onSubmit = (values: FormValues) => {
    if (!values.agentId.trim()) return;

    const clientToolsEnabled =
      values.clientToolsEnabled &&
      isBetaWidgetVersion(values.version, widgetDistTags);

    if (values.clientToolsEnabled && !clientToolsEnabled) {
      toast.error('Client-side tools require a beta widget version.');
    }

    setCurrentFormValues({
      ...values,
      agentId: values.agentId.trim(),
      clientToolsEnabled,
    });
    setCurrentCustomAttrs([...customAttributes]);
    setIsEmbedded(true);
    setToolLog([]);
  };

  const handleReset = () => {
    setIsEmbedded(false);
    setCurrentFormValues(null);
    setCurrentCustomAttrs([]);
    setEvents([]);
    setWidgetConnectionInfo(null);
    setCustomAttributes([]);
    setToolLog([]);
    setRegisteredTools([]);
    setWidgetScriptReady(false);
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

  const toolsBadges = useMemo(
    () =>
      registeredTools.map((name) => (
        <Badge key={name} variant="outline" className="font-mono">
          {name}
        </Badge>
      )),
    [registeredTools],
  );

  const embedKey = JSON.stringify({
    ...currentFormValues,
    customAttrs: currentCustomAttrs,
  });

  const directEmbedProps = currentFormValues
    ? buildWidgetElementProps(currentFormValues, currentCustomAttrs)
    : {};

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div className="space-y-4">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>AI Agent Widget</CardTitle>
            <CardDescription>
              Configure and embed the Telnyx AI Agent widget with all available
              options.
            </CardDescription>
          </CardHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardContent className="space-y-6">
                {/* ── Core Settings ── */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    Core
                  </h3>
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
                    name="versionId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Version ID</FormLabel>
                        <FormControl>
                          <Input
                            data-testid="input-version-id"
                            placeholder="Optional — agent version to use"
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
                            {versionOptions.map((option) => (
                              <SelectItem
                                key={option.value}
                                value={option.value}
                              >
                                {option.label}
                                {option.isBeta ? ' 🧪' : ''}
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
                  <FormField
                    control={form.control}
                    name="region"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Region</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-region">
                              <SelectValue placeholder="Select region" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {REGION_OPTIONS.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* ── Feature Toggles ── */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    Features
                  </h3>
                  <FormField
                    control={form.control}
                    name="trickleIce"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Trickle ICE</FormLabel>
                          <p className="text-sm text-muted-foreground">
                            Faster connection establishment
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
                    name="chatMode"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Chat Mode</FormLabel>
                          <p className="text-sm text-muted-foreground">
                            Text-only — no microphone or audio playback
                          </p>
                        </div>
                        <FormControl>
                          <Switch
                            data-testid="switch-chat-mode"
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="debug"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Debug</FormLabel>
                          <p className="text-sm text-muted-foreground">
                            Enable debug logging in the widget
                          </p>
                        </div>
                        <FormControl>
                          <Switch
                            data-testid="switch-debug"
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="showUserPerceivedLatency"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Show User-Perceived Latency</FormLabel>
                          <p className="text-sm text-muted-foreground">
                            Display latency overlay in the widget
                          </p>
                        </div>
                        <FormControl>
                          <Switch
                            data-testid="switch-show-latency"
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="showGreetingLatency"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Show Greeting Latency</FormLabel>
                          <p className="text-sm text-muted-foreground">
                            Display greeting latency in the widget
                          </p>
                        </div>
                        <FormControl>
                          <Switch
                            data-testid="switch-show-greeting-latency"
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="skipLastVoiceSdkId"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Skip Last Voice SDK ID</FormLabel>
                          <p className="text-sm text-muted-foreground">
                            On reconnect, route to a fresh b2bua-rtc instance
                          </p>
                        </div>
                        <FormControl>
                          <Switch
                            data-testid="switch-skip-last-voice-sdk-id"
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                {/* ── Call Options ── */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    Call Options
                  </h3>
                  <FormField
                    control={form.control}
                    name="callDestinationNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Destination Number</FormLabel>
                        <FormControl>
                          <Input
                            data-testid="input-call-destination-number"
                            placeholder="Optional — override destination"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="callCallerName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Caller Name</FormLabel>
                        <FormControl>
                          <Input
                            data-testid="input-call-caller-name"
                            placeholder="Optional"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="callCallerNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Caller Number</FormLabel>
                        <FormControl>
                          <Input
                            data-testid="input-call-caller-number"
                            placeholder="Optional"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="callCustomHeaders"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Custom Headers (JSON)</FormLabel>
                        <FormControl>
                          <Textarea
                            data-testid="input-call-custom-headers"
                            placeholder='[{"name":"X-Header","value":"val"}]'
                            className="font-mono text-xs"
                            rows={2}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="callAudio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Audio Constraints (JSON)</FormLabel>
                        <FormControl>
                          <Textarea
                            data-testid="input-call-audio"
                            placeholder='{"echoCancellation":true,"noiseSuppression":true}'
                            className="font-mono text-xs"
                            rows={2}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="vad"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>VAD Options (JSON)</FormLabel>
                        <FormControl>
                          <Textarea
                            data-testid="input-vad"
                            placeholder='{"type":"silero","threshold":0.5}'
                            className="font-mono text-xs"
                            rows={2}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* ── Client-Side Tools ── */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    Client-Side Tools
                  </h3>
                  <FormField
                    control={form.control}
                    name="clientToolsEnabled"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <FormLabel>
                              Register send_message (SMS) tool
                            </FormLabel>
                            <Badge variant="outline">Beta only</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Embeds the widget directly (not in an iframe) and
                            registers a <code className="text-xs">send_message</code>{' '}
                            client-side tool that sends an SMS via the Telnyx
                            Messaging API. The demo defaults to the widget beta
                            dist-tag so this exercises the latest client-side
                            tool API.
                          </p>
                          {!clientToolsAvailableForSelectedVersion && (
                            <p className="text-xs text-muted-foreground">
                              Client-side tools are disabled for this widget
                              version because the API is currently beta-only.
                            </p>
                          )}
                        </div>
                        <FormControl>
                          <Switch
                            data-testid="switch-client-tools"
                            checked={
                              field.value &&
                              clientToolsAvailableForSelectedVersion
                            }
                            disabled={!clientToolsAvailableForSelectedVersion}
                            onCheckedChange={(checked) =>
                              field.onChange(
                                clientToolsAvailableForSelectedVersion &&
                                  checked,
                              )
                            }
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="smsApiKey"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telnyx API Key (for send_message)</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            data-testid="input-sms-api-key"
                            placeholder="KEY..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="smsFromNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>From Number (E.164)</FormLabel>
                        <FormControl>
                          <Input
                            data-testid="input-sms-from"
                            placeholder="+1..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <p className="text-xs text-muted-foreground">
                    The API key is used only in your browser to call{' '}
                    <code className="text-xs">POST /v2/messages</code>. Leave the
                    SMS fields blank to register the tool in "dry" mode (it will
                    return a safe error instead of sending).
                  </p>
                </div>

                {/* ── Custom Attributes ── */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                      Custom Attributes
                    </h3>
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

        {clientToolsActive && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Registered Client Tools</CardTitle>
                <CardDescription>
                  Live result of{' '}
                  <code className="text-xs">getClientTools()</code>
                </CardDescription>
              </CardHeader>
              <CardContent>
                {registeredTools.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No tools registered.
                  </p>
                ) : (
                  <div
                    className="flex flex-wrap gap-2"
                    data-testid="ct-registered-tools"
                  >
                    {toolsBadges}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tool Invocation Log</CardTitle>
                <CardDescription>
                  <code className="text-xs">client.tool.invoked</code> /{' '}
                  <code className="text-xs">completed</code> /{' '}
                  <code className="text-xs">error</code> — no arguments or
                  outputs are logged, only the tool name and call_id.
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[260px] overflow-y-auto">
                {toolLog.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No tool calls yet. Start a conversation and ask the
                    assistant to send a message.
                  </p>
                ) : (
                  <div className="space-y-1">
                    {toolLog.map((entry) => (
                      <div
                        key={entry.id}
                        className="flex items-start gap-2 border-b py-1 text-xs"
                        data-testid={`ct-tool-log-${entry.kind}`}
                      >
                        <span className="text-muted-foreground whitespace-nowrap">
                          {entry.timestamp.toLocaleTimeString()}
                        </span>
                        <Badge
                          variant={
                            entry.kind === 'error'
                              ? 'destructive'
                              : entry.kind === 'completed'
                                ? 'default'
                                : 'secondary'
                          }
                        >
                          {entry.kind}
                        </Badge>
                        <span className="font-mono">{entry.toolName}</span>
                        {entry.detail && (
                          <span className="text-muted-foreground">
                            — {entry.detail}
                          </span>
                        )}
                        <span className="ml-auto font-mono text-muted-foreground truncate max-w-[120px]">
                          {entry.callId}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <Card className="flex flex-col min-h-[600px]">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex-1 min-w-0">
            <CardTitle>Widget Preview</CardTitle>
            <CardDescription>
              {isEmbedded && currentFormValues
                ? clientToolsActive
                  ? `Direct embed (client tools) — agent: ${currentFormValues.agentId}`
                  : `Showing agent: ${currentFormValues.agentId}`
                : 'Enter an Agent ID and click Embed to see the widget.'}
            </CardDescription>
            {widgetConnectionInfo &&
              (widgetConnectionInfo.region ||
                widgetConnectionInfo.dc ||
                widgetConnectionInfo.callReportId) && (
                <div
                  className="mt-1 text-xs text-muted-foreground space-x-2 truncate"
                  data-testid="widget-connection-info"
                >
                  {widgetConnectionInfo.region && (
                    <span data-testid="widget-connection-info-region">
                      region: {widgetConnectionInfo.region}
                    </span>
                  )}
                  {widgetConnectionInfo.dc && (
                    <span data-testid="widget-connection-info-dc">
                      dc: {widgetConnectionInfo.dc}
                    </span>
                  )}
                  {widgetConnectionInfo.callReportId && (
                    <span
                      className="font-mono"
                      data-testid="widget-connection-info-call-report-id"
                    >
                      call_report_id: {widgetConnectionInfo.callReportId}
                    </span>
                  )}
                </div>
              )}
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
            {isEmbedded && currentFormValues ? (
              clientToolsActive ? (
                <div key={embedKey} className="h-full w-full" data-testid="widget-direct-embed">
                  {widgetScriptReady ? (
                    <telnyx-ai-agent
                      ref={widgetRef as React.Ref<HTMLElement>}
                      data-testid="ct-widget"
                      {...directEmbedProps}
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Loading widget…
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-2 p-2">
                    Start a call from the widget, then ask the assistant to text
                    someone — e.g. &ldquo;send a message to +1555… saying the
                    order shipped&rdquo;. The assistant must have a{' '}
                    <code className="text-xs">send_message</code> tool configured
                    by name.
                  </p>
                </div>
              ) : (
                <iframe
                  key={embedKey}
                  srcDoc={getIframeSrcDoc(currentFormValues, currentCustomAttrs)}
                  className="h-full w-full border-0"
                  allow="microphone; camera; autoplay"
                  title="AI Agent Widget"
                />
              )
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
