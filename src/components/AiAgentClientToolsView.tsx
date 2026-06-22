import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { IS_DEV_ENV } from '@/lib/vite';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

/**
 * Client-Side Tools example for the AI Agent tab.
 *
 * This view embeds the published `@telnyx/ai-agent-widget` web component
 * (pinned to the beta that ships the client-side tool API) directly in the
 * React tree — rather than in an iframe like the "Widget Embed" sub-tab — so it
 * can grab the element and register a client-side tool imperatively:
 *
 *   agent emits a `client_side_tool` call → the widget runs your registered
 *   handler in the browser → the return value is sent back to the assistant as
 *   the tool output (`function_call_output`).
 *
 * We register a single, real-world example: `send_message`, which sends an SMS
 * via the Telnyx Messaging API (POST /v2/messages). Configure a tool with the
 * same name on your assistant, then ask it to text someone during the call.
 */

// Beta widget version that ships registerClientTool/getClientTools/etc.
// (the client_side_tool flow from PR-531). Pinned intentionally.
const WIDGET_VERSION = '0.33.8-beta.0';
const WIDGET_SCRIPT_SRC = `https://unpkg.com/@telnyx/ai-agent-widget@${WIDGET_VERSION}`;

// The widget element exposes these imperatively (not via HTML attributes).
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
        React.HTMLAttributes<HTMLElement> & { 'agent-id'?: string },
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

function asRecord(args: unknown): Record<string, unknown> {
  return args && typeof args === 'object'
    ? (args as Record<string, unknown>)
    : {};
}

// Load the widget script once (shared across mounts).
let widgetScriptPromise: Promise<void> | null = null;
function loadWidgetScript(): Promise<void> {
  if (customElements.get('telnyx-ai-agent')) return Promise.resolve();
  if (widgetScriptPromise) return widgetScriptPromise;

  widgetScriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${WIDGET_SCRIPT_SRC}"]`,
    );
    if (existing) {
      customElements
        .whenDefined('telnyx-ai-agent')
        .then(() => resolve())
        .catch(reject);
      return;
    }
    const script = document.createElement('script');
    script.src = WIDGET_SCRIPT_SRC;
    script.async = true;
    script.onload = () =>
      customElements
        .whenDefined('telnyx-ai-agent')
        .then(() => resolve())
        .catch(reject);
    script.onerror = () =>
      reject(new Error(`Failed to load widget from ${WIDGET_SCRIPT_SRC}`));
    document.head.appendChild(script);
  });
  return widgetScriptPromise;
}

type SmsConfig = {
  apiKey: string;
  fromNumber: string;
};

