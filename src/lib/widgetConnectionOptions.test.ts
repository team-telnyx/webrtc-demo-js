import { describe, expect, it } from 'vitest';
import {
  buildWidgetConnectionProps,
  serializeWidgetConnectionAttributes,
} from './widgetConnectionOptions';

const defaults = { textOnly: false, rtcIp: '', rtcPort: '' };

describe('widget connection options', () => {
  it('leaves the widget defaults untouched when options are unset', () => {
    expect(buildWidgetConnectionProps(defaults)).toEqual({});
    expect(serializeWidgetConnectionAttributes(defaults)).toBe('');
  });

  it('uses text-only, not the legacy chat-mode attribute', () => {
    expect(buildWidgetConnectionProps({ ...defaults, textOnly: true })).toEqual(
      {
        'text-only': 'true',
      },
    );
  });

  it('maps optional RTC targets to the widget kebab-case attributes', () => {
    const options = { ...defaults, rtcIp: ' 192.0.2.10 ', rtcPort: ' 7443 ' };
    expect(buildWidgetConnectionProps(options)).toEqual({
      'rtc-ip': '192.0.2.10',
      'rtc-port': '7443',
    });
    expect(serializeWidgetConnectionAttributes(options)).toBe(
      'rtc-ip="192.0.2.10" rtc-port="7443"',
    );
  });

  it('omits whitespace-only overrides rather than replacing widget defaults', () => {
    expect(
      buildWidgetConnectionProps({ ...defaults, rtcIp: '  ', rtcPort: '\t' }),
    ).toEqual({});
  });

  it.each([
    [{ ...defaults, rtcIp: '2001:db8::1' }, { 'rtc-ip': '2001:db8::1' }],
    [{ ...defaults, rtcPort: '443' }, { 'rtc-port': '443' }],
  ])('allows each RTC option independently: %j', (options, attributes) => {
    expect(buildWidgetConnectionProps(options)).toEqual(attributes);
  });

  it('serializes all enabled options for the iframe from the same props', () => {
    expect(
      serializeWidgetConnectionAttributes({
        textOnly: true,
        rtcIp: '192.0.2.10',
        rtcPort: '7443',
      }),
    ).toBe('text-only="true" rtc-ip="192.0.2.10" rtc-port="7443"');
  });

  it('escapes attribute values in srcDoc without changing direct element values', () => {
    const options = { ...defaults, rtcIp: 'a"<&>\'b' };
    expect(buildWidgetConnectionProps(options)['rtc-ip']).toBe('a"<&>\'b');
    expect(serializeWidgetConnectionAttributes(options)).toBe(
      'rtc-ip="a&quot;&lt;&amp;&gt;&#39;b"',
    );
  });
});
