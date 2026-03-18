import { useState, useEffect, useRef, useCallback } from 'react';

export const useTimer = (initialSeconds = 0, onTimeUp = null) => {
  const [time, setTime] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const timerRef = useRef(null);

  const start = useCallback(() => {
    if (!isRunning && time > 0) {
      setIsRunning(true);
    }
  }, [isRunning, time]);

  const pause = useCallback(() => {
    setIsRunning(false);
  }, []);

  const resume = useCallback(() => {
    if (time > 0) {
      setIsRunning(true);
    }
  }, [time]);

  const reset = useCallback(() => {
    setIsRunning(false);
    setTime(initialSeconds);
  }, [initialSeconds]);

  const setCustomTime = useCallback((seconds) => {
    setTime(seconds);
    setIsRunning(false);
  }, []);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTime((prevTime) => {
          if (prevTime <= 1) {
            setIsRunning(false);
            if (onTimeUp) {
              onTimeUp();
            }
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRunning, onTimeUp]);

  const minutes = Math.floor(time / 60);
  const seconds = time % 60;

  return {
    time,
    minutes,
    seconds,
    isRunning,
    start,
    pause,
    resume,
    reset,
    setCustomTime,
    display: `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  };
};
