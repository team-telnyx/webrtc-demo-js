import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  TelnyxAIAgentProvider,
  useClient,
  useConnectionState,
  useTranscript,
  useAgentState,
} from '@telnyx/ai-agent-lib';
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
import { useTheme } from '@/providers/ThemeProvider';
import { toast } from 'sonner';

/**
 * Client-Side Tools example for the AI Agent tab.
 *
 * Unlike the "Widget Embed" sub-tab (which embeds the published
 * `@telnyx/ai-agent-widget` web component in an iframe), this view drives the
 * `@telnyx/ai-agent-lib` developer API directly so it can demonstrate the
 * client-side tool registration/execution flow added in VSDK-253:
 *
 *   agent emits `function_call` → the lib runs your registered handler in the
 *   browser → the return value is sent back to the assistant as the tool output.
 *
 * The handlers below are intentionally simple, real-world-ish examples:
 *   - get_current_time   — no args, returns client clock + timezone
 *   - get_browser_info   — no args, reads navigator/screen state
 *   - lookup_order       — takes { orderId }, returns data the page "owns"
 *   - set_theme          — takes { theme }, performs a real UI side effect
 *
 * Configure tools with matching names on your assistant, then ask it to use
 * them during the conversation.
 */

type ToolLogEntry = {
  id: string;
  kind: 'invoked' | 'completed' | 'error';
  toolName: string;
  callId: string;
  detail?: string;
  timestamp: Date;
};

// Tiny fake "order database" the lookup_order tool reads from. In a real app
// this would be page state, a cache, or an API the browser is authed for.
const FAKE_ORDERS: Record<
  string,
  { status: string; total: string; eta: string }
> = {
  '1001': { status: 'shipped', total: '$42.00', eta: '2 days' },
  '1002': { status: 'processing', total: '$128.50', eta: '5 days' },
  '1003': { status: 'delivered', total: '$9.99', eta: 'delivered' },
};

function asRecord(args: unknown): Record<string, unknown> {
  return args && typeof args === 'object' ? (args as Record<string, unknown>) : {};
}

/**
 * The interactive console. Must be rendered inside <TelnyxAIAgentProvider>,
 * since it relies on useClient()/useConnectionState()/etc.
 */
