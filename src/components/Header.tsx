import TelnyxLogo from "@/assets/TelnyxLogo";
import H4 from "./typography/H4";
import ConnectionStatus from "./ConnectionStatus";
import SDKVersionDropdown from "./SDKVersionDropdown";
import EnvironmentSelect from "./EnvironmentSelect";
import PreCallDiagnosisButton from "./PreCallDiagnosisButton";
const Header = () => {
  return (
    <header className="border-b sticky top-0 bg-background z-10">
      <div className="container h-20 mx-auto flex items-center gap-2">
        <TelnyxLogo />
        <H4>WebRTC Demo</H4>
        <SDKVersionDropdown />
        <EnvironmentSelect />
        <PreCallDiagnosisButton />

        <div className="flex justify-end flex-1">
          <ConnectionStatus />
        </div>
      </div>
    </header>
  );
};

export default Header;
