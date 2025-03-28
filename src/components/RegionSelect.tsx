import { useRegion } from "@/atoms/region";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const RegionSelect = () => {
  const [region, setRegion] = useRegion();
  return (
    <Select value={region} onValueChange={setRegion}>
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Region" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="auto">AUTO</SelectItem>
        <SelectItem value="ca-central">CA-CENTRAL</SelectItem>
      </SelectContent>
    </Select>
  );
};

export default RegionSelect;
