"use client";

import { CreateRoom } from "@/components/CreateRoom";
import { RoomList } from "@/components/RoomList";

export default function LobbyPage() {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Prompt Duel
        </h1>
        <p className="text-gray-600 max-w-lg mx-auto">
          Compete to craft the best AI prompt. Your prompts are scored by LLM
          consensus through GenLayer&apos;s Optimistic Democracy. 3 rounds, best
          total score wins.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <CreateRoom />

          <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-900 mb-2">How it works</h3>
            <ol className="space-y-2 text-sm text-gray-600 list-decimal list-inside">
              <li>Create or join a room (2-6 players)</li>
              <li>A challenge is revealed each round</li>
              <li>Write the best prompt you can in 2 minutes</li>
              <li>An LLM scores all prompts via on-chain consensus</li>
              <li>After 3 rounds, XP is distributed to all players</li>
            </ol>
          </div>
        </div>

        <div className="md:col-span-2">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            Active Rooms
          </h2>
          <RoomList />
        </div>
      </div>
    </div>
  );
}
