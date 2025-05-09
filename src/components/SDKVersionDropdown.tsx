import { useTelnyxSDKVersion } from "@/atoms/telnyxClient";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const SDKVersionDropdown = () => {
  const [{ version }, setVersion] = useTelnyxSDKVersion();

  const onVersionChange = async (nextVersion: string) => {
    try {
      const { TelnyxRTC } = await import(
        /* @vite-ignore Dependency is loaded at runtime */
        `https://esm.sh/@telnyx/webrtc@${nextVersion}`
      );
      setVersion({ version: nextVersion, Class: TelnyxRTC });
    } catch (error) {
      alert("Invalid version");
      console.error(error);
    }
  };
  return (
    <Select value={version} onValueChange={onVersionChange}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="SDK version" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="latest">Latest</SelectItem>
        <SelectItem value="2.21.2">2.21.2</SelectItem>
        <SelectItem value="2.21.1">2.21.1</SelectItem>
        <SelectItem value="2.20.0">2.20.0</SelectItem>
        <SelectItem value="2.19.0">2.19.0</SelectItem>
        <SelectItem value="2.18.0">2.18.0</SelectItem>
      </SelectContent>
    </Select>
  );
};

export default SDKVersionDropdown;
