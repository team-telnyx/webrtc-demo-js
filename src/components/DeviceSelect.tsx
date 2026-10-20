import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  SDK_DEFAULT_DEVICE,
  toDeviceId,
  toSelectValue,
} from '@/lib/callDevices';

type Props = {
  devices: MediaDeviceInfo[];
  kind: MediaDeviceKind;
  /** Label prefix used when the browser hides device labels (no permission yet). */
  fallbackLabel: string;
  value?: string;
  onChange: (deviceId: string | undefined) => void;
  testId: string;
};

const DeviceSelect = ({
  devices,
  kind,
  fallbackLabel,
  value,
  onChange,
  testId,
}: Props) => {
  const options = devices.filter((device) => device.kind === kind);
  const hasSelectedDevice =
    !value || options.some((device) => device.deviceId === value);

  return (
    <Select
      value={toSelectValue(value)}
      onValueChange={(next) => onChange(toDeviceId(next))}
    >
      <SelectTrigger data-testid={testId}>
        <SelectValue placeholder="SDK default" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={SDK_DEFAULT_DEVICE}>SDK default</SelectItem>
        {options.map((device, index) => (
          <SelectItem key={device.deviceId} value={device.deviceId}>
            {device.label || `${fallbackLabel} ${index + 1}`}
          </SelectItem>
        ))}
        {!hasSelectedDevice && value && (
          <SelectItem value={value}>Saved device (not connected)</SelectItem>
        )}
      </SelectContent>
    </Select>
  );
};

export default DeviceSelect;
