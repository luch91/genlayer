"use client";

import { useParams } from "next/navigation";
import { useState, useCallback, useEffect } from "react";
import { useGenLayer } from "@/hooks/useGenLayer";
import { useGameState } from "@/hooks/useGameState";
import { writeContract, checkTransactionStatus } from "@/lib/contract";
import { getGamePhase, canForceScore } from "@/types/game";
import { ChallengeCard } from "@/components/ChallengeCard";
import { PromptInput } from "@/components/PromptInput";
import { GameTimer } from "@/components/GameTimer";
import { RoundResults } from "@/components/RoundResults";
import { Scoreboard } from "@/components/Scoreboard";

export default function RoomPage() {
  const params = useParams();
  const roomId = Number(params.id);
  const { address } = useGenLayer();
  const { room, players, challenge, isLoading, error, refetch } =
    useGameState(roomId);

  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [scoringPending, setScoringPending] = useState(false);
  const [pendingTxHash, setPendingTxHash] = useState<string | null>(null);
  const [txStatus, setTxStatus] = useState<string | null>(null);

  // Check if scoring completed (is_scored changed to true)
  useEffect(() => {
    if (room?.is_scored && scoringPending) {
      setScoringPending(false);
      console.log("Scoring completed! is_scored is now true.");
    }
  }, [room?.is_scored, scoringPending]);

  const doAction = useCallback(
    async (name: string, fn: string, args: unknown[]) => {
      setActionLoading(name);
      setActionError(null);
      try {
        // For score_round, mark as pending (fire-and-forget mode)
        if (fn === "score_round") {
          setScoringPending(true);
          setTxStatus(null);
        }
        const txHash = await writeContract(fn, args);
        if (fn === "score_round") {
          setPendingTxHash(txHash);
        }
        await refetch();
      } catch (err) {
        setActionError(
          err instanceof Error ? err.message : `Failed to ${name}`
        );
        if (fn === "score_round") {
          setScoringPending(false);
        }
      } finally {
        setActionLoading(null);
      }
    },
    [refetch]
  );

  // Function to check pending transaction status
  const checkPendingTx = useCallback(async () => {
    if (!pendingTxHash) return;
    const result = await checkTransactionStatus(pendingTxHash);
    setTxStatus(result.status);
    console.log("Transaction status:", result);
  }, [pendingTxHash]);

  if (isLoading || !room) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        {error ? (
          <div className="text-center">
            <div className="text-red-500 font-medium mb-2">Failed to load room</div>
            <p className="text-gray-500 text-sm">{error}</p>
          </div>
        ) : (
          <>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mb-4" />
            <p className="text-gray-500">Loading room...</p>
          </>
        )}
      </div>
    );
  }

  const phase = getGamePhase(room);
  // Case-insensitive address comparison (Ethereum addresses can have different casing)
  const isCreator = address?.toLowerCase() === room.creator?.toLowerCase();
  const currentPlayer = players.find((p) => p.address?.toLowerCase() === address?.toLowerCase());
  const isInRoom = !!currentPlayer;

  return (
    <div className="space-y-6">
      {/* Room Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Room #{room.room_id}
          </h1>
          <p className="text-sm text-gray-500">
            {room.player_count}/{room.max_players} players
            {phase !== "lobby" && phase !== "finished" && (
              <span className="ml-2">
                &middot; Round {room.current_round}/3
              </span>
            )}
          </p>
        </div>
        {phase === "prompting" && (
          <GameTimer durationSeconds={120} isActive={true} />
        )}
      </div>

      {actionError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">
          {actionError}
        </div>
      )}

      {/* ── LOBBY ── */}
      {phase === "lobby" && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
            <h2 className="font-semibold text-gray-900 mb-3">
              Waiting for players...
            </h2>
            <div className="space-y-2">
              {players.map((p) => (
                <div
                  key={p.index}
                  className="flex items-center gap-2 text-sm text-gray-700"
                >
                  <span className="w-2 h-2 bg-green-400 rounded-full" />
                  {p.address.slice(0, 10)}...{p.address.slice(-4)}
                  {p.address?.toLowerCase() === room.creator?.toLowerCase() && (
                    <span className="text-xs text-primary-600 font-medium">
                      (host)
                    </span>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-4 flex gap-3">
              {!isInRoom && room.player_count < room.max_players && (
                <button
                  onClick={() => doAction("join", "join_room", [BigInt(roomId)])}
                  disabled={actionLoading === "join"}
                  className="bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white font-medium py-2 px-6 rounded-lg transition-colors"
                >
                  {actionLoading === "join" ? "Joining..." : "Join Room"}
                </button>
              )}
              {isCreator && room.player_count >= 2 && (
                <button
                  onClick={() =>
                    doAction("start", "start_game", [BigInt(roomId)])
                  }
                  disabled={actionLoading === "start"}
                  className="bg-accent-500 hover:bg-accent-600 disabled:bg-gray-400 text-white font-medium py-2 px-6 rounded-lg transition-colors"
                >
                  {actionLoading === "start" ? "Starting..." : "Start Game"}
                </button>
              )}
              {isInRoom && !isCreator && room.player_count >= 2 && (
                <p className="text-sm text-gray-500 italic">
                  Waiting for host to start the game...
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── PROMPTING PHASE ── */}
      {phase === "prompting" && (
        <div className="space-y-4">
          <ChallengeCard
            challenge={challenge}
            roundNumber={room.current_round}
          />
          <div className="text-sm text-gray-500 text-center">
            {room.prompts_submitted}/{room.player_count} prompts submitted
          </div>
          {isInRoom && (
            <PromptInput
              roomId={roomId}
              hasSubmitted={currentPlayer?.has_submitted ?? false}
              onSubmitted={refetch}
            />
          )}
          {/* Waiting indicator when player has submitted */}
          {currentPlayer?.has_submitted && room.prompts_submitted < room.player_count && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center gap-2 text-blue-700 font-medium mb-1">
                <svg className="animate-pulse h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                Waiting for other players...
              </div>
              <p className="text-sm text-blue-600">
                {room.prompts_submitted}/{room.player_count} players have submitted
              </p>
            </div>
          )}
          {/* Force Score button - score with partial submissions */}
          {canForceScore(room) && isInRoom && !scoringPending && (
            <div className="text-center pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-500 mb-2">
                Not all players submitted? Score with current submissions.
              </p>
              <button
                onClick={() =>
                  doAction("score", "score_round", [BigInt(roomId)])
                }
                disabled={actionLoading === "score"}
                className="bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white font-medium py-2 px-6 rounded-lg transition-colors"
              >
                {actionLoading === "score"
                  ? "Submitting scoring request..."
                  : "Score Now (Skip Waiting)"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── SCORING PHASE (all submitted, waiting for score) ── */}
      {phase === "scoring" && (
        <div className="space-y-4">
          <ChallengeCard
            challenge={challenge}
            roundNumber={room.current_round}
          />
          {scoringPending ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
              <div className="flex items-center justify-center gap-2 text-yellow-700 font-medium mb-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                LLM Scoring in Progress
              </div>
              <p className="text-sm text-yellow-600">
                Validators are running AI consensus via Optimistic Democracy.
                <br />
                This typically takes 2-5 minutes. The page will auto-update when complete.
              </p>
              {pendingTxHash && (
                <div className="mt-3 pt-3 border-t border-yellow-200">
                  <p className="text-xs text-yellow-600 font-mono break-all">
                    TX: {pendingTxHash}
                  </p>
                  <div className="flex items-center justify-center gap-2 mt-2">
                    <button
                      onClick={checkPendingTx}
                      className="text-xs bg-yellow-200 hover:bg-yellow-300 text-yellow-800 px-3 py-1 rounded"
                    >
                      Check Status
                    </button>
                    {txStatus && (
                      <span className="text-xs font-medium text-yellow-800">
                        Status: {txStatus}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-yellow-500 mt-2">
                    Check logs in{" "}
                    <a
                      href="https://studio.genlayer.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:text-yellow-700"
                    >
                      GenStudio
                    </a>
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-md border border-gray-100 p-8 text-center">
              <div className="animate-pulse text-primary-600 font-medium mb-2">
                All prompts submitted!
              </div>
              <p className="text-sm text-gray-500 mb-4">
                Trigger LLM scoring via Optimistic Democracy consensus.
              </p>
              <button
                onClick={() =>
                  doAction("score", "score_round", [BigInt(roomId)])
                }
                disabled={actionLoading === "score"}
                className="bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white font-medium py-2 px-6 rounded-lg transition-colors"
              >
                {actionLoading === "score"
                  ? "Submitting scoring request..."
                  : "Score Round"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── RESULTS PHASE ── */}
      {phase === "results" && (
        <div className="space-y-4">
          <RoundResults
            players={players}
            roundNumber={room.current_round}
          />
          <div className="text-center">
            <button
              onClick={() =>
                doAction("advance", "advance_round", [BigInt(roomId)])
              }
              disabled={actionLoading === "advance"}
              className="bg-accent-500 hover:bg-accent-600 disabled:bg-gray-400 text-white font-medium py-2 px-6 rounded-lg transition-colors"
            >
              {actionLoading === "advance"
                ? "Advancing..."
                : room.current_round >= 3
                ? "Finish Game & Distribute XP"
                : `Next Round (${room.current_round + 1}/3)`}
            </button>
          </div>
        </div>
      )}

      {/* ── FINISHED ── */}
      {phase === "finished" && (
        <div className="space-y-4">
          <div className="text-center bg-gradient-to-r from-primary-50 to-accent-50 rounded-xl p-6 border border-primary-100">
            <div className="text-4xl mb-2">🏆</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">
              Game Over!
            </h2>
            <p className="text-gray-600">
              XP has been distributed based on performance.
            </p>
            {currentPlayer && (
              <div className="mt-4 inline-block bg-white rounded-lg px-4 py-2 shadow-sm">
                <p className="text-sm text-gray-500">Your final score</p>
                <p className="text-2xl font-bold text-primary-600">
                  {currentPlayer.total_score} pts
                </p>
                <p className="text-xs text-gray-400">
                  {currentPlayer.rounds_participated}/3 rounds played
                </p>
              </div>
            )}
          </div>
          <Scoreboard players={players} />
          <div className="text-center pt-4">
            <a
              href="/"
              className="inline-block bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
            >
              Back to Lobby
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
