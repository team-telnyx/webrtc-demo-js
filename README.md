# Telnyx JS Voice SDK Demo Application
[![NPM Version](https://img.shields.io/npm/v/@telnyx/webrtc.svg)](https://www.npmjs.com/package/@telnyx/webrtc)
[![License](https://img.shields.io/github/license/team-telnyx/webrtc-demo-js.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-blue.svg)](https://reactjs.org/)

An open source reference implementation of Telnyx's Voice SDK for web browsers. This project demonstrates how to use the Telnyx JS Voice SDK to make and receive calls in a web browser. 📞 🔥

<p align="center">
  <img src="https://developers.telnyx.com/assets/telnyx-webrtc-js-sdk-demo-app-d9a0c9a5e8e5c9e9c9e9c9e9c9e9c9e9.png" alt="Telnyx WebRTC Demo App" width="600">
</p>

## Project Structure

- **React/TypeScript Application**: A modern web application built with React and TypeScript
- **Telnyx WebRTC SDK Integration**: Demonstrates how to integrate and use the Telnyx WebRTC SDK
- **Complete Dialer Interface**: Includes a full-featured dialer with call history, audio visualization, and more

## Project Setup

1. Clone the repository
   ```bash
   git clone https://github.com/team-telnyx/webrtc-demo-js.git
   cd webrtc-demo-js
   ```

2. Install dependencies
   ```bash
   npm install
   # or
   yarn install
   ```

3. Start the development server
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. Open your browser and navigate to `http://localhost:5173`

5. Enjoy! 😎

## SIP Credentials

In order to start making and receiving calls using the Telnyx WebRTC SDK, you will need to get SIP Credentials:

1. Access [Telnyx Portal](https://portal.telnyx.com/)
2. Sign up for a Telnyx Account
3. Create a Credential Connection to configure how you connect your calls
4. Create an Outbound Voice Profile to configure your outbound call settings and assign it to your Credential Connection

For more information on how to generate SIP credentials, check the [Telnyx WebRTC quickstart guide](https://developers.telnyx.com/docs/v2/webrtc/quickstart).

## Usage

### Telnyx Client

To initialize the Telnyx client in your application:

```javascript
import { TelnyxRTC } from '@telnyx/webrtc';

// Create a new instance of the Telnyx client
const client = new TelnyxRTC({
  login_token: 'YOUR_JWT_TOKEN', // or use credentials
  // For credential login:
  // username: 'YOUR_SIP_USERNAME',
  // password: 'YOUR_SIP_PASSWORD',
  ringtone: 'path/to/ringtone.mp3',
  ringbacktone: 'path/to/ringbacktone.mp3'
});

// Connect to the Telnyx WebRTC service
client.connect();
```

### Making a Call

```javascript
// Create a new call
const call = client.newCall({
  destinationNumber: '+1XXXXXXXXXX', // Phone number or SIP URI
  callerName: 'Your Name',
  callerNumber: 'Your Number'
});

// Handle call events
call.on('stateChange', (state) => {
  console.log('Call state changed to:', state);
});
```

### Receiving a Call

```javascript
// Listen for incoming calls
client.on('telnyx.notification.call.received', (notification) => {
  const call = notification.call;
  
  // Answer the call
  call.answer();
  
  // Or reject the call
  // call.hangup();
});
```

## Features

- **Make and Receive Calls**: Place outbound calls and receive incoming calls
- **Call Controls**: Mute, hold, transfer, and end calls
- **DTMF Support**: Send DTMF tones during active calls
- **Call History**: View your recent calls
- **Audio Visualization**: Visual representation of audio input/output
- **Environment Selection**: Switch between development and production environments
- **Custom Headers**: Add custom SIP headers to your calls
- **Codec Selection**: Choose preferred audio codecs

## Documentation

For more detailed information, check out these resources:

- [Telnyx WebRTC Product Page](https://telnyx.com/products/webrtc)
- [JS SDK Anatomy](https://developers.telnyx.com/docs/voice/webrtc/js-sdk/anatomy)
- [JS SDK Changelog](https://developers.telnyx.com/docs/voice/webrtc/js-sdk/changelog)
- [Quick Start Guide](https://developers.telnyx.com/docs/voice/webrtc/js-sdk/demo-app)
- [API Reference](https://developers.telnyx.com/docs/api/v2/webrtc)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

[MIT License](LICENSE) © [Telnyx](https://github.com/team-telnyx)
