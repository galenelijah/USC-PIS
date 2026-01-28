import { useEffect, useRef } from 'react';
import { NetworkRecoveryManager } from '../utils/errorHandling';

/**
 * Custom hook to manage NetworkRecoveryManager lifecycle
 * This prevents memory leaks by properly cleaning up event listeners
 */
export const useNetworkRecovery = () => {
  const networkRecoveryRef = useRef(null);

  useEffect(() => {
    // Create NetworkRecoveryManager instance
    networkRecoveryRef.current = new NetworkRecoveryManager();

    // Cleanup function
    return () => {
      if (networkRecoveryRef.current) {
        networkRecoveryRef.current.destroy();
        networkRecoveryRef.current = null;
      }
    };
  }, []);

  return networkRecoveryRef.current;
};

export default useNetworkRecovery;