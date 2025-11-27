import BlackBoxTestLog from "./components/BlackBoxTestLog";
import CallHistory from "./components/CallHistory";
import CallNotificationHandler from "./components/CallNotificationHandler";
import CallOptions from "./components/CallOptions";
import ClientAutoConnect from "./components/ClientAutoConnect";
import ClientOptions from "./components/ClientOptions";
import Dialer from "./components/Dialer";
import PageLayout from "./components/PageLayout";
import { Toaster } from "./components/ui/toaster";
import { TooltipProvider } from "./components/ui/tooltip";
import WebSocketMessageLog from "./components/WebSocketMessageLog";
import { ThemeProvider } from "./providers/ThemeProvider";
import ClientModeTabs from "./components/ClientModeTabs";
import { useClientMode } from "./atoms/clientMode";
import SimpleUserClientOptions from "./components/SimpleUserClientOptions";
import SimpleUserDialer from "./components/SimpleUserDialer";
import SimpleUserCallOptions from "./components/SimpleUserCallOptions";
import SipJsCallNotificationHandler from "./components/SipJsCallNotificationHandler";
import { SipJsCall } from "./components/SipJsCall";
import AiAgentView from "./components/AiAgentView";

const SdkDemoView = () => (
  <div className="md:grid md:grid-cols-3 gap-4 flex flex-col">
    <ClientOptions />
    <Dialer />
    <CallOptions />

    <div className="col-span-2">
      <WebSocketMessageLog />
    </div>
    <CallHistory />

    <div className="col-span-2">
      <BlackBoxTestLog />
    </div>
  </div>
);

const SipJsDemoView = () => (
  <div className="grid md:grid-cols-2 gap-4">
    <SimpleUserClientOptions />
    <SimpleUserDialer />
    <SimpleUserCallOptions />
  </div>
);

const App = () => {
  const [mode] = useClientMode();

  return (
    <ThemeProvider defaultTheme="dark">
      <TooltipProvider>
        <PageLayout>
          <div className="p-4 space-y-4">
            <ClientModeTabs />
            {mode === "sipjs" ? (
              <SipJsDemoView />
            ) : mode === "aiagent" ? (
              <AiAgentView />
            ) : (
              <SdkDemoView />
            )}
          </div>
        </PageLayout>

        {mode === "sdk" ? (
          <>
            <ClientAutoConnect />
            <CallNotificationHandler />
          </>
        ) : (
          <SipJsCallNotificationHandler />
        )}

        {mode === "sdk" ? null : <SipJsCall />}
      </TooltipProvider>
      <Toaster />
    </ThemeProvider>
  );
};

export default App;
