import React, { useEffect } from 'react';

// The cache cleanup is defined but never called
// Consider adding periodic cleanup:
useEffect(() => {
  const cleanup = async () => {
    await clearOldCache();
  };
  cleanup();
  // Run cleanup every 24 hours
  const interval = setInterval(cleanup, 24 * 60 * 60 * 1000);
  return () => clearInterval(interval);
}, []); 