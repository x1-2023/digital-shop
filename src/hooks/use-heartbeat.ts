import { useEffect, useRef } from 'react';

/**
 * Hook to send periodic heartbeat to track online users
 * Sends heartbeat every 2 minutes
 */
export function useHeartbeat() {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Function to send heartbeat
    const sendHeartbeat = async () => {
      try {
        await fetch('/api/heartbeat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
      } catch (error) {
        // Silently fail - not critical
        console.debug('[Heartbeat] Failed:', error);
      }
    };

    // Send immediately on mount
    sendHeartbeat();

    // Send every 2 minutes
    intervalRef.current = setInterval(sendHeartbeat, 2 * 60 * 1000);

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);
}
