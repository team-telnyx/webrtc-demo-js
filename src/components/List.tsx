import { SquareDashedIcon } from "lucide-react";

type ListProps<T> = {
  className?: string;
  items: T[];
  renderItem: (item: T, index: number, arr: T[]) => React.ReactNode;
  emptyList?: React.ReactNode;
};

function EmptyListComponent() {
  return (
    <div className="h-[300px] flex flex-col gap-4 items-center justify-center">
      <SquareDashedIcon className="w-10 h-10 text-muted" />
      <h1 className="text-muted-foreground">List is empty</h1>
    </div>
  );
}

function List<T>({
  emptyList = <EmptyListComponent />,
  items,
  renderItem,
  className,
}: ListProps<T>) {
  if (items.length === 0) {
    return emptyList;
  }

  const elements = items.map(renderItem);

  return <ul className={className}>{elements}</ul>;
}

export default List;
