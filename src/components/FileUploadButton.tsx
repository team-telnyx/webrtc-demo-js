import { Upload } from "lucide-react";
import { useRef } from "react";
import { Button } from "./ui/button";

type Props = {
  accept: string;
  value: string | undefined;
  id: string;
  onChange: (fileURL: string) => void;
};

const FileUploadButton = ({ id, accept, onChange, value }: Props) => {
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    onChange(URL.createObjectURL(file));
  };

  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <label htmlFor="file" className="cursor-pointer block">
      <input
        className="hidden"
        type="file"
        accept={accept}
        id={id}
        onChange={handleFileChange}
        ref={inputRef}
      />
      <Button
        onClick={() => {
          inputRef.current?.click();
        }}
        className="gap-2 w-full"
        variant="outline"
      >
        <Upload className="h-4 w-4" />
        {value ? "Change File" : "Select File"}
      </Button>
    </label>
  );
};

export default FileUploadButton;
