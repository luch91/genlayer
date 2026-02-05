"use client";

import { useCountdown } from "@/hooks/useCountdown";

interface GameTimerProps {
  durationSeconds: number;
  isActive: boolean;
}

export function GameTimer({ durationSeconds, isActive }: GameTimerProps) {
  const { display, isExpired } = useCountdown(durationSeconds, isActive);

  return (
    <div
      className={`text-center font-mono text-2xl font-bold ${
        isExpired
          ? "text-red-500"
          : "text-gray-800"
      }`}
    >
      {display}
    </div>
  );
}
