import { useEffect, useState } from "react";
import { useTelnyxSDKVersion } from "@/atoms/telnyxClient";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const fallbackVersions = ["latest"];

const SDKVersionDropdown = () => {
  const [{ version }, setVersion] = useTelnyxSDKVersion();
  const [versions, setVersions] = useState<string[]>(fallbackVersions);
  const [deprecatedVersions, setDeprecatedVersions] = useState<Set<string>>(
    () => new Set()
  );

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
          versions?: Record<string, { deprecated?: string }>;
        };

        const data = (await response.json()) as NpmRegistryResponse;

        const deprecatedSet = new Set(
          Object.entries(data.versions ?? {})
            .filter(([, descriptor]) => {
              const message = descriptor.deprecated?.trim();
              return Boolean(message && message.length);
            })
            .map(([release]) => release)
        );
        const filterDeprecatedVersions = (items: string[]) =>
          items.filter((value) => !deprecatedSet.has(value));

        const timeEntries = Object.entries(data.time ?? {})
          .filter(
            ([release]) => release !== "created" && release !== "modified"
          )
          .sort(([, first], [, second]) => {
            const firstTime = new Date(first).getTime();
            const secondTime = new Date(second).getTime();
            return secondTime - firstTime;
          })
          .map(([release]) => release);

        const tagVersions = Object.values(data["dist-tags"] ?? {});

        const nextVersions = Array.from(
          new Set([
            "latest",
            ...filterDeprecatedVersions(tagVersions),
            ...filterDeprecatedVersions(timeEntries),
          ])
        ).slice(0, 50);

        if (!cancelled) {
          setDeprecatedVersions(deprecatedSet);
          setVersions(nextVersions);
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
    setVersions((current) => {
      if (current.includes(version) || deprecatedVersions.has(version)) {
        return current;
      }
      const next = [...current, version];
      return next.slice(0, 50);
    });
  }, [version, deprecatedVersions]);

  const onVersionChange = async (nextVersion: string) => {
    try {
      const { TelnyxRTC } = await import(
        /* @vite-ignore Dependency is loaded at runtime */
        `https://esm.sh/@telnyx/webrtc@${nextVersion}`
      );

      if (!TelnyxRTC || typeof TelnyxRTC !== "function") {
        throw new Error("Invalid Telnyx SDK module");
      }

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
