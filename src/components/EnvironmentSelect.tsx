import { Environment, useEnvironment } from "@/atoms/environment";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const EnvironmentSelect = () => {
  const [env, setEnv] = useEnvironment();
  return (
    <Select value={env} onValueChange={(value) => setEnv(value as Environment)}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Environment" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Environment</SelectLabel>
          <SelectItem value="production">Production</SelectItem>
          <SelectItem value="development">Development</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  );
};

export default EnvironmentSelect;
