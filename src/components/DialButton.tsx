import clsx from "clsx";

export interface DialButtonData {
  digit: string;
  characters?: string;
}
export type DialButtonProps = {
  disabled?: boolean;
  className?: string;
  characters?: string;
  digit: React.ReactNode;
  onClick?: (data: DialButtonData) => void;
};

export const DialButton = ({
  characters,
  digit,
  className,
  onClick,
  ...props
}: DialButtonProps) => {
  return (
    <button
      onClick={() => onClick?.({ digit: digit as string, characters })}
      className={clsx(
        " w-16 h-16 p-4 border hover:bg-foreground hover:text-black rounded-full flex flex-col items-center justify-center",
        className
      )}
      {...props}
    >
      <span className="text-lg font-bold">{digit}</span>
      <span className="text-xs text-muted-foreground">{characters}</span>
    </button>
  );
};
