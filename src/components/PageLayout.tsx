import { PropsWithChildren } from "react";
import { Call } from "./Call";
import Header from "./Header";

type Props = PropsWithChildren;

const PageLayout = ({ children }: Props) => {
  return (
    <div>
      <Header />
      <Call />
      <main className="h-full w-full overflow-y-auto">{children}</main>
    </div>
  );
};

export default PageLayout;
