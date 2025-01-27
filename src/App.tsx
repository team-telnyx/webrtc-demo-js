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

const App = () => {
  return (
    <ThemeProvider defaultTheme="dark">
      <TooltipProvider>
        <PageLayout>
          <div className="md:grid md:grid-cols-3 gap-4 p-4 flex flex-col">
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
        </PageLayout>

        <ClientAutoConnect />
        <CallNotificationHandler />
      </TooltipProvider>
      <Toaster />
    </ThemeProvider>
  );
};

export default App;
