import { describe, expect, it } from 'vitest';
import {
  getWidgetConversationCallState,
  isWidgetConversationActive,
} from './widgetEvents';

describe('widget conversation.update parsing', () => {
  it('reads the call state shape emitted by @telnyx/ai-agent-widget', () => {
    expect(
      getWidgetConversationCallState({
        type: 'conversation.update',
        callState: 'active',
      }),
    ).toBe('active');
    expect(
      isWidgetConversationActive({
        type: 'conversation.update',
        callState: 'active',
      }),
    ).toBe(true);
  });

  it('does not treat the old demo-only nested call shape as widget evidence', () => {
    expect(getWidgetConversationCallState({ call: { state: 'active' } })).toBe(
      null,
    );
    expect(isWidgetConversationActive({ call: { state: 'active' } })).toBe(
      false,
    );
  });
});
