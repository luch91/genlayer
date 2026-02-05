"use client";

import type { RoomPlayer } from "@/types/game";

const XP_REWARDS = [100, 60, 30, 10, 10, 10];

interface ScoreboardProps {
  players: RoomPlayer[];
}

export function Scoreboard({ players }: ScoreboardProps) {
  // Sort by total_score, but only participating players get XP ranking
  const sorted = [...players].sort(
    (a, b) => b.total_score - a.total_score
  );

  // Track XP rank separately (only for participants)
  let xpRank = 0;

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-1">
        Final Standings
      </h3>
      <p className="text-sm text-gray-500 mb-4">
        XP distributed to participating players only
      </p>
      <div className="space-y-3">
        {sorted.map((player, displayRank) => {
          const participated = player.rounds_participated > 0;
          const currentXpRank = participated ? xpRank++ : -1;
          const xp = participated ? (XP_REWARDS[currentXpRank] ?? 10) : 0;

          return (
            <div
              key={player.index}
              className={`flex items-center justify-between p-4 rounded-lg ${
                !participated
                  ? "bg-gray-50 opacity-60"
                  : displayRank === 0
                  ? "bg-gradient-to-r from-accent-400/20 to-accent-500/10 border border-accent-400/30"
                  : displayRank === 1
                  ? "bg-gray-100 border border-gray-200"
                  : "bg-gray-50"
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold ${
                    !participated
                      ? "bg-gray-200 text-gray-400"
                      : displayRank === 0
                      ? "bg-accent-500 text-white"
                      : displayRank === 1
                      ? "bg-gray-400 text-white"
                      : displayRank === 2
                      ? "bg-amber-600 text-white"
                      : "bg-gray-300 text-gray-700"
                  }`}
                >
                  {participated ? displayRank + 1 : "-"}
                </span>
                <div>
                  <span className="font-medium text-gray-900">
                    {player.address.slice(0, 8)}...{player.address.slice(-4)}
                  </span>
                  {!participated && (
                    <span className="ml-2 text-xs text-gray-400">(did not participate)</span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className={`text-lg font-bold ${participated ? "text-primary-700" : "text-gray-400"}`}>
                  {player.total_score} pts
                </div>
                {participated ? (
                  <div className="text-xs font-medium text-accent-600">
                    +{xp} XP
                  </div>
                ) : (
                  <div className="text-xs text-gray-400">
                    No XP
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
