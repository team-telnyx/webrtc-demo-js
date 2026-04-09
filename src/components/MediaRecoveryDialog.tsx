import { useMediaRecovery } from '@/atoms/mediaRecovery';
import { useTelnyxNotification } from '@/atoms/telnyxNotification';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useDevices } from '@/hooks/useDevices';
import { Call } from '@telnyx/webrtc';
import { useEffect, useMemo, useState } from 'react';
import { Button } from './ui/button';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

const setCallMicId = (call: Call, micId: string) => {
  call.options.micId = micId;
};

type MediaRecoveryDialogContentProps = {
  audioInDevices: MediaDeviceInfo[];
  call: Call | null;
};

const MediaRecoveryDialogContent = ({
  audioInDevices,
  call,
}: MediaRecoveryDialogContentProps) => {
  const [mediaRecovery, setMediaRecovery] = useMediaRecovery();
  const [selectedAudioInputId, setSelectedAudioInputId] = useState('');
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timerId = window.setInterval(() => {
      setNow(Date.now());
    }, 250);

    return () => {
      window.clearInterval(timerId);
    };
  }, []);

  if (!mediaRecovery) {
    return null;
  }

  const defaultAudioInputId =
    call?.options.micId ||
    call?.localStream?.getAudioTracks()[0]?.getSettings().deviceId ||
    audioInDevices[0]?.deviceId ||
    '';
  const resolvedAudioInputId = selectedAudioInputId || defaultAudioInputId;
  const timeLeftMs = Math.max(0, mediaRecovery.retryDeadline - now);

  const onRetry = () => {
    if (call && resolvedAudioInputId) {
      setCallMicId(call, resolvedAudioInputId);
    }

    setMediaRecovery((current) =>
      current ? { ...current, status: 'retrying' } : current,
    );
    mediaRecovery.resume();
  };

  const onReject = () => {
    setMediaRecovery(null);
    mediaRecovery.reject();
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Recover Microphone Access</DialogTitle>
        <DialogDescription>
          The SDK paused this inbound answer flow so you can fix the media
          problem and retry before the call fails.
        </DialogDescription>
      </DialogHeader>

      <Alert className="border-amber-400/35 bg-amber-300/10 text-slate-50">
        <AlertTitle className="text-amber-200">
          {mediaRecovery.error.message} ({mediaRecovery.error.code})
        </AlertTitle>
        <AlertDescription className="space-y-3 text-slate-100/90">
          <p>{mediaRecovery.error.description}</p>
          {call && (
            <p className="text-slate-200">
              Caller: {call.options.callerName || 'Unknown'} (
              {call.options.callerNumber || 'Unknown'})
            </p>
          )}
          <p className="text-amber-100">
            Time left: {Math.ceil(timeLeftMs / 1000)}s
          </p>
        </AlertDescription>
      </Alert>

      {audioInDevices.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Microphone</p>
          <Select
            disabled={mediaRecovery.status === 'retrying'}
            value={resolvedAudioInputId || undefined}
            onValueChange={setSelectedAudioInputId}
          >
            <SelectTrigger data-testid="select-media-recovery-audio-input">
              <SelectValue placeholder="Select a microphone" />
            </SelectTrigger>
            <SelectContent>
              {audioInDevices.map((device, index) => (
                <SelectItem key={device.deviceId} value={device.deviceId}>
                  {device.label || `Microphone ${index + 1}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {mediaRecovery.error.solutions.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Suggested Fixes</p>
          <ul className="list-disc pl-5 text-sm text-slate-300">
            {mediaRecovery.error.solutions.map((solution) => (
              <li key={solution}>{solution}</li>
            ))}
          </ul>
        </div>
      )}

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          disabled={mediaRecovery.status === 'retrying'}
          onClick={onReject}
        >
          Reject Call
        </Button>
        <Button
          type="button"
          data-testid="btn-media-recovery-retry"
          disabled={timeLeftMs <= 0 || mediaRecovery.status === 'retrying'}
          onClick={onRetry}
        >
          {mediaRecovery.status === 'retrying' ? 'Retrying...' : 'Retry'}
        </Button>
      </DialogFooter>
    </>
  );
};

const MediaRecoveryDialog = () => {
  const [mediaRecovery] = useMediaRecovery();
  const [notification] = useTelnyxNotification();
  const devices = useDevices();

  const audioInDevices = useMemo(
    () => devices.filter((device) => device.kind === 'audioinput'),
    [devices],
  );

  const call =
    mediaRecovery && notification?.call?.id === mediaRecovery.callId
      ? notification.call
      : null;

  if (!mediaRecovery) {
    return null;
  }

  return (
    <Dialog open onOpenChange={() => undefined}>
      <DialogContent
        className="[&>button]:hidden sm:max-w-xl"
        onEscapeKeyDown={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
      >
        <MediaRecoveryDialogContent
          key={mediaRecovery.callId}
          audioInDevices={audioInDevices}
          call={call}
        />
      </DialogContent>
    </Dialog>
  );
};

export default MediaRecoveryDialog;
