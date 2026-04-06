import { useClientOptions } from '@/atoms/clientOptions';
import { useConnectionStatus, useLocalDc, useLocalRegion } from '@/atoms/telnyxClient';
import { clsx } from 'clsx';

const ConnectionStatus = () => {
  const [status] = useConnectionStatus();
  const [localDc] = useLocalDc();
  const [localRegion] = useLocalRegion();
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
      {localRegion && <span className='ml-2 text-sm opacity-75'>region: {localRegion}</span>}
      {localDc && <span className='ml-2 text-sm opacity-75'>dc: {localDc}</span>}
    </h3>
  );
};

export default ConnectionStatus;
