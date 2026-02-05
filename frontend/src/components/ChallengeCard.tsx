"use client";

interface ChallengeCardProps {
  challenge: string;
  roundNumber: number;
}

export function ChallengeCard({ challenge, roundNumber }: ChallengeCardProps) {
  return (
    <div className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-xl p-6 text-white shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium uppercase tracking-wider text-primary-200">
          Round {roundNumber} of 3
        </span>
        <span className="text-xs bg-white/20 rounded-full px-2 py-0.5">
          Challenge
        </span>
      </div>
      <p className="text-lg font-medium leading-relaxed">{challenge}</p>
    </div>
  );
}
