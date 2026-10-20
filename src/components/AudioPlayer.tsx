import { useEffect, useRef } from 'react';

type Props = React.AudioHTMLAttributes<HTMLAudioElement> & {
  mediaStream: MediaStream;
  /** Output device id. Routed with setSinkId where the browser supports it. */
  sinkId?: string;
};
const AudioPlayer = ({ mediaStream, sinkId, ...props }: Props) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  useEffect(() => {
    if (!mediaStream || !audioRef.current) return;
    audioRef.current.srcObject = mediaStream;
  }, [mediaStream]);

  useEffect(() => {
    const element = audioRef.current;
    if (!element || !sinkId) return;
    if (typeof element.setSinkId !== 'function') {
      console.warn(
        'setSinkId is not supported in this browser; speaker selection ignored',
      );
      return;
    }
    element.setSinkId(sinkId).catch((error: unknown) => {
      console.error(`Failed to route audio to speaker ${sinkId}`, error);
    });
  }, [sinkId]);

  return <audio ref={audioRef} autoPlay {...props} />;
};

export default AudioPlayer;
