import { useClientMode } from "@/atoms/clientMode";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ClientModeTabs = () => {
  const [mode, setMode] = useClientMode();

  return (
    <Tabs
      value={mode}
      onValueChange={(value) => setMode(value as typeof mode)}
      className="w-full"
      data-testid="client-mode-tabs"
    >
      <TabsList className="grid grid-cols-3 w-full" data-testid="client-mode-tabs-list">
        <TabsTrigger value="sdk" data-testid="client-mode-tab-sdk">Telnyx SDK</TabsTrigger>
        <TabsTrigger value="sipjs" data-testid="client-mode-tab-sipjs">SIP.js Simple User</TabsTrigger>
        <TabsTrigger value="aiagent" data-testid="client-mode-tab-aiagent">AI Agent</TabsTrigger>
      </TabsList>
    </Tabs>
  );
};

export default ClientModeTabs;
