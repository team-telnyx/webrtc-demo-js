import { useRegion } from '@/atoms/region';
import { REGION_OPTIONS } from '@/lib/regions';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const RegionSelect = () => {
  const [region, setRegion] = useRegion();
  return (
    <Select value={region} onValueChange={setRegion}>
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Region" />
      </SelectTrigger>
      <SelectContent>
        {REGION_OPTIONS.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default RegionSelect;
