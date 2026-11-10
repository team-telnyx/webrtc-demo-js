// Side-effect module: imported first in main.tsx. The SDK keeps the global
// WebSocket it sees when its module is evaluated (Connection.ts), so the
// observing wrapper must be in place before @telnyx/webrtc is imported.
import { installSignalingPingProbe } from './signalingPing';

installSignalingPingProbe();
