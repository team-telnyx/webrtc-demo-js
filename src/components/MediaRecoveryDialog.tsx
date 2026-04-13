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
import { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

const MediaRecoveryDialogContent = () => {
  const [mediaRecovery, setMediaRecovery] = useMediaRecovery();
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

  const timeLeftMs = Math.max(0, mediaRecovery.retryDeadline - now);

  const onRetry = () => {
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
          <p className="text-amber-100">
            Time left: {Math.ceil(timeLeftMs / 1000)}s
          </p>
        </AlertDescription>
      </Alert>

      {mediaRecovery.error.solutions.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Suggested Fixes</p>
          <ul className="list-disc pl-5 text-sm text-slate-300">
            {mediaRecovery.error.solutions.map((solution: string) => (
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
        <MediaRecoveryDialogContent key={mediaRecovery.callId} />
      </DialogContent>
    </Dialog>
  );
};

export default MediaRecoveryDialog;
