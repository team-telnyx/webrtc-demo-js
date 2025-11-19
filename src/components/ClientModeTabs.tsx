import { useClientMode } from "@/atoms/clientMode";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ClientModeTabs = () => {
  const [mode, setMode] = useClientMode();

  return (
    <Tabs
      value={mode}
      onValueChange={(value) => setMode(value as typeof mode)}
      className="w-full"
    >
      <TabsList className="grid grid-cols-2 w-full">
        <TabsTrigger value="sdk">Telnyx SDK</TabsTrigger>
        <TabsTrigger value="sipjs">SIP.js Simple User</TabsTrigger>
      </TabsList>
    </Tabs>
  );
};

export default ClientModeTabs;
