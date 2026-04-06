import { useClientOptions } from '@/atoms/clientOptions';
import { useConnectionStatus, useConnectedRegion, useDc } from '@/atoms/telnyxClient';
import { clsx } from 'clsx';

const ConnectionStatus = () => {
  const [status] = useConnectionStatus();
  const [dc] = useDc();
  const [connectedRegion] = useConnectedRegion();
  const [clientOptions] = useClientOptions();
  return (
    <h3
      className={clsx({
        'text-red-500': status === 'disconnected',
        'text-yellow-500': status === 'connecting' || status === 'registering',
        'text-green-500': status === 'registered',
      })}
    >
      {status} ({status === 'registered' && clientOptions.login})
      {connectedRegion && <span className='ml-2 text-sm opacity-75'>region: {connectedRegion}</span>}
      {dc && <span className='ml-2 text-sm opacity-75'>dc: {dc}</span>}
    </h3>
  );
};

export default ConnectionStatus;