function ClientToolsConsole({ onDisconnect }: { onDisconnect: () => void }) {
  const client = useClient();
  const connectionState = useConnectionState();
  const transcript = useTranscript();
  const agentState = useAgentState();
  const { setTheme } = useTheme();

  const [registeredTools, setRegisteredTools] = useState<string[]>([]);
  const [toolLog, setToolLog] = useState<ToolLogEntry[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [inCall, setInCall] = useState(false);

  const pushLog = useCallback((entry: Omit<ToolLogEntry, 'id' | 'timestamp'>) => {
    setToolLog((prev) => [
      {
        ...entry,
        id: crypto.randomUUID(),
        timestamp: new Date(),
      },
      ...prev,
    ]);
  }, []);

  // Register the example client-side tools once the client is available.
  useEffect(() => {
    client.registerClientTool('get_current_time', () => ({
      iso: new Date().toISOString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    }));

    client.registerClientTool('get_browser_info', () => ({
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      viewport: { width: window.innerWidth, height: window.innerHeight },
    }));

    client.registerClientTool('lookup_order', (args) => {
      const orderId = String(asRecord(args).orderId ?? '').trim();
      const order = FAKE_ORDERS[orderId];
      if (!order) {
        return { found: false, orderId, message: 'No order with that id.' };
      }
      return { found: true, orderId, ...order };
    });

    client.registerClientTool('set_theme', (args) => {
      const requested = String(asRecord(args).theme ?? '').toLowerCase();
      if (requested !== 'light' && requested !== 'dark') {
        return { applied: false, error: 'theme must be "light" or "dark"' };
      }
      setTheme(requested);
      toast.success(`Theme switched to ${requested} by the assistant`);
      return { applied: true, theme: requested };
    });

    // Mirror the registry into React state for display. Deferred to a
    // microtask so we don't call setState synchronously inside the effect body
    // (avoids the cascading-render lint rule / extra render pass).
    queueMicrotask(() => setRegisteredTools(client.getClientTools()));

    return () => {
      client.unregisterClientTool('get_current_time');
      client.unregisterClientTool('get_browser_info');
      client.unregisterClientTool('lookup_order');
      client.unregisterClientTool('set_theme');
    };
  }, [client, setTheme]);

  // Observe tool lifecycle events (no payloads — only safe correlation fields).
  useEffect(() => {
    const onInvoked = ({
      callId,
      toolName,
    }: {
      callId: string;
      toolName: string;
    }) => pushLog({ kind: 'invoked', toolName, callId });

    const onCompleted = ({
      callId,
      toolName,
      isError,
    }: {
      callId: string;
      toolName: string;
      isError: boolean;
    }) =>
      pushLog({
        kind: 'completed',
        toolName,
        callId,
        detail: isError ? 'returned error output' : 'returned result',
      });

    const onError = ({
      callId,
      toolName,
      reason,
    }: {
      callId: string;
      toolName: string;
      reason: string;
    }) => pushLog({ kind: 'error', toolName, callId, detail: reason });

    client.on('client.tool.invoked', onInvoked);
    client.on('client.tool.completed', onCompleted);
    client.on('client.tool.error', onError);

    return () => {
      client.off('client.tool.invoked', onInvoked);
      client.off('client.tool.completed', onCompleted);
      client.off('client.tool.error', onError);
    };
  }, [client, pushLog]);

  const handleStart = useCallback(async () => {
    try {
      await client.startConversation();
      setInCall(true);
    } catch (err) {
      toast.error(
        `Failed to start conversation: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    }
  }, [client]);

  const handleEnd = useCallback(async () => {
    await client.endConversation();
    setInCall(false);
  }, [client]);

  const handleSendChat = useCallback(() => {
    const text = chatInput.trim();
    if (!text) return;
    client.sendConversationMessage(text);
    setChatInput('');
  }, [client, chatInput]);

  const connectionBadge = useMemo(() => {
    const variant =
      connectionState === 'connected'
        ? 'default'
        : connectionState === 'error'
          ? 'destructive'
          : 'secondary';
    return (
      <Badge variant={variant} data-testid="ct-connection-state">
        {connectionState}
      </Badge>
    );
  }, [connectionState]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Conversation</CardTitle>
              <CardDescription>
                Connection {connectionBadge} · agent state:{' '}
                <span className="font-mono">{agentState.state}</span>
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
          <div className="flex gap-2">
            {!inCall ? (
              <Button
                onClick={handleStart}
                disabled={connectionState !== 'connected'}
                data-testid="ct-start-conversation"
              >
                Start Conversation
              </Button>
            ) : (
              <Button
                variant="destructive"
                onClick={handleEnd}
                data-testid="ct-end-conversation"
              >
                End Conversation
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Send a text message to the assistant…"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSendChat();
              }}
              disabled={!inCall}
              data-testid="ct-chat-input"
            />
            <Button
              variant="secondary"
              onClick={handleSendChat}
              disabled={!inCall}
              data-testid="ct-chat-send"
            >
              Send
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Try asking the assistant: “what time is it?”, “look up order 1002”,
            or “switch to light mode”. The assistant must have matching tools
            configured by name.
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
              {registeredTools.map((name) => (
                <Badge key={name} variant="outline" className="font-mono">
                  {name}
                </Badge>
              ))}
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
              use one of the tools.
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

      <Card>
        <CardHeader>
          <CardTitle>Transcript</CardTitle>
        </CardHeader>
        <CardContent className="h-[200px] overflow-y-auto space-y-1">
          {transcript.length === 0 ? (
            <p className="text-sm text-muted-foreground">No transcript yet.</p>
          ) : (
            transcript.map((item) => (
              <div key={item.id} className="text-sm">
                <span className="font-semibold">{item.role}: </span>
                <span>{item.content}</span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

const AiAgentClientToolsView = () => {
  const [agentIdInput, setAgentIdInput] = useState('');
  const [connectedAgentId, setConnectedAgentId] = useState<string | null>(null);

  if (!connectedAgentId) {
    return (
      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Client-Side Tools (SDK)</CardTitle>
          <CardDescription>
            Drives <code className="text-xs">@telnyx/ai-agent-lib</code>{' '}
            directly to demonstrate client-side tool registration and execution.
            Enter an Agent ID and connect to register the example tools.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="assistant-xxx"
            value={agentIdInput}
            onChange={(e) => setAgentIdInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && agentIdInput.trim()) {
                setConnectedAgentId(agentIdInput.trim());
              }
            }}
            data-testid="ct-agent-id"
          />
        </CardContent>
        <CardFooter className="justify-end">
          <Button
            onClick={() => setConnectedAgentId(agentIdInput.trim())}
            disabled={!agentIdInput.trim()}
            data-testid="ct-connect"
          >
            Connect
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <TelnyxAIAgentProvider
      agentId={connectedAgentId}
      environment={IS_DEV_ENV ? 'development' : 'production'}
    >
      <ClientToolsConsole onDisconnect={() => setConnectedAgentId(null)} />
    </TelnyxAIAgentProvider>
  );
};

export default AiAgentClientToolsView;
