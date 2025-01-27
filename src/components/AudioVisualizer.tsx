import { useEffect, useState } from "react";
import { LiveAudioVisualizer } from "react-audio-visualize";

type Props = {
  mediaStream: MediaStream;
  color?: string;
};

const AudioVisualizer = ({ mediaStream, color = "#00E3AA" }: Props) => {
  const [recorder, setRecorder] = useState<MediaRecorder | null>(null);

  useEffect(() => {
    if (!mediaStream) return;
    const mediaRecorder = new MediaRecorder(mediaStream);
    mediaRecorder.start();
    setRecorder(mediaRecorder);
    return () => {
      mediaRecorder.stop();
    };
  }, [mediaStream]);

  if (!recorder) {
    return null;
  }
  return (
    <div>
      <LiveAudioVisualizer
        barWidth={3}
        barColor={color}
        mediaRecorder={recorder}
        width={300}
        height={56}
      />
    </div>
  );
};

export default AudioVisualizer;
