// CRITICAL: Set alias BEFORE any imports so it's available when library code runs
// The Telnyx SIP.js wrapper checks globalThis.__TELNYX_INBOUND_ALIASES__ at runtime
if (typeof globalThis !== 'undefined') {
  const phoneNumber = '14843068733'; // The phone number that receives calls
  (globalThis as any).__TELNYX_INBOUND_ALIASES__ = [phoneNumber];
  if (typeof window !== 'undefined') {
    (window as any).__TELNYX_INBOUND_ALIASES__ = [phoneNumber];
  }
  console.log('[main.tsx] ✓✓✓ ALIAS SET AT TOP LEVEL:', [phoneNumber]);
}

import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(<App />);
