"use client";

import { useState, useEffect, useRef } from "react";

export function useCountdown(durationSeconds: number, isActive: boolean) {
  const [timeLeft, setTimeLeft] = useState(durationSeconds);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isActive) {
      setTimeLeft(durationSeconds);
      startRef.current = null;
      return;
    }

    if (!startRef.current) {
      startRef.current = Date.now();
    }

    const tick = () => {
      if (!startRef.current) return;
      const elapsed = Math.floor((Date.now() - startRef.current) / 1000);
      const remaining = Math.max(0, durationSeconds - elapsed);
      setTimeLeft(remaining);
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [durationSeconds, isActive]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const display = `${minutes}:${seconds.toString().padStart(2, "0")}`;

  return { timeLeft, display, isExpired: timeLeft === 0 };
}
