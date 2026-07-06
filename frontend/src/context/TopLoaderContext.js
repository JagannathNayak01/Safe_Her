import React, { createContext, useState, useCallback, useRef } from 'react';

export const TopLoaderContext = createContext({
  start: () => {},
  done: () => {},
  isLoading: false,
  progress: 0,
});

export default function TopLoaderProvider({ children }) {
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const timerRef = useRef(null);

  const clearTimers = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const start = useCallback(() => {
    clearTimers();
    setProgress(15);
    setIsLoading(true);

    // Simulate slow progress that never quite reaches 100%
    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev;
        // Slow down as we approach 90%
        const increment = prev < 50 ? 8 : prev < 70 ? 4 : 1.5;
        return Math.min(prev + increment, 90);
      });
    }, 300);
  }, []);

  const done = useCallback(() => {
    clearTimers();
    setProgress(100);

    // After the bar fills to 100%, fade it out
    setTimeout(() => {
      setIsLoading(false);
      setProgress(0);
    }, 400);
  }, []);

  return (
    <TopLoaderContext.Provider value={{ start, done, isLoading, progress }}>
      {children}
    </TopLoaderContext.Provider>
  );
}
