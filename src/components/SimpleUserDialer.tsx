import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useSimpleUserCallOptions } from '@/atoms/simpleUserCallOptions';
import {
  useSipJsClient,
  useSipJsWsStatus,
  useSipJsRegistrationStatus,
  useSipJsCallStatus,
} from '@/atoms/telnyxClient';
import {
  useSipJsCallNotification,
  useOutgoingCallHandler,
} from '@/atoms/sipJsCall';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DialButton } from './DialButton';
import { toast } from 'sonner';
import { DeviceEvent } from '@telnyx/rtc-sipjs-simple-user';
import { useSimpleUserClientOptions } from '@/atoms/simpleUserClientOptions';

const SimpleUserDialer = () => {
  const [client] = useSipJsClient();
  const [clientOptions] = useSimpleUserClientOptions();
  const [callOptions, setCallOptions] = useSimpleUserCallOptions();

  // CRITICAL FIX: Set alias IMMEDIATELY on component mount
  // The library checks this at runtime in receiveRequest()
  useEffect(() => {
    if (typeof globalThis !== 'undefined') {
      const phoneNumber = '14843068733'; // The phone number that receives calls
      (globalThis as any).__TELNYX_INBOUND_ALIASES__ = [phoneNumber];
      (window as any).__TELNYX_INBOUND_ALIASES__ = [phoneNumber];
      console.log('[SimpleUserDialer] HARDCODED ALIAS SET:', [phoneNumber]);
      console.log('[SimpleUserDialer] Verification:', {
        globalThis: (globalThis as any).__TELNYX_INBOUND_ALIASES__,
        window: (window as any).__TELNYX_INBOUND_ALIASES__,
      });
    }
  }, []); // Run once on mount
  const [wsStatus, setWsStatus] = useSipJsWsStatus();
  const [registrationStatus, setRegistrationStatus] =
    useSipJsRegistrationStatus();
  const [callStatus] = useSipJsCallStatus();
  const [callNotification] = useSipJsCallNotification();
  const [outgoingCallHandler] = useOutgoingCallHandler();
  const registrationStatusRef = useRef(registrationStatus);

  const setDestination = useCallback(
    (value: string) => {
      setCallOptions((prev) => ({
        ...prev,
        destinationNumber: value,
      }));
    },
    [setCallOptions],
  );

  // Helper function to log registration state transitions
  const logRegistrationTransition = (
    event: string,
    from: string,
    to: string,
    data?: Record<string, unknown>,
  ) => {
    const logData = {
      event,
      from,
      to,
      timestamp: new Date().toISOString(),
      ...data,
    };
    console.log(`[Registration State] ${event}: ${from} → ${to}`, logData);
  };

  // Keep ref in sync with state
  useEffect(() => {
    registrationStatusRef.current = registrationStatus;
  }, [registrationStatus]);

  useEffect(() => {
    // CRITICAL: Set alias IMMEDIATELY, even before client check
    // The library checks this at runtime when receiveRequest is called
    if (typeof globalThis !== 'undefined') {
      const aliases: string[] = [];
      
      // Always add the phone number that receives calls
      const phoneNumber = '14843068733'; // TODO: Get from config
      if (phoneNumber) {
        aliases.push(phoneNumber);
      }

      // Check if username is a phone number
      if (clientOptions.username && /^\d+$/.test(clientOptions.username)) {
        aliases.push(clientOptions.username);
      }

      // Add aliases from configuration
      if (clientOptions.inboundAliases && Array.isArray(clientOptions.inboundAliases)) {
        aliases.push(...clientOptions.inboundAliases.filter((a): a is string => typeof a === 'string' && a.length > 0));
      }

      const uniqueAliases = Array.from(new Set(aliases));
      
      if (uniqueAliases.length > 0) {
        (globalThis as any).__TELNYX_INBOUND_ALIASES__ = uniqueAliases;
        (window as any).__TELNYX_INBOUND_ALIASES__ = uniqueAliases;
        console.log('[SimpleUserDialer] ✓✓✓ ALIAS SET IMMEDIATELY:', uniqueAliases);
      }
    }

    if (!client) {
      logRegistrationTransition('Client Removed', 'any', 'unregistered');
      setWsStatus('idle');
      setRegistrationStatus('unregistered');
      registrationStatusRef.current = 'unregistered';
      return;
    }

    // Ensure alias is set when client is available (runtime check happens when INVITE arrives)
    // This must be set AFTER device creation and BEFORE any INVITEs arrive
    // The library checks: aor.user, contact.uri.user, pubGruu.user, tempGruu.user, then __TELNYX_INBOUND_ALIASES__
    console.log('[SimpleUserDialer] Configuring inbound aliases for runtime checks', {
      username: clientOptions.username,
      inboundAliases: clientOptions.inboundAliases,
      hasClient: !!client,
      currentAlias: (globalThis as any).__TELNYX_INBOUND_ALIASES__,
    });

    if (typeof globalThis !== 'undefined') {
      const aliases: string[] = [];

      // Check if username is a phone number (all digits) - if so, use it as alias
      if (clientOptions.username && /^\d+$/.test(clientOptions.username)) {
        aliases.push(clientOptions.username);
        console.log('[SimpleUserDialer] Added username as alias (numeric):', clientOptions.username);
      }

      // Add aliases from configuration
      if (clientOptions.inboundAliases && Array.isArray(clientOptions.inboundAliases)) {
        const validAliases = clientOptions.inboundAliases.filter(
          (alias): alias is string => typeof alias === 'string' && alias.length > 0,
        );
        if (validAliases.length > 0) {
          aliases.push(...validAliases);
          console.log('[SimpleUserDialer] Added configured aliases:', validAliases);
        }
      } else {
        console.log('[SimpleUserDialer] No inboundAliases in clientOptions:', {
          inboundAliases: clientOptions.inboundAliases,
          type: typeof clientOptions.inboundAliases,
        });
      }

      // Remove duplicates
      const uniqueAliases = Array.from(new Set(aliases));

      if (uniqueAliases.length > 0) {
        // Set on both globalThis and window for maximum compatibility
        (globalThis as any).__TELNYX_INBOUND_ALIASES__ = uniqueAliases;
        if (typeof window !== 'undefined') {
          (window as any).__TELNYX_INBOUND_ALIASES__ = uniqueAliases;
        }
        console.log('[SimpleUserDialer] ✓ Alias configured for runtime checks:', uniqueAliases, {
          username: clientOptions.username,
          willMatch: 'Incoming INVITEs with Request-URI user matching these numbers will be accepted',
        });
      } else {
        // Clear aliases if none configured
        (globalThis as { __TELNYX_INBOUND_ALIASES__?: string[] }).__TELNYX_INBOUND_ALIASES__ =
          undefined;
        console.warn(
          '[SimpleUserDialer] ⚠ No inbound aliases configured. Incoming calls to phone numbers will fail with 404.',
          {
            username: clientOptions.username,
            usernameIsNumeric: clientOptions.username ? /^\d+$/.test(clientOptions.username) : false,
            suggestion: 'Add the phone number(s) that receive calls to "Inbound Phone Number Aliases" in SIP.js Client Options',
          },
        );
      }

      // Verify it was set
      const verifyAlias = (globalThis as { __TELNYX_INBOUND_ALIASES__?: string[] })
        .__TELNYX_INBOUND_ALIASES__;
      console.log('[SimpleUserDialer] Alias verification:', {
        set: typeof verifyAlias !== 'undefined',
        isArray: Array.isArray(verifyAlias),
        value: verifyAlias,
      });
    }

    // Set up device event listeners
    const handleWsConnecting = ({ attempts }: { attempts: number }) => {
      logRegistrationTransition('WebSocket Connecting', 'idle/disconnected', 'connecting', {
        attempt: attempts,
      });
      console.log(`[Device] WebSocket connecting (attempt ${attempts})`);
      setWsStatus('connecting');
    };

    const handleWsConnected = () => {
      logRegistrationTransition('WebSocket Connected', 'connecting', 'connected');
      console.log('[Device] WebSocket connected');
      setWsStatus('connected');
    };

    const handleWsDisconnected = () => {
      logRegistrationTransition('WebSocket Disconnected', 'connected', 'disconnected');
      console.log('[Device] WebSocket disconnected');
      setWsStatus('disconnected');
      // When WebSocket disconnects, registration is also lost
      const currentRegStatus = registrationStatusRef.current;
      if (currentRegStatus === 'registered' || currentRegStatus === 'registering') {
        logRegistrationTransition('Registration Lost (WS Disconnect)', currentRegStatus, 'unregistered');
        setRegistrationStatus('unregistered');
        registrationStatusRef.current = 'unregistered';
      }
    };

    const handleRegistered = () => {
      logRegistrationTransition('Registered', 'registering/unregistered', 'registered', {
        username: client.username,
      });
      console.log('[Device] Registered', { username: client.username });

      // CRITICAL: Re-set alias at registration time to ensure it's available when INVITEs arrive
      // The alias check happens in receiveRequest() which is called BEFORE onCallReceived
      // So the alias MUST be set and persist in globalThis
      if (typeof globalThis !== 'undefined') {
        const aliases: string[] = [];

        // Check if username is a phone number (all digits) - if so, use it as alias
        if (clientOptions.username && /^\d+$/.test(clientOptions.username)) {
          aliases.push(clientOptions.username);
        }

        // Add aliases from configuration
        if (clientOptions.inboundAliases && Array.isArray(clientOptions.inboundAliases)) {
          aliases.push(
            ...clientOptions.inboundAliases.filter(
              (alias): alias is string => typeof alias === 'string' && alias.length > 0,
            ),
          );
        }

        // Remove duplicates
        const uniqueAliases = Array.from(new Set(aliases));

        if (uniqueAliases.length > 0) {
          // Set it on both globalThis and window to ensure it's accessible
          // The library checks globalThis, but in browser context window === globalThis
          (globalThis as any).__TELNYX_INBOUND_ALIASES__ = uniqueAliases;
          if (typeof window !== 'undefined') {
            (window as any).__TELNYX_INBOUND_ALIASES__ = uniqueAliases;
          }
          console.log('[Device] ✓ Alias RE-SET at registration:', uniqueAliases, {
            username: clientOptions.username,
            method: 'Direct assignment to globalThis and window',
          });
        }

        // Verify it was set
        const aliasCheck = (globalThis as any).__TELNYX_INBOUND_ALIASES__;
        console.log('[Device] Alias verification at registration:', {
          exists: typeof aliasCheck !== 'undefined',
          isArray: Array.isArray(aliasCheck),
          value: aliasCheck,
          length: aliasCheck?.length,
          globalThisType: typeof globalThis,
          hasProperty: '__TELNYX_INBOUND_ALIASES__' in globalThis,
        });

        // Test the normalization logic that the library uses
        if (Array.isArray(aliasCheck)) {
          const testRuri = '14843068733';
          const normalized = testRuri.replace(/\D/g, '');
          const wouldMatch = aliasCheck.some((a: string) => (a || '').replace(/\D/g, '') === normalized);
          console.log('[Device] Alias match test:', {
            testRuri,
            normalized,
            aliases: aliasCheck,
            wouldMatch,
          });
        }
      }

      setRegistrationStatus('registered');
      registrationStatusRef.current = 'registered';
    };

    const handleUnregistered = () => {
      logRegistrationTransition('Unregistered', 'registered', 'unregistered', {
        username: client.username,
      });
      console.log('[Device] Unregistered', { username: client.username });
      setRegistrationStatus('unregistered');
      registrationStatusRef.current = 'unregistered';
    };

    const handleRegistrationFailed = ({ cause }: { cause: Error }) => {
      logRegistrationTransition('Registration Failed', 'registering', 'unregistered', {
        error: cause.message,
        errorName: cause.name,
        username: client.username,
      });
      console.error('[Device] Registration failed:', cause, { username: client.username });
      setRegistrationStatus('unregistered');
      registrationStatusRef.current = 'unregistered';
      toast.error(`Registration failed: ${cause.message}`);
    };

    const handleMessage = ({ body }: { body: string }) => {
      console.log('[Device] SIP message received:', body);
    };

    // Attach device event listeners
    client.on(DeviceEvent.WsConnecting, handleWsConnecting);
    client.on(DeviceEvent.WsConnected, handleWsConnected);
    client.on(DeviceEvent.WsDisconnected, handleWsDisconnected);
    client.on(DeviceEvent.Registered, handleRegistered);
    client.on(DeviceEvent.Unregistered, handleUnregistered);
    client.on(DeviceEvent.RegistrationFailed, handleRegistrationFailed);
    client.on(DeviceEvent.Message, handleMessage);

    // Cleanup function
    return () => {
      client.off(DeviceEvent.WsConnecting, handleWsConnecting);
      client.off(DeviceEvent.WsConnected, handleWsConnected);
      client.off(DeviceEvent.WsDisconnected, handleWsDisconnected);
      client.off(DeviceEvent.Registered, handleRegistered);
      client.off(DeviceEvent.Unregistered, handleUnregistered);
      client.off(DeviceEvent.RegistrationFailed, handleRegistrationFailed);
      client.off(DeviceEvent.Message, handleMessage);
    };
  }, [client, clientOptions, setWsStatus, setRegistrationStatus]);

  const registerExtraHeaders = useMemo(
    () =>
      callOptions.extraHeaders.length > 0
        ? callOptions.extraHeaders
        : undefined,
    [callOptions.extraHeaders],
  );

  const handleConnect = async () => {
    if (!client) return;
    try {
      await client.startWS();
      // Status will be updated via DeviceEvent.WsConnected event
    } catch (error) {
      console.error('Failed to start WebSocket', error);
      toast.error('Failed to connect WebSocket');
      setWsStatus('disconnected');
    }
  };

  const handleDisconnect = async () => {
    if (!client) return;
    try {
      await client.stopWS();
      // Status will be updated via DeviceEvent.WsDisconnected event
    } catch (error) {
      console.error('Failed to disconnect WebSocket', error);
      toast.error('Failed to disconnect WebSocket');
    }
  };

  const handleRegister = async () => {
    if (!client) return;
    const currentStatus = registrationStatus;
    logRegistrationTransition('Register Initiated', currentStatus, 'registering', {
      username: client.username,
    });
    setRegistrationStatus('registering');
    try {
      await client.register({ extraHeaders: registerExtraHeaders });
      // Status will be updated via DeviceEvent.Registered event
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      logRegistrationTransition('Register Error', 'registering', 'unregistered', {
        error: errorObj.message,
        errorName: errorObj.name,
        username: client.username,
      });
      console.error('Failed to register', error, { username: client.username });
      toast.error('Failed to register');
      setRegistrationStatus('unregistered');
      registrationStatusRef.current = 'unregistered';
    }
  };

  const handleUnregister = async () => {
    if (!client) return;
    const currentStatus = registrationStatus;
    logRegistrationTransition('Unregister Initiated', currentStatus, 'unregistered', {
      username: client.username,
    });
    try {
      await client.unregister({ extraHeaders: registerExtraHeaders });
      // Status will be updated via DeviceEvent.Unregistered event
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      logRegistrationTransition('Unregister Error', currentStatus, 'unregistered', {
        error: errorObj.message,
        errorName: errorObj.name,
        username: client.username,
      });
      console.error('Failed to unregister', error, { username: client.username });
      toast.error('Failed to unregister');
      // Still set to unregistered on error
      setRegistrationStatus('unregistered');
      registrationStatusRef.current = 'unregistered';
    }
  };

  const handlePlaceCall = () => {
    if (!client || !callOptions.destinationNumber) {
      toast('Enter a destination number');
      return;
    }
    try {
      console.log('[Outbound Call] Initiating call', {
        destination: callOptions.destinationNumber,
        registrationStatus,
        callStatus,
      });
      const call = client.initiateCall(callOptions.destinationNumber);
      if (outgoingCallHandler) {
        outgoingCallHandler(call);
      }
    } catch (error) {
      console.error('Failed to start call', error, {
        destination: callOptions.destinationNumber,
      });
      toast.error('Failed to start call');
    }
  };

  const handleHangup = () => {
    const call = callNotification.call;
    if (!call) return;
    console.log('[Call Action] Hangup initiated', {
      direction: callNotification.direction,
      callId: call.getSession()?.id,
      callStatus,
    });
    call.disconnect();
  };

  const handleAccept = () => {
    const call = callNotification.call;
    if (!call) return;
    console.log('[Inbound Call] Accept initiated', {
      callId: call.getSession()?.id,
    });
    call.accept();
  };

  const handleReject = () => {
    const call = callNotification.call;
    if (!call) return;
    console.log('[Inbound Call] Reject initiated', {
      callId: call.getSession()?.id,
    });
    call.reject();
  };

  const onDialButtonClick = (value: { digit: string }) => {
    if (!value.digit) return;
    setDestination(callOptions.destinationNumber + value.digit);
  };

  const isConnected = wsStatus === 'connected';
  const hasActiveCall =
    callStatus === 'incoming' ||
    callStatus === 'connecting' ||
    callStatus === 'connected' ||
    callStatus === 'dialing';

  return (
    <Card>
      <CardHeader>
        <CardTitle>SIP.js Dialer</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          value={callOptions.destinationNumber}
          placeholder="Enter destination"
          onChange={(event) => setDestination(event.target.value)}
        />
        <div className="grid grid-cols-3 gap-4 place-items-center">
          <DialButton onClick={onDialButtonClick} digit="1" />
          <DialButton onClick={onDialButtonClick} digit="2" characters="ABC" />
          <DialButton onClick={onDialButtonClick} digit="3" characters="DEF" />
          <DialButton onClick={onDialButtonClick} digit="4" characters="GHI" />
          <DialButton onClick={onDialButtonClick} digit="5" characters="JKL" />
          <DialButton onClick={onDialButtonClick} digit="6" characters="MNO" />
          <DialButton onClick={onDialButtonClick} digit="7" characters="PQRS" />
          <DialButton onClick={onDialButtonClick} digit="8" characters="TUV" />
          <DialButton onClick={onDialButtonClick} digit="9" characters="WXYZ" />
          <DialButton onClick={onDialButtonClick} digit="*" />
          <DialButton onClick={onDialButtonClick} digit="0" />
          <DialButton onClick={onDialButtonClick} digit="#" />
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-2">
        <div className="grid grid-cols-2 gap-2 w-full">
          <Button
            onClick={handleConnect}
            disabled={!client || isConnected}
            variant="secondary"
          >
            Connect
          </Button>
          <Button
            onClick={handleDisconnect}
            disabled={!client || wsStatus === 'idle'}
            variant="outline"
          >
            Disconnect
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-2 w-full">
          <Button
            onClick={handleRegister}
            disabled={!client || !isConnected}
            variant="secondary"
          >
            Register
          </Button>
          <Button
            onClick={handleUnregister}
            disabled={!client || registrationStatus === 'unregistered'}
            variant="outline"
          >
            Unregister
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-2 w-full">
          <Button
            onClick={handlePlaceCall}
            disabled={!client || !isConnected || hasActiveCall}
          >
            Call
          </Button>
          <Button
            onClick={handleHangup}
            disabled={!hasActiveCall}
            variant="destructive"
          >
            Hangup
          </Button>
        </div>
        {callStatus === 'incoming' && (
          <div className="grid grid-cols-2 gap-2 w-full">
            <Button onClick={handleAccept}>Answer</Button>
            <Button onClick={handleReject} variant="outline">
              Reject
            </Button>
          </div>
        )}
      </CardFooter>
    </Card>
  );
};

export default SimpleUserDialer;
