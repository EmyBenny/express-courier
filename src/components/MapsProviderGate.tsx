import { ReactNode } from 'react';
import { APIProvider } from '@vis.gl/react-google-maps';

const MAPS_LIBRARIES: string[] = ['marker', 'maps'];

interface MapsProviderGateProps {
  apiKey: string;
  children: ReactNode;
}

export function MapsProviderGate({ apiKey, children }: MapsProviderGateProps) {
  if (!apiKey) {
    return <>{children}</>;
  }

  return (
    <APIProvider
      apiKey={apiKey}
      libraries={MAPS_LIBRARIES}
      language="en"
      region="US"
    >
      {children}
    </APIProvider>
  );
}
