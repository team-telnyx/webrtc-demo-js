import { useEffect, useRef } from 'react';

type Props = React.HTMLAttributes<HTMLAudioElement> & {
  /**
   * Remote media element id the SDK attaches the remote stream to.
   *
   * When set, AudioPlayer renders `<audio id={remoteElement}>` and does NOT
   * assign `srcObject` itself — `@telnyx/webrtc` attaches the remote stream to
   * this element via the `remoteElement` passed to `client.newCall()` /
   * `call.answer()` (VSUP-121 / PR #725). This lets the SDK own remote media
   * ownership so last-writer-wins behavior across concurrent calls is
   * observable on the shared element.
   *
   * Prefer this for the TelnyxRTC SDK demo path.
   */
  remoteElement?: string;
  /**
   * Legacy app-managed media stream. Used by the SIP.js simple-user path, which
   * has no SDK `remoteElement`. When `remoteElement` is absent, AudioPlayer
   * attaches this stream to `srcObject` directly. Ignored when `remoteElement`
   * is set (the SDK owns `srcObject` in that case).
   */
  mediaStream?: MediaStream;
};

const AudioPlayer = ({ remoteElement, mediaStream, ...props }: Props) => {
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    // Only attach srcObject for the legacy app-managed mediaStream path. When
    // remoteElement is set, the SDK owns srcObject via attachMediaStream, so
    // the app must not overwrite it.
    if (remoteElement || !mediaStream || !audioRef.current) return;
    audioRef.current.srcObject = mediaStream;
  }, [remoteElement, mediaStream]);

  return <audio ref={audioRef} autoPlay {...props} id={remoteElement} />;
};

export default AudioPlayer;
