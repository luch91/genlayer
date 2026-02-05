"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { writeContract } from "@/lib/contract";

export function CreateRoom() {
  const router = useRouter();
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    setIsCreating(true);
    setError(null);
    try {
      // First test if we can read from the contract
      const { readContract: read } = await import("@/lib/contract");
      console.log("Testing read operation...");
      const totalRoomsBefore = await read<number>("get_total_rooms");
      console.log("Total rooms before:", totalRoomsBefore);

      // Now try to create - pass as BigInt for u32 parameter
      console.log("Creating room with maxPlayers:", maxPlayers);
      await writeContract("create_room", [BigInt(maxPlayers)]);

      // Re-fetch with retry logic to get the updated state
      let totalRooms = totalRoomsBefore;
      let retries = 5;
      while (retries > 0 && totalRooms <= totalRoomsBefore) {
        console.log(`Checking for updated room count (attempt ${6 - retries}/5)...`);
        await new Promise((resolve) => setTimeout(resolve, 2000));
        totalRooms = await read<number>("get_total_rooms");
        console.log("Total rooms:", totalRooms);
        retries--;
      }

      if (totalRooms > totalRoomsBefore) {
        console.log("Room created successfully! Navigating to room", totalRooms - 1);
        router.push(`/room/${totalRooms - 1}`);
      } else {
        throw new Error("Room creation may have succeeded but state not updated yet. Please refresh the page.");
      }
    } catch (err) {
      console.error("Full error:", err);
      setError(err instanceof Error ? err.message : "Failed to create room");
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Create a New Duel
      </h2>
      <div className="flex items-center gap-4 mb-4">
        <label className="text-sm text-gray-600">Max Players:</label>
        <select
          value={maxPlayers}
          onChange={(e) => setMaxPlayers(Number(e.target.value))}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          {[2, 3, 4, 5, 6].map((n) => (
            <option key={n} value={n}>
              {n} players
            </option>
          ))}
        </select>
      </div>
      {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
      <button
        onClick={handleCreate}
        disabled={isCreating}
        className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white font-medium py-2.5 px-4 rounded-lg transition-colors"
      >
        {isCreating ? "Creating..." : "Create Room"}
      </button>
    </div>
  );
}
