import { useClientOptions } from '@/atoms/clientOptions';
import { useConnectionStatus, useSource } from '@/atoms/telnyxClient';
import { clsx } from 'clsx';

const ConnectionStatus = () => {
  const [status] = useConnectionStatus();
  const [source] = useSource();
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
      {source && <span className='ml-2 text-sm opacity-75'>region: {source}</span>}
    </h3>
  );
};

export default ConnectionStatus;
