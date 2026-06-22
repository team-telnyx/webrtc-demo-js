import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AiAgentView from './AiAgentView';
import AiAgentClientToolsView from './AiAgentClientToolsView';

type AiAgentSubMode = 'widget' | 'client-tools';

/**
 * Wraps the AI Agent tab in two sub-views:
 *  - "Widget Embed": the published <telnyx-ai-agent> web component, embedded
 *    in an iframe (existing demo).
 *  - "Client-Side Tools": drives @telnyx/ai-agent-lib directly to demonstrate
 *    the client-side tool registration/execution API (VSDK-253).
 */
const AiAgentTabView = () => {
  const [subMode, setSubMode] = useState<AiAgentSubMode>('widget');

  return (
    <div className="space-y-4">
      <Tabs
        value={subMode}
        onValueChange={(value) => setSubMode(value as AiAgentSubMode)}
        className="w-full"
        data-testid="ai-agent-sub-tabs"
      >
        <TabsList
          className="grid grid-cols-2 w-full max-w-md"
          data-testid="ai-agent-sub-tabs-list"
        >
          <TabsTrigger value="widget" data-testid="ai-agent-sub-tab-widget">
            Widget Embed
          </TabsTrigger>
          <TabsTrigger
            value="client-tools"
            data-testid="ai-agent-sub-tab-client-tools"
          >
            Client-Side Tools
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {subMode === 'widget' ? <AiAgentView /> : <AiAgentClientToolsView />}
    </div>
  );
};

export default AiAgentTabView;
