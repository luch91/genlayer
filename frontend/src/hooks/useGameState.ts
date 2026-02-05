"use client";

import { useState, useEffect, useCallback } from "react";
import { readContract } from "@/lib/contract";
import type { Room, RoomPlayer } from "@/types/game";

const POLL_INTERVAL = 5000;

export function useGameState(roomId: number | null) {
  const [room, setRoom] = useState<Room | null>(null);
  const [players, setPlayers] = useState<RoomPlayer[]>([]);
  const [challenge, setChallenge] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchState = useCallback(async () => {
    if (roomId === null) return;
    try {
      const [roomData, playersData, challengeData] = await Promise.all([
        readContract<Room>("get_room", [BigInt(roomId)]),
        readContract<RoomPlayer[]>("get_room_players", [BigInt(roomId)]),
        readContract<string>("get_challenge", [BigInt(roomId)]),
      ]);
      console.log("Room data:", JSON.stringify(roomData, null, 2));
      console.log("Players data:", JSON.stringify(playersData, null, 2));
      console.log("Challenge data:", JSON.stringify(challengeData, null, 2));
      setRoom(roomData);
      setPlayers(playersData);
      setChallenge(challengeData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch game state");
    } finally {
      setIsLoading(false);
    }
  }, [roomId]);

  useEffect(() => {
    fetchState();
    const interval = setInterval(fetchState, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchState]);

  return { room, players, challenge, isLoading, error, refetch: fetchState };
}

export function useRoomList() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRooms = useCallback(async () => {
    try {
      const totalRooms = await readContract<number>("get_total_rooms");
      const roomPromises = [];
      // Fetch the last 20 rooms (most recent)
      const start = Math.max(0, totalRooms - 20);
      for (let i = start; i < totalRooms; i++) {
        roomPromises.push(readContract<Room>("get_room", [BigInt(i)]));
      }
      const allRooms = await Promise.all(roomPromises);
      // Show open rooms first, then recently finished
      setRooms(allRooms.reverse());
    } catch {
      setRooms([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRooms();
    const interval = setInterval(fetchRooms, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchRooms]);

  return { rooms, isLoading, refetch: fetchRooms };
}
