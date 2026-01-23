/**
 * Shared logging helper for SIP.js components.
 * Provides consistent format for acceptance-criteria logging.
 */

export function logSipJs(
  category: 'Registration' | 'Call' | 'Inbound',
  message: string,
  details?: Record<string, unknown>,
) {
  const timestamp = new Date().toISOString();
  const prefix = `[SipJs ${category}]`;
  const logMessage = `${prefix} ${message}`;
  
  if (details) {
    console.log(`[${timestamp}] ${logMessage}`, details);
  } else {
    console.log(`[${timestamp}] ${logMessage}`);
  }
}
