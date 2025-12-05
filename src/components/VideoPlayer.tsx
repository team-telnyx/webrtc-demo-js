import { useEffect, useRef } from "react";

type Props = React.VideoHTMLAttributes<HTMLVideoElement> & {
  mediaStream: MediaStream;
};

const VideoPlayer = ({ mediaStream, ...props }: Props) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!mediaStream || !videoRef.current) return;
    console.log("Attaching media stream to video element", mediaStream);
    videoRef.current.srcObject = mediaStream;
  }, [mediaStream]);

  return <video ref={videoRef} autoPlay playsInline {...props} />;
};

export default VideoPlayer;
