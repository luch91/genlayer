// Mirror of the challenge sets in the contract for client-side display.
// These must stay in sync with contracts/prompt_duel.py CHALLENGES.

export const CHALLENGES = [
  [
    "Write a prompt that generates the most creative haiku about decentralization",
    "Write a prompt that produces the most convincing argument for why AI needs consensus",
    "Write a prompt that creates the funniest story about validators disagreeing",
  ],
  [
    "Write a prompt that generates the best metaphor for blockchain technology",
    "Write a prompt that produces the most insightful analysis of digital trust",
    "Write a prompt that creates the most engaging tweet about Web3",
  ],
  [
    "Write a prompt that generates the most poetic description of a smart contract",
    "Write a prompt that produces the best ELI5 explanation of consensus mechanisms",
    "Write a prompt that creates the most creative use case for AI on-chain",
  ],
  [
    "Write a prompt that makes an LLM produce the wittiest one-liner about crypto culture",
    "Write a prompt that generates the most thought-provoking question about machine intelligence",
    "Write a prompt that creates the most compelling pitch for a decentralized social network",
  ],
  [
    "Write a prompt that generates the most vivid analogy for how validators reach agreement",
    "Write a prompt that produces the most entertaining dialogue between two AIs debating free will",
    "Write a prompt that creates the best recipe metaphor for building a dApp",
  ],
  [
    "Write a prompt that generates the most inspiring vision of the internet in 2035",
    "Write a prompt that produces the most creative acronym for BLOCKCHAIN with definitions",
    "Write a prompt that creates the most dramatic movie trailer synopsis for a film about AI consensus",
  ],
];

export function getChallengeText(
  seed: number,
  roundNum: number
): string {
  const themeIdx = seed % CHALLENGES.length;
  const roundIdx = roundNum - 1;
  return (
    CHALLENGES[themeIdx]?.[roundIdx] ??
    "Write the most creative prompt you can think of"
  );
}
