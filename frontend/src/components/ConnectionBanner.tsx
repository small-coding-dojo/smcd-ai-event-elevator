'use client';

import type { ConnectionState } from '@/lib/types';

interface ConnectionBannerProps {
  connectionState: ConnectionState;
  wasReconnecting: boolean;
}

export function ConnectionBanner({ connectionState, wasReconnecting }: ConnectionBannerProps) {
  if (connectionState === 'Disconnected') {
    return (
      <div role="alert" className="bg-red-100 border border-red-400 text-red-800 px-4 py-2 rounded text-center">
        ⚠ Connection lost — showing last known state
      </div>
    );
  }

  if (connectionState === 'Reconnecting') {
    return (
      <div role="status" className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-2 rounded text-center">
        ↻ Reconnecting…
      </div>
    );
  }

  if (connectionState === 'Connected' && wasReconnecting) {
    return (
      <div role="status" className="bg-green-100 border border-green-400 text-green-800 px-4 py-2 rounded text-center">
        ✓ Connection restored
      </div>
    );
  }

  return null;
}
