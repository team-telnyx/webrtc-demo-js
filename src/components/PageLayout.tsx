import { PropsWithChildren } from 'react';
import { Call } from './Call';
import Header from './Header';
import { cn } from '@/lib/utils';

type Props = PropsWithChildren<{ fitViewport?: boolean }>;

const PageLayout = ({ children, fitViewport = false }: Props) => {
  return (
    <div
      className={cn(
        fitViewport &&
          'md:h-dvh md:flex md:flex-col md:overflow-hidden [&>header]:shrink-0',
      )}
    >
      <Header />
      <Call />
      <main
        className={cn(
          'h-full w-full overflow-y-auto',
          fitViewport && 'md:h-auto md:flex-1 md:min-h-0 md:overflow-hidden',
        )}
      >
        {children}
      </main>
    </div>
  );
};

export default PageLayout;
