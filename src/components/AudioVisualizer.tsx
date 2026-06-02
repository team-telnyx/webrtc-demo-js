import { useEffect, useMemo } from 'react';
import { LiveAudioVisualizer } from 'react-audio-visualize';

type Props = {
  mediaStream: MediaStream;
  color?: string;
};

const AudioVisualizer = ({ mediaStream, color = '#00E3AA' }: Props) => {
  const recorder = useMemo(() => {
    if (!mediaStream) return null;

    const hasLiveAudioTrack = mediaStream
      .getAudioTracks()
      .some((track) => track.readyState === 'live');

    if (!hasLiveAudioTrack) return null;

    try {
      return new MediaRecorder(mediaStream);
    } catch (error) {
      console.warn(
        'Audio visualizer disabled: failed to create MediaRecorder',
        {
          error,
          streamId: mediaStream.id,
          audioTracks: mediaStream.getAudioTracks().map((track) => ({
            id: track.id,
            kind: track.kind,
            label: track.label,
            muted: track.muted,
            readyState: track.readyState,
          })),
        },
      );
      return null;
    }
  }, [mediaStream]);

  useEffect(() => {
    if (!recorder) return;

    try {
      recorder.start();
    } catch (error) {
      console.warn('Audio visualizer disabled: failed to start MediaRecorder', {
        error,
        streamId: mediaStream.id,
        audioTracks: mediaStream.getAudioTracks().map((track) => ({
          id: track.id,
          kind: track.kind,
          label: track.label,
          muted: track.muted,
          readyState: track.readyState,
        })),
      });
      return;
    }

    return () => {
      if (recorder.state !== 'inactive') {
        recorder.stop();
      }
    };
  }, [mediaStream, recorder]);

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
