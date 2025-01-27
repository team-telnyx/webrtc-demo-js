# Telnyx JS Voice SDK Demo Application
[![NPM Version](https://img.shields.io/npm/v/@telnyx/webrtc.svg)](https://www.npmjs.com/package/@telnyx/webrtc)
[![License](https://img.shields.io/github/license/team-telnyx/webrtc-demo-js.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-blue.svg)](https://reactjs.org/)

An open source reference implementation of Telnyx's Voice SDK for web browsers. This project demonstrates how to use the Telnyx JS Voice SDK to make and receive calls in a web browser. 📞 🔥


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
   yarn install
   ```

3. Start the development server
   ```bash
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

## Features

- **Make and Receive Calls**: Place outbound calls and receive incoming calls
- **Call Controls**: Mute, hold, and end calls
- **DTMF Support**: Send DTMF tones during active calls
- **Call History**: View your recent calls
- **Audio Visualization**: Visual representation of audio input/output
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
