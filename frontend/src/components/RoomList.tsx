"use client";

import Link from "next/link";
import { useRoomList } from "@/hooks/useGameState";
import type { Room } from "@/types/game";

function getRoomStatus(room: Room): { label: string; color: string } {
  if (room.current_round === 0)
    return {
      label: `Waiting (${room.player_count}/${room.max_players})`,
      color: "bg-green-100 text-green-800",
    };
  if (room.current_round > 3)
    return { label: "Finished", color: "bg-gray-100 text-gray-600" };
  return {
    label: `Round ${room.current_round}/3`,
    color: "bg-primary-100 text-primary-800",
  };
}

export function RoomList() {
  const { rooms, isLoading } = useRoomList();

  if (isLoading) {
    return (
      <div className="text-center py-8 text-gray-500">Loading rooms...</div>
    );
  }

  if (rooms.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No rooms yet. Create one to get started!
      </div>
    );
  }

  // Filter out any rooms that failed to load properly
  const validRooms = rooms.filter((room) => room && room.room_id !== undefined);

  return (
    <div className="space-y-3">
      {validRooms.map((room) => {
        const status = getRoomStatus(room);
        const isJoinable = room.current_round === 0 && room.player_count < room.max_players;

        return (
          <Link
            key={room.room_id}
            href={`/room/${room.room_id}`}
            className="block bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md hover:border-primary-200 transition-all"
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold text-gray-900">
                  Room #{room.room_id}
                </span>
                <span className="ml-2 text-sm text-gray-500">
                  by {room.creator ? `${room.creator.slice(0, 8)}...` : "Unknown"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {isJoinable && (
                  <span className="text-xs font-medium text-green-600">
                    Join
                  </span>
                )}
                <span
                  className={`text-xs font-medium px-2 py-1 rounded-full ${status.color}`}
                >
                  {status.label}
                </span>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
