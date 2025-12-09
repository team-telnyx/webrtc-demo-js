import * as React from "react";
import { DropdownMenuCheckboxItemProps } from "@radix-ui/react-dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import uniqueBy from "lodash-es/uniqBy";

type Checked = DropdownMenuCheckboxItemProps["checked"];

interface Props {
  value: RTCRtpCodec[];
  onChange: (value: RTCRtpCodec[]) => void;
  isVideoCallsEnabled?: boolean;
}
function CodecSelectInput({
  value = [],
  onChange,
  isVideoCallsEnabled = false,
}: Props) {
  const onUncheckCodec = (codec: RTCRtpCodec) => {
    onChange(value.filter((c) => c.mimeType !== codec.mimeType));
  };

  const onCheckCodec = (codec: RTCRtpCodec) => {
    onChange([...value, codec]);
  };

  const onCheck = (check: Checked, index: number) => {
    if (!check) {
      return onUncheckCodec(codecList[index]);
    }
    return onCheckCodec(codecList[index]);
  };

  const audioCodecsList = React.useMemo(() => {
    const audioCodecs = RTCRtpSender?.getCapabilities?.("audio")?.codecs || [];
    return uniqueBy(audioCodecs, (codec) => codec.mimeType);
  }, []);

  const videoCodecsList = React.useMemo(() => {
    if (!isVideoCallsEnabled) return [];

    const videoCodecs = RTCRtpSender?.getCapabilities?.("video")?.codecs || [];
    return uniqueBy(videoCodecs, (codec) => codec.mimeType);
  }, [isVideoCallsEnabled]);

  const codecList = React.useMemo(() => {
    return [...audioCodecsList, ...videoCodecsList];
  }, [audioCodecsList, videoCodecsList]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="w-full" asChild>
        <Button variant="outline">
          {value.length > 0
            ? `${value.length} Selected Codecs`
            : "Select Codecs"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[300px]">
        <DropdownMenuLabel>Audio Codecs</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {audioCodecsList.map((codec, index) => (
          <DropdownMenuCheckboxItem
            key={codec.mimeType}
            checked={!!value.find((c) => c.mimeType === codec.mimeType)}
            onCheckedChange={(checked) => onCheck(checked, index)}
          >
            {codec.mimeType}
          </DropdownMenuCheckboxItem>
        ))}
        {isVideoCallsEnabled && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Video Codecs</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {videoCodecsList.map((codec, index) => (
              <DropdownMenuCheckboxItem
                key={codec.mimeType}
                checked={!!value.find((c) => c.mimeType === codec.mimeType)}
                onCheckedChange={(checked) => onCheck(checked, index)}
              >
                {codec.mimeType}
              </DropdownMenuCheckboxItem>
            ))}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default CodecSelectInput;
