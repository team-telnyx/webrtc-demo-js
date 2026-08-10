import { useClientMode } from '@/atoms/clientMode';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

const ClientModeTabs = () => {
  const [mode, setMode] = useClientMode();

  return (
    <Tabs
      value={mode}
      onValueChange={(value) => setMode(value as typeof mode)}
      className="w-full"
      data-testid="client-mode-tabs"
    >
      <TabsList
        className="grid h-auto grid-cols-2 sm:grid-cols-4 w-full"
        data-testid="client-mode-tabs-list"
      >
        <TabsTrigger value="sdk" data-testid="client-mode-tab-sdk">
          Telnyx SDK
        </TabsTrigger>
        <TabsTrigger value="sipjs" data-testid="client-mode-tab-sipjs">
          SIP.js Simple User
        </TabsTrigger>
        <TabsTrigger value="aiagent" data-testid="client-mode-tab-aiagent">
          AI Agent
        </TabsTrigger>
        <TabsTrigger
          value="precall"
          data-testid="client-mode-tab-precall"
          className="gap-2"
        >
          Pre-call Diagnostics
          <Badge
            variant="secondary"
            className="px-1.5 py-0 text-[10px] uppercase"
          >
            Beta
          </Badge>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
};

export default ClientModeTabs;
