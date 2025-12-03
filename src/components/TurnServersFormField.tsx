import { ControllerProps, FieldPath, FieldValues } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import { Input } from "./ui/input";

export function TurnServersFormField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({ ...props }: Partial<ControllerProps<TFieldValues, TName>>) {
  return (
    <FormField
      {...props}
      name={props.name || ("turnServers" as TName)}
      render={({ field }) => {
        const turnServer = Array.isArray(field.value)
          ? field.value[0]
          : field.value;
        const updateTurnServer = (
          key: "urls" | "username" | "password",
          value: string
        ) => {
          const current = Array.isArray(field.value)
            ? field.value[0]
            : field.value;
          field.onChange({ ...current, [key]: value });
        };
        return (
          <div className="grid md:grid-cols-3 gap-4">
            <FormItem>
              <FormLabel>TURN Server URL</FormLabel>
              <FormControl>
                <Input
                  data-testid="input-turn-server-url"
                  placeholder="turn:turn.telnyx.com:3478?transport=tcp"
                  value={(turnServer?.urls as string) ?? ""}
                  onChange={(e) => updateTurnServer("urls", e.target.value)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
            <FormItem>
              <FormLabel>TURN Username</FormLabel>
              <FormControl>
                <Input
                  data-testid="input-turn-username"
                  placeholder="Username"
                  value={turnServer?.username ?? ""}
                  onChange={(e) => updateTurnServer("username", e.target.value)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
            <FormItem>
              <FormLabel>TURN Password</FormLabel>
              <FormControl>
                <Input
                  data-testid="input-turn-password"
                  placeholder="Password"
                  value={turnServer?.password ?? ""}
                  onChange={(e) => updateTurnServer("password", e.target.value)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          </div>
        );
      }}
    />
  );
}
