import { CustomHeader } from "@/atoms/callOptions";
import { PlusIcon, TrashIcon } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

interface CustomHeadersInputProps {
  value: CustomHeader[];
  onChange: (value: CustomHeader[]) => void;
}
const CustomHeadersInput = ({
  value = [],
  onChange,
}: CustomHeadersInputProps) => {
  const onAdd = () => {
    onChange([...value, { name: "", value: "" }]);
  };

  const onInputChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    index: number
  ) => {
    const { name, value: inputValue } = event.target;

    const newHeaders = [...value];
    newHeaders[index] = { ...newHeaders[index], [name]: inputValue };

    onChange(newHeaders);
  };

  const onRemove = (index: number) => {
    const newHeaders = [...value];
    newHeaders.splice(index, 1);
    onChange(newHeaders);
  };

  const headers = value.map(
    ({ name: headerName, value: headerValue }, index) => {
      return (
        <div className="flex gap-2 mb-2" key={index}>
          <Input
            name="name"
            placeholder="X-HEADER-NAME"
            value={headerName}
            onChange={(event) => onInputChange(event, index)}
          />
          <Input
            name="value"
            placeholder="VALUE"
            value={headerValue}
            onChange={(event) => onInputChange(event, index)}
          />
          <Button
            onClick={() => onRemove(index)}
            className="flex-shrink-0"
            size="icon"
            variant={"outline"}
          >
            <TrashIcon />
          </Button>
        </div>
      );
    }
  );

  return (
    <div className="flex flex-col">
      {headers}
      <Button type="button" onClick={onAdd} variant={"outline"}>
        <PlusIcon />
      </Button>
    </div>
  );
};

export default CustomHeadersInput;
