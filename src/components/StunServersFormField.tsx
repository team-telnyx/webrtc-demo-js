import { ControllerProps, FieldPath, FieldValues } from 'react-hook-form';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from './ui/form';
import { Textarea } from './ui/textarea';

export function StunServersFormField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  ...props
}: Partial<ControllerProps<TFieldValues, TName>> & {
  wrapperClassName?: string;
}) {
  return (
    <FormField
      {...props}
      name={props.name || ('stunServers' as TName)}
      render={({ field }) => (
        <FormItem className={props.wrapperClassName}>
          <FormLabel>STUN Servers</FormLabel>
          <FormControl>
            <Textarea
              data-testid="input-stun-servers"
              placeholder="One server per line"
              value={
                Array.isArray(field.value)
                  ? field.value.join('\n')
                  : (field.value ?? '')
              }
              onChange={(event) =>
                field.onChange(
                  event.target.value.split('\n').map((line) => line.trim()),
                )
              }
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
