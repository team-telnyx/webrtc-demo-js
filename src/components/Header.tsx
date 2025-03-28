import TelnyxLogo from "@/assets/TelnyxLogo";
import ConnectionStatus from "./ConnectionStatus";
import PreCallDiagnosisButton from "./PreCallDiagnosisButton";
import SDKVersionDropdown from "./SDKVersionDropdown";
import H4 from "./typography/H4";
import RegionSelect from "./RegionSelect";
const Header = () => {
  return (
    <header className="border-b bg-background z-10">
      <div className="p-4 h-20 mx-auto flex items-center gap-2">
        <TelnyxLogo />
        <H4>WebRTC Demo</H4>
        <SDKVersionDropdown />
        <RegionSelect />
        <PreCallDiagnosisButton />
        <div className="flex justify-end flex-1">
          <ConnectionStatus />
        </div>
      </div>
    </header>
  );
};

export default Header;
