/**
 * ErrorBanner — WEBRTC-3248 test component
 *
 * Displays the last `telnyx.error` payload in a visible banner so it's
 * easy to verify the new TelnyxError shape during manual testing.
 *
 * Shows: error code, name, description, causes, solutions, canRetry flag.
 * Dismissable. Auto-dismisses after 30s.
 */
import { lastSdkErrorAtom } from '@/components/ErrorEventHandler';
import { useAtom } from 'jotai';
import { useEffect } from 'react';

const ErrorBanner = () => {
  const [error, setError] = useAtom(lastSdkErrorAtom);

  // Auto-dismiss after 30s
  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(() => setError(null), 30_000);
    return () => clearTimeout(timer);
  }, [error, setError]);

  if (!error) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '1rem',
        right: '1rem',
        maxWidth: '420px',
        background: '#1a1a2e',
        border: '1px solid #e53e3e',
        borderLeft: '4px solid #e53e3e',
        borderRadius: '6px',
        padding: '12px 16px',
        color: '#fff',
        fontSize: '13px',
        zIndex: 9999,
        boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
        <span style={{ fontWeight: 'bold', color: '#fc8181', fontSize: '14px' }}>
          ⛔ telnyx.error [{error.code}] {error.name}
        </span>
        <button
          onClick={() => setError(null)}
          style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: '16px', lineHeight: 1, marginLeft: '8px' }}
        >
          ×
        </button>
      </div>

      <div style={{ marginBottom: '6px', color: '#e2e8f0' }}>{error.description}</div>

      {error.explanation && (
        <div style={{ marginBottom: '6px', color: '#a0aec0', fontStyle: 'italic', fontSize: '12px' }}>
          {error.explanation}
        </div>
      )}

      {error.causes.length > 0 && (
        <div style={{ marginBottom: '4px' }}>
          <span style={{ color: '#fbd38d', fontWeight: 600 }}>Causes: </span>
          <span style={{ color: '#e2e8f0' }}>{error.causes.join(', ')}</span>
        </div>
      )}

      {error.solutions.length > 0 && (
        <div style={{ marginBottom: '4px' }}>
          <span style={{ color: '#68d391', fontWeight: 600 }}>Solutions: </span>
          <span style={{ color: '#e2e8f0' }}>{error.solutions.join(', ')}</span>
        </div>
      )}

      <div style={{ marginTop: '8px', display: 'flex', gap: '12px', fontSize: '11px', color: '#718096' }}>
        <span>canRetry: <strong style={{ color: error.canRetry ? '#68d391' : '#fc8181' }}>{String(error.canRetry)}</strong></span>
        {error.callId && <span>callId: {error.callId.slice(0, 8)}…</span>}
        <span style={{ marginLeft: 'auto' }}>{new Date(error.receivedAt).toLocaleTimeString()}</span>
      </div>
    </div>
  );
};

export default ErrorBanner;
