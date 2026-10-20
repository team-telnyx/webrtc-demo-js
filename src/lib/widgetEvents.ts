export function getWidgetConversationCallState(detail: unknown): string | null {
  if (!detail || typeof detail !== 'object') {
    return null;
  }

  const { callState } = detail as { callState?: unknown };
  return typeof callState === 'string' ? callState : null;
}

export function isWidgetConversationActive(detail: unknown): boolean {
  return getWidgetConversationCallState(detail) === 'active';
}
