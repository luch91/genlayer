"use client";

import { useEffect, useState } from "react";
import { readContract } from "@/lib/contract";
import type { LeaderboardEntry } from "@/types/game";

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        const data = await readContract<LeaderboardEntry[]>("get_leaderboard");
        setEntries(data);
      } catch {
        setEntries([]);
      } finally {
        setIsLoading(false);
      }
    }
    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Leaderboard</h1>
        <p className="text-gray-500">
          Top prompt engineers ranked by lifetime XP
        </p>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-gray-500">Loading...</div>
      ) : entries.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No scores yet. Play a game to get on the board!
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rank
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Player
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  XP
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {entries.map((entry, idx) => (
                <tr
                  key={entry.address}
                  className={idx < 3 ? "bg-primary-50/30" : ""}
                >
                  <td className="px-6 py-4">
                    <span
                      className={`w-7 h-7 inline-flex items-center justify-center rounded-full text-sm font-bold ${
                        idx === 0
                          ? "bg-accent-500 text-white"
                          : idx === 1
                          ? "bg-gray-400 text-white"
                          : idx === 2
                          ? "bg-amber-600 text-white"
                          : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      {idx + 1}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono text-sm text-gray-800">
                    {entry.address.slice(0, 10)}...{entry.address.slice(-6)}
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-primary-700">
                    {entry.xp} XP
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
