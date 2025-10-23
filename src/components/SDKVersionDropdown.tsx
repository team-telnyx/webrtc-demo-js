import { useEffect, useState } from "react";
import { useTelnyxSDKVersion } from "@/atoms/telnyxClient";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const fallbackVersions = [
  "latest",
];

const SDKVersionDropdown = () => {
  const [{ version }, setVersion] = useTelnyxSDKVersion();
  const [versions, setVersions] = useState<string[]>(fallbackVersions);

  useEffect(() => {
    let cancelled = false;

    const fetchVersions = async () => {
      try {
        const response = await fetch(
          "https://registry.npmjs.org/@telnyx/webrtc"
        );
        if (!response.ok) {
          throw new Error(`Failed to fetch versions: ${response.status}`);
        }

        type NpmRegistryResponse = {
          time?: Record<string, string>;
          "dist-tags"?: Record<string, string>;
        };

        const data = (await response.json()) as NpmRegistryResponse;
        const timeEntries = Object.entries(data.time ?? {})
          .filter(([release]) => release !== "created" && release !== "modified")
          .sort(([, first], [, second]) => {
            const firstTime = new Date(first).getTime();
            const secondTime = new Date(second).getTime();
            return secondTime - firstTime;
          })
          .map(([release]) => release);

        const tagVersions = Object.values(data["dist-tags"] ?? {});

        const nextVersions = Array.from(
          new Set(["latest", ...tagVersions, ...timeEntries])
        );

        if (!cancelled) {
          setVersions((current) => {
            const extended = new Set([...nextVersions, ...current]);
            return Array.from(extended).slice(0, 50);
          });
        }
      } catch (error) {
        console.error("Failed to fetch Telnyx WebRTC versions from npm", error);
      }
    };

    fetchVersions();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setVersions((current) =>
      current.includes(version) ? current : [...current, version]
    );
  }, [version]);

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
        {versions.map((sdkVersion) => (
          <SelectItem key={sdkVersion} value={sdkVersion}>
            {sdkVersion === "latest" ? "Latest" : sdkVersion}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default SDKVersionDropdown;
