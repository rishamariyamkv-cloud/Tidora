import { useEffect, useState } from 'react';

/** Current Date, refreshed every `interval` ms (default 30s). */
export function useNow(interval = 30000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), interval);
    return () => clearInterval(id);
  }, [interval]);
  return now;
}
