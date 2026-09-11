import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import AiAgentView from './AiAgentView';

// SSR checks the actual form defaults and labels without loading a remote widget.
describe('AI Agent connection controls', () => {
  it('contains positioned form controls inside the independently scrolling column', () => {
    const markup = renderToStaticMarkup(<AiAgentView />);
    expect(markup).toMatch(
      /class="relative [^"]*md:overflow-y-auto[^"]*" data-testid="ai-agent-configuration"/,
    );
  });

  it('offers a separate, disabled-by-default text-only toggle', () => {
    const markup = renderToStaticMarkup(<AiAgentView />);
    expect(markup).toMatch(
      /aria-checked="false"[^>]*data-testid="switch-text-only"/,
    );
    expect(markup).toContain('without WebRTC');
  });

  it('keeps legacy Chat Mode with a deprecation and WebRTC warning', () => {
    const markup = renderToStaticMarkup(<AiAgentView />);
    expect(markup).toContain('Chat Mode');
    expect(markup).toContain('Deprecated');
    expect(markup).toContain('still establishes a WebRTC call');
    expect(markup).toMatch(
      /aria-checked="false"[^>]*data-testid="switch-chat-mode"/,
    );
  });

  it('offers blank optional RTC targets and a bounded port input', () => {
    const markup = renderToStaticMarkup(<AiAgentView />);
    expect(markup).toMatch(/data-testid="input-rtc-ip"[^>]*value=""/);
    expect(markup).toMatch(
      /data-testid="input-rtc-port"[^>]*min="1"[^>]*max="65535"[^>]*value=""/,
    );
  });
});
