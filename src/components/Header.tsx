import TelnyxLogo from "@/assets/TelnyxLogo";
import ConnectionStatus from "./ConnectionStatus";
import SipJsConnectionStatus from "./SipJsConnectionStatus";
import PreCallDiagnosisButton from "./PreCallDiagnosisButton";
import CheckRegistrationButton from "./CheckRegistrationButton";
import SDKVersionDropdown from "./SDKVersionDropdown";
import H4 from "./typography/H4";
import RegionSelect from "./RegionSelect";
import { useClientMode } from "@/atoms/clientMode";

const Header = () => {
  const [mode] = useClientMode();

  return (
    <header className="border-b bg-background z-10">
      <div className="p-4 h-20 mx-auto flex flex-wrap items-center gap-2">
        <TelnyxLogo />
        <H4>WebRTC Demo</H4>
        <SDKVersionDropdown />
        <RegionSelect />
        <PreCallDiagnosisButton />
        <CheckRegistrationButton />
        <div className="flex justify-end flex-1 py-1">
          {mode === "sipjs" ? <SipJsConnectionStatus /> : <ConnectionStatus />}
        </div>
      </div>
    </header>
  );
};

export default Header;