const ClientToolsConsole = ({
  agentId,
  sms,
  onDisconnect,
}: {
  agentId: string;
  sms: SmsConfig;
  onDisconnect: () => void;
}) => {
  const widgetRef = useRef<TelnyxAiAgentEl | null>(null);
  const [widgetReady, setWidgetReady] = useState(false);
  const [registeredTools, setRegisteredTools] = useState<string[]>([]);
  const [toolLog, setToolLog] = useState<ToolLogEntry[]>([]);

  // Keep the latest SMS config available to the (stable) tool handler.
  const smsRef = useRef(sms);
  useEffect(() => {
    smsRef.current = sms;
  }, [sms]);

  const pushLog = useCallback(
    (entry: Omit<ToolLogEntry, 'id' | 'timestamp'>) => {
      setToolLog((prev) => [
        { ...entry, id: crypto.randomUUID(), timestamp: new Date() },
        ...prev,
      ]);
    },
    [],
  );

  // Make sure the custom element is defined before we render it.
  useEffect(() => {
    let cancelled = false;
    loadWidgetScript()
      .then(() => {
        if (!cancelled) setWidgetReady(true);
      })
      .catch((err) => {
        if (!cancelled) toast.error(String(err?.message ?? err));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Register the single example client tool: send_message (SMS via Telnyx).
  useEffect(() => {
    if (!widgetReady) return;
    const widget = widgetRef.current;
    if (!widget) return;

    widget.registerClientTool('send_message', async (args) => {
      const a = asRecord(args);
      const to = String(a.to ?? '').trim();
      const text = String(a.text ?? a.message ?? '').trim();
      const { apiKey, fromNumber } = smsRef.current;

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
          const detail =
            body?.errors?.[0]?.detail ?? `HTTP ${res.status}`;
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
    };
  }, [widgetReady]);

  // Observe tool lifecycle events (safe correlation fields only — no payloads).
  useEffect(() => {
    if (!widgetReady) return;
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
  }, [widgetReady, pushLog]);

  const toolsBadges = useMemo(
    () =>
      registeredTools.map((name) => (
        <Badge key={name} variant="outline" className="font-mono">
          {name}
        </Badge>
      )),
    [registeredTools],
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>AI Agent Widget</CardTitle>
              <CardDescription>
                <code className="text-xs">
                  @telnyx/ai-agent-widget@{WIDGET_VERSION}
                </code>{' '}
                · agent <span className="font-mono">{agentId}</span>
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onDisconnect}
              data-testid="ct-disconnect"
            >
              Disconnect
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {widgetReady ? (
            <telnyx-ai-agent
              ref={widgetRef as React.Ref<HTMLElement>}
              agent-id={agentId}
              {...(IS_DEV_ENV ? { environment: 'development' } : {})}
              data-testid="ct-widget"
            />
          ) : (
            <p className="text-sm text-muted-foreground">Loading widget…</p>
          )}
          <p className="text-xs text-muted-foreground">
            Start a call from the widget, then ask the assistant to text
            someone — e.g. “send a message to +1555… saying the order shipped”.
            The assistant must have a <code className="text-xs">send_message</code>{' '}
            tool configured by name.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Registered Client Tools</CardTitle>
          <CardDescription>
            Live result of <code className="text-xs">getClientTools()</code>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {registeredTools.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tools registered.</p>
          ) : (
            <div className="flex flex-wrap gap-2" data-testid="ct-registered-tools">
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
            <code className="text-xs">error</code> — no arguments or outputs are
            logged, only the tool name and call_id.
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[260px] overflow-y-auto">
          {toolLog.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No tool calls yet. Start a conversation and ask the assistant to
              send a message.
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
    </div>
  );
};

const AiAgentClientToolsView = () => {
  const [agentIdInput, setAgentIdInput] = useState('');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [fromInput, setFromInput] = useState('');
  const [connected, setConnected] = useState<{
    agentId: string;
    sms: SmsConfig;
  } | null>(null);

  const canConnect = agentIdInput.trim().length > 0;

  if (!connected) {
    return (
      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Client-Side Tools</CardTitle>
          <CardDescription>
            Embeds <code className="text-xs">@telnyx/ai-agent-widget@{WIDGET_VERSION}</code>{' '}
            and registers a single client-side tool —{' '}
            <code className="text-xs">send_message</code> — that sends an SMS via
            the Telnyx Messaging API. Configure a matching tool on your assistant.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Agent ID</label>
            <Input
              placeholder="assistant-xxx"
              value={agentIdInput}
              onChange={(e) => setAgentIdInput(e.target.value)}
              data-testid="ct-agent-id"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">
              Telnyx API key (for send_message)
            </label>
            <Input
              type="password"
              placeholder="KEY..."
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              data-testid="ct-sms-api-key"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">
              From number (E.164)
            </label>
            <Input
              placeholder="+1..."
              value={fromInput}
              onChange={(e) => setFromInput(e.target.value)}
              data-testid="ct-sms-from"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            The API key is used only in your browser to call{' '}
            <code className="text-xs">POST /v2/messages</code>. Leave the SMS
            fields blank to register the tool in “dry” mode (it will return a
            safe error instead of sending).
          </p>
        </CardContent>
        <CardFooter className="justify-end">
          <Button
            onClick={() =>
              setConnected({
                agentId: agentIdInput.trim(),
                sms: {
                  apiKey: apiKeyInput.trim(),
                  fromNumber: fromInput.trim(),
                },
              })
            }
            disabled={!canConnect}
            data-testid="ct-connect"
          >
            Connect
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <ClientToolsConsole
      agentId={connected.agentId}
      sms={connected.sms}
      onDisconnect={() => setConnected(null)}
    />
  );
};

export default AiAgentClientToolsView;
