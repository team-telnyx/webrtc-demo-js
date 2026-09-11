export interface WidgetConnectionOptions {
  textOnly: boolean;
  rtcIp: string;
  rtcPort: string;
}

// Keep the iframe and direct custom-element paths on the same widget contract.
export function buildWidgetConnectionProps(
  options: WidgetConnectionOptions,
): Record<string, string> {
  const props: Record<string, string> = {};
  if (options.textOnly) props['text-only'] = 'true';
  if (options.rtcIp.trim()) props['rtc-ip'] = options.rtcIp.trim();
  if (options.rtcPort.trim()) props['rtc-port'] = options.rtcPort.trim();
  return props;
}

export function serializeWidgetConnectionAttributes(
  options: WidgetConnectionOptions,
): string {
  return Object.entries(buildWidgetConnectionProps(options))
    .map(([name, value]) => {
      const escaped = value
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      return `${name}="${escaped}"`;
    })
    .join(' ');
}
