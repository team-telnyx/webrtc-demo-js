import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { playDTMFTone } from "@/lib/dtmf";
import { Call } from "@telnyx/webrtc";
import { useCallback, useEffect, useMemo, useState } from "react";
import AudioPlayer from "./AudioPlayer";
import AudioVisualizer from "./AudioVisualizer";
import InCallQualityMetrics from "./InCallQualityMetrics";
import Keyboard from "./Keyboard";
import { Button } from "./ui/button";
import CheckRegistrationButton from "./CheckRegistrationButton";
import { Switch } from "./ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { useDevices } from "@/hooks/useDevices";
import VideoPlayer from "./VideoPlayer";

type Props = {
  call: Call;
  title?: string;
};

const ActiveCall = ({ call, title = "Active Call" }: Props) => {
  const devices = useDevices();
  const [isMuted, setIsMuted] = useState<boolean>(call.isAudioMuted);
  const [selectedAudioInputId, setSelectedAudioInputId] = useState<string>("");
  const [newAudioInDeviceMuted, setNewAudioInDeviceMuted] = useState(
    call.isAudioMuted
  );

  const audioInDevices = useMemo(() => {
    return devices.filter((device) => device.kind === "audioinput");
  }, [devices]);

  const onDTMFClick = useCallback(
    ({ digit }: { digit: string }) => {
      call.dtmf(digit);
      playDTMFTone(digit);
    },
    [call]
  );

  const switchAudioInput = async () => {
    try {
      await call.setAudioInDevice(selectedAudioInputId, newAudioInDeviceMuted);
      setIsMuted(call.isAudioMuted);
    } catch (error) {
      console.error("Failed to switch audio input", error);
    }
  };

  useEffect(() => {
    if (!audioInDevices.length || selectedAudioInputId || !call.localStream) {
      return;
    }

    const currentAudioTracksIds = call.localStream
      .getAudioTracks()
      .map((track) => track.getSettings().deviceId);

    const defaultDevice = audioInDevices.find((device) =>
      currentAudioTracksIds.includes(device.deviceId)
    );

    const initialDeviceId =
      defaultDevice?.deviceId || audioInDevices[0].deviceId;

    setSelectedAudioInputId(initialDeviceId);
  }, [call, audioInDevices, selectedAudioInputId]);

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) {
          call.hangup();
        }
      }}
    >
      <DialogContent className="overflow-hidden">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Talking To {call.options.remoteCallerNumber} (
            {call.options.remoteCallerName})
          </DialogDescription>
          {call.options.keepConnectionAliveOnSocketClose && (
            <CheckRegistrationButton showIndicator />
          )}
        </DialogHeader>

        <div className="flex-1 max-h-[60vh] overflow-y-auto space-y-4">
          {audioInDevices.length > 0 && (
            <div className="space-y-3 rounded-lg border p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-sm font-semibold">Audio Input</p>
                  <p className="text-xs text-muted-foreground">
                    Pick a microphone to switch immediately with audio
                    {newAudioInDeviceMuted ? " off" : " on"}.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Mute</span>
                  <Switch
                    checked={newAudioInDeviceMuted}
                    onCheckedChange={setNewAudioInDeviceMuted}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-3">
                <Select
                  value={selectedAudioInputId || undefined}
                  onValueChange={setSelectedAudioInputId}
                >
                  <SelectTrigger data-testid="select-audio-input">
                    <SelectValue placeholder={"Select audio input"} />
                  </SelectTrigger>
                  <SelectContent>
                    {audioInDevices.map((device, index) => (
                      <SelectItem key={device.deviceId} value={device.deviceId}>
                        {device.label || `Microphone ${index + 1}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  size="sm"
                  variant={"default"}
                  onClick={switchAudioInput}
                >
                  Apply
                </Button>
              </div>
            </div>
          )}
          {call.isVideoCall && (
            <div className="space-y-2">
              <p className="text-sm font-semibold">Video</p>
              <div className="relative overflow-hidden rounded-lg border bg-black">
                {/* Mute both video players because we use AudioPlayer for getting audio from the remote stream */}
                <VideoPlayer
                  mediaStream={call.remoteStream}
                  muted
                  className="w-full aspect-video object-cover"
                />
                <VideoPlayer
                  mediaStream={call.localStream}
                  muted
                  className="absolute bottom-3 right-3 w-40 aspect-video rounded-md border border-white/20 bg-black/70 object-cover shadow-lg"
                />
              </div>
            </div>
          )}
          <div>
            <div className="flex flex-col space-y-4 items-center">
              <h1>Inbound </h1>
              <AudioVisualizer mediaStream={call.remoteStream} />

              <h1>Outbound</h1>
              <AudioVisualizer mediaStream={call.localStream} color="#fff" />
            </div>
            <AudioPlayer mediaStream={call.remoteStream} />
            <Tabs defaultValue="keyboard">
              <div className="flex justify-center">
                <TabsList>
                  <TabsTrigger value="keyboard">Keyboard</TabsTrigger>
                  <TabsTrigger value="metrics">Metrics</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="keyboard">
                <Keyboard onDialButtonClick={onDTMFClick} />
              </TabsContent>

              <TabsContent value="metrics">
                <InCallQualityMetrics />
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <DialogFooter>
          <Button
            data-testid="btn-end-call"
            size="lg"
            variant={"destructive"}
            className="w-full"
            onClick={() => call.hangup()}
          >
            Hangup
          </Button>

          <Button
            data-testid="btn-end-call"
            size="lg"
            variant={"outline"}
            className="w-full"
            onClick={() => call.hold()}
          >
            Hold
          </Button>

          <Button
            data-testid="btn-toggle-mute"
            size="lg"
            variant={"outline"}
            className="w-full"
            onClick={() => {
              call.toggleAudioMute();
              setIsMuted(call.isAudioMuted);
            }}
          >
            {isMuted ? "Unmute" : "Mute"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ActiveCall;
