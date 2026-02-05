"use client";

import type { RoomPlayer } from "@/types/game";

interface RoundResultsProps {
  players: RoomPlayer[];
  roundNumber: number;
}

export function RoundResults({ players, roundNumber }: RoundResultsProps) {
  const sorted = [...players].sort(
    (a, b) => b.round_score - a.round_score
  );

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Round {roundNumber} Results
      </h3>
      <div className="space-y-3">
        {sorted.map((player, rank) => (
          <div
            key={player.index}
            className={`flex items-center justify-between p-3 rounded-lg ${
              rank === 0
                ? "bg-accent-400/10 border border-accent-400/30"
                : "bg-gray-50"
            }`}
          >
            <div className="flex items-center gap-3">
              <span
                className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-bold ${
                  rank === 0
                    ? "bg-accent-500 text-white"
                    : rank === 1
                    ? "bg-gray-300 text-gray-700"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                {rank + 1}
              </span>
              <div>
                <div className="text-sm font-medium text-gray-900">
                  {player.address.slice(0, 8)}...{player.address.slice(-4)}
                </div>
                {player.prompt && (
                  <div className="text-xs text-gray-500 mt-0.5 max-w-md truncate">
                    &quot;{player.prompt}&quot;
                  </div>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-primary-700">
                {player.round_score}
              </div>
              <div className="text-xs text-gray-500">
                Total: {player.total_score}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
