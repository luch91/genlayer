# { "Depends": "py-genlayer:test" }

import json
from dataclasses import dataclass
from genlayer import *


# ── Challenge theme sets (rotated via room seed) ──────────────────────────
# Each theme has 3 challenges (one per round)
# Categories: Creative Writing, Technical, Humor, Visual Description, Roleplay, Strategy

CHALLENGES = [
    # Theme 0: Blockchain & Decentralization
    [
        "Write a prompt that generates the most creative haiku about decentralization",
        "Write a prompt that produces the most convincing argument for why AI needs consensus",
        "Write a prompt that creates the funniest story about validators disagreeing",
    ],
    # Theme 1: Web3 & Digital Trust
    [
        "Write a prompt that generates the best metaphor for blockchain technology",
        "Write a prompt that produces the most insightful analysis of digital trust",
        "Write a prompt that creates the most engaging tweet about Web3",
    ],
    # Theme 2: Smart Contracts & On-chain AI
    [
        "Write a prompt that generates the most poetic description of a smart contract",
        "Write a prompt that produces the best ELI5 explanation of consensus mechanisms",
        "Write a prompt that creates the most creative use case for AI on-chain",
    ],
    # Theme 3: Crypto Culture & Social
    [
        "Write a prompt that makes an LLM produce the wittiest one-liner about crypto culture",
        "Write a prompt that generates the most thought-provoking question about machine intelligence",
        "Write a prompt that creates the most compelling pitch for a decentralized social network",
    ],
    # Theme 4: Analogies & Dialogues
    [
        "Write a prompt that generates the most vivid analogy for how validators reach agreement",
        "Write a prompt that produces the most entertaining dialogue between two AIs debating free will",
        "Write a prompt that creates the best recipe metaphor for building a dApp",
    ],
    # Theme 5: Future Vision & Media
    [
        "Write a prompt that generates the most inspiring vision of the internet in 2035",
        "Write a prompt that produces the most creative acronym for BLOCKCHAIN with definitions",
        "Write a prompt that creates the most dramatic movie trailer synopsis for a film about AI consensus",
    ],
    # Theme 6: Image Description Challenges (describe what an AI image generator should create)
    [
        "Write an image generation prompt for: 'A cyberpunk city where smart contracts are visualized as neon streams'",
        "Write an image generation prompt for: 'The moment when distributed validators reach consensus, depicted as a cosmic event'",
        "Write an image generation prompt for: 'A surreal artwork showing the journey of a transaction through a blockchain'",
    ],
    # Theme 7: Character & Roleplay
    [
        "Write a prompt that makes the AI roleplay as a wise ancient oracle explaining NFTs to a medieval king",
        "Write a prompt that creates a conversation between Satoshi Nakamoto and a time traveler from 2050",
        "Write a prompt where the AI acts as a blockchain transaction narrating its own journey",
    ],
    # Theme 8: Code & Technical Poetry
    [
        "Write a prompt that generates a love letter written in the style of smart contract code comments",
        "Write a prompt that creates a rap battle between Proof of Work and Proof of Stake",
        "Write a prompt that produces a Shakespearean sonnet about gas fees",
    ],
    # Theme 9: Memes & Viral Content
    [
        "Write a prompt that generates the most viral-worthy crypto meme concept",
        "Write a prompt that creates a TikTok script explaining DeFi in 60 seconds",
        "Write a prompt that produces the funniest crypto-themed fortune cookie messages",
    ],
    # Theme 10: World Building
    [
        "Write a prompt that describes a day in the life of someone in a fully decentralized society",
        "Write a prompt that creates the constitution for a new DAO nation",
        "Write a prompt that generates a news article from the year 2100 about blockchain archaeology",
    ],
    # Theme 11: Emotional & Philosophical
    [
        "Write a prompt that makes an AI express what it would feel like to achieve true decentralization",
        "Write a prompt exploring the ethics of AI making financial decisions for humans",
        "Write a prompt that generates a meditation guide themed around blockchain immutability",
    ],
    # Theme 12: Games & Interactive
    [
        "Write a prompt that creates a text adventure game set in a metaverse",
        "Write a prompt that generates riddles where the answers are crypto/blockchain terms",
        "Write a prompt that designs a party game explaining tokenomics to newcomers",
    ],
    # Theme 13: Brand & Marketing
    [
        "Write a prompt that creates a Super Bowl commercial script for a fictional blockchain",
        "Write a prompt that generates a catchy jingle for a crypto wallet app",
        "Write a prompt that produces taglines for 'Trust' as if it were a tech startup",
    ],
    # Theme 14: Education & Explanation
    [
        "Write a prompt that explains zero-knowledge proofs using only food analogies",
        "Write a prompt that teaches layer-2 scaling through a children's bedtime story",
        "Write a prompt that creates a comic strip dialogue explaining MEV (Maximal Extractable Value)",
    ],
    # Theme 15: Absurdist & Surreal
    [
        "Write a prompt where blockchain concepts are explained by confused aliens",
        "Write a prompt that generates a cooking show hosted by smart contracts",
        "Write a prompt creating a nature documentary about 'validators in their natural habitat'",
    ],
]

TOTAL_ROUNDS: int = 3
MIN_PLAYERS: int = 2
MAX_PLAYERS_LIMIT: int = 6

# XP rewards by final placement
XP_REWARDS = [100, 60, 30, 10, 10, 10]


# ── Storage data classes ────────────────────────────────────────────────────


@allow_storage
@dataclass
class RoomPlayer:
    address: Address
    prompt: str
    round_score: u32
    total_score: u32
    has_submitted: bool
    rounds_participated: u32  # Track how many rounds the player actually submitted in


@allow_storage
@dataclass
class Room:
    room_id: u32
    creator: Address
    current_round: u32  # 0=lobby, 1-3=active rounds, 4=finished
    challenge_seed: u32
    player_count: u32
    max_players: u32
    prompts_submitted: u32
    is_scored: bool


# ── Main Contract ───────────────────────────────────────────────────────────


class PromptDuel(gl.Contract):
    next_room_id: u32
    rooms: TreeMap[u32, Room]
    # Use composite string keys: "room_id:player_index" and "room_id:address"
    room_players: TreeMap[str, RoomPlayer]
    room_player_index: TreeMap[str, u32]
    global_xp: TreeMap[Address, u32]
    challenge_seed: u32

    def __init__(self, seed: u32):
        self.next_room_id = 0
        self.challenge_seed = seed

    # ── Helper methods for composite keys ────────────────────────────────
    def _player_key(self, room_id: u32, player_idx: u32) -> str:
        return f"{room_id}:{player_idx}"

    def _index_key(self, room_id: u32, address: Address) -> str:
        return f"{room_id}:{str(address)}"

    # ── Room Management ─────────────────────────────────────────────────

    @gl.public.write
    def create_room(self, max_players: u32) -> u32:
        if max_players < MIN_PLAYERS or max_players > MAX_PLAYERS_LIMIT:
            raise Exception(
                f"max_players must be between {MIN_PLAYERS} and {MAX_PLAYERS_LIMIT}"
            )

        room_id = self.next_room_id
        self.next_room_id += 1

        # Each room gets a unique seed based on global seed + room_id
        # This ensures different rooms get different challenge themes
        room_seed = (self.challenge_seed + room_id) % len(CHALLENGES)

        self.rooms[room_id] = Room(
            room_id=room_id,
            creator=gl.message.sender_address,
            current_round=0,
            challenge_seed=room_seed,
            player_count=1,
            max_players=max_players,
            prompts_submitted=0,
            is_scored=False,
        )

        # Use composite keys for player storage
        player_key = self._player_key(room_id, 0)
        index_key = self._index_key(room_id, gl.message.sender_address)

        self.room_players[player_key] = RoomPlayer(
            address=gl.message.sender_address,
            prompt="",
            round_score=0,
            total_score=0,
            has_submitted=False,
            rounds_participated=0,
        )
        self.room_player_index[index_key] = 0

        return room_id

    @gl.public.write
    def join_room(self, room_id: u32):
        room = self.rooms[room_id]
        if room.current_round != 0:
            raise Exception("Game already started")
        if room.player_count >= room.max_players:
            raise Exception("Room is full")

        sender = gl.message.sender_address
        # Check not already in room using composite key
        index_key = self._index_key(room_id, sender)
        existing = self.room_player_index.get(index_key, None)
        if existing is not None:
            raise Exception("Already in this room")

        idx = room.player_count
        player_key = self._player_key(room_id, idx)

        self.room_players[player_key] = RoomPlayer(
            address=sender,
            prompt="",
            round_score=0,
            total_score=0,
            has_submitted=False,
            rounds_participated=0,
        )
        self.room_player_index[index_key] = idx
        self.rooms[room_id].player_count = idx + 1

    @gl.public.write
    def start_game(self, room_id: u32):
        room = self.rooms[room_id]
        # Only the room creator can start the game
        if room.creator != gl.message.sender_address:
            raise Exception("Only the room creator can start the game")
        if room.current_round != 0:
            raise Exception("Game already started")
        if room.player_count < MIN_PLAYERS:
            raise Exception(f"Need at least {MIN_PLAYERS} players to start")

        self.rooms[room_id].current_round = 1
        self.rooms[room_id].prompts_submitted = 0
        self.rooms[room_id].is_scored = False

    # ── Gameplay ────────────────────────────────────────────────────────

    @gl.public.write
    def submit_prompt(self, room_id: u32, prompt: str):
        room = self.rooms[room_id]
        if room.current_round < 1 or room.current_round > TOTAL_ROUNDS:
            raise Exception("Game is not in an active round")

        sender = gl.message.sender_address
        index_key = self._index_key(room_id, sender)
        player_idx_val = self.room_player_index.get(index_key, None)
        if player_idx_val is None:
            raise Exception("Not a player in this room")
        player_idx = player_idx_val

        player_key = self._player_key(room_id, player_idx)
        player = self.room_players[player_key]
        if player.has_submitted:
            raise Exception("Already submitted a prompt this round")

        if len(prompt.strip()) == 0:
            raise Exception("Prompt cannot be empty")
        if len(prompt) > 1000:
            raise Exception("Prompt must be 1000 characters or fewer")

        self.room_players[player_key].prompt = prompt
        self.room_players[player_key].has_submitted = True
        self.room_players[player_key].rounds_participated += 1
        self.rooms[room_id].prompts_submitted = room.prompts_submitted + 1

    @gl.public.write
    def score_round(self, room_id: u32):
        room = gl.storage.copy_to_memory(self.rooms[room_id])
        if room.current_round < 1 or room.current_round > TOTAL_ROUNDS:
            raise Exception("No active round to score")
        if room.is_scored:
            raise Exception("Round already scored")
        # At least one player must submit before scoring
        if room.prompts_submitted == 0:
            raise Exception("At least one player must submit a prompt")

        # Gather submitted prompts (non-submitters get 0 points)
        challenge = _get_challenge_text(room.challenge_seed, room.current_round)
        player_prompts = []
        submitted_indices = []
        for i in range(room.player_count):
            player_key = self._player_key(room_id, i)
            p = gl.storage.copy_to_memory(self.room_players[player_key])
            if p.has_submitted and len(p.prompt.strip()) > 0:
                player_prompts.append({"index": i, "prompt": p.prompt})
                submitted_indices.append(i)
            else:
                # Players who didn't submit get 0 points
                self.room_players[player_key].round_score = 0

        num_submitted = len(player_prompts)

        # If only one player submitted, give them a fixed score (no LLM comparison needed)
        if num_submitted == 1:
            idx = player_prompts[0]["index"]
            player_key = self._player_key(room_id, idx)
            self.room_players[player_key].round_score = 70  # Default score for solo submission
            self.room_players[player_key].total_score += 70
            self.rooms[room_id].is_scored = True
            return

        # Build prompt text for LLM scoring
        prompts_text = "\n".join(
            [f"Player {pp['index']}: {pp['prompt']}" for pp in player_prompts]
        )

        # ── LLM Scoring via Optimistic Democracy consensus ──────────
        # Use coarse scoring (20-point increments) for better validator consensus
        scoring_result = gl.eq_principle.prompt_non_comparative(
            input=prompts_text,
            task=f"""Score these {num_submitted} prompts for the challenge: "{challenge}"

Use ONLY these scores: 20 (poor), 40 (below average), 60 (average), 80 (good), 100 (excellent).
Output JSON: {{"scores": [{{"player": 0, "score": 60}}, {{"player": 1, "score": 80}}]}}

Judge on: creativity, relevance to challenge, and quality. Return ONLY valid JSON.""",
            criteria="""Valid JSON with "scores" array. Each entry has "player" (int) and "score" (20, 40, 60, 80, or 100 only).""",
        )

        # Parse scores and update state
        results = json.loads(scoring_result)
        for entry in results["scores"]:
            idx = entry["player"]
            score = entry["score"]
            player_key = self._player_key(room_id, idx)
            self.room_players[player_key].round_score = score
            self.room_players[player_key].total_score += score

        self.rooms[room_id].is_scored = True

    @gl.public.write
    def score_round_quick(self, room_id: u32):
        """Quick scoring without LLM - uses prompt length as a simple heuristic."""
        room = gl.storage.copy_to_memory(self.rooms[room_id])
        if room.current_round < 1 or room.current_round > TOTAL_ROUNDS:
            raise Exception("No active round to score")
        if room.is_scored:
            raise Exception("Round already scored")
        if room.prompts_submitted == 0:
            raise Exception("At least one player must submit a prompt")

        # Gather submitted prompts
        player_prompts = []
        for i in range(room.player_count):
            player_key = self._player_key(room_id, i)
            p = gl.storage.copy_to_memory(self.room_players[player_key])
            if p.has_submitted and len(p.prompt.strip()) > 0:
                player_prompts.append({"index": i, "prompt": p.prompt, "length": len(p.prompt.strip())})
            else:
                self.room_players[player_key].round_score = 0

        if len(player_prompts) == 0:
            self.rooms[room_id].is_scored = True
            return

        # Simple scoring: base 50 + bonus based on prompt length (max 50 bonus)
        # Longer, more thoughtful prompts get higher scores
        max_len = max(pp["length"] for pp in player_prompts)
        for pp in player_prompts:
            # Score from 50-100 based on relative length
            length_ratio = pp["length"] / max_len if max_len > 0 else 1
            score = 50 + int(length_ratio * 50)
            # Round to nearest 10
            score = ((score + 5) // 10) * 10
            score = max(20, min(100, score))  # Clamp to 20-100

            player_key = self._player_key(room_id, pp["index"])
            self.room_players[player_key].round_score = score
            self.room_players[player_key].total_score += score

        self.rooms[room_id].is_scored = True

    @gl.public.write
    def advance_round(self, room_id: u32):
        room = self.rooms[room_id]
        if room.current_round < 1 or room.current_round > TOTAL_ROUNDS:
            raise Exception("No active round to advance from")
        if not room.is_scored:
            raise Exception("Current round has not been scored yet")

        if room.current_round >= TOTAL_ROUNDS:
            # Game over — distribute XP
            self._distribute_xp(room_id, room.player_count)
            self.rooms[room_id].current_round = TOTAL_ROUNDS + 1  # = 4 = finished
        else:
            # Move to next round
            self.rooms[room_id].current_round = room.current_round + 1
            self.rooms[room_id].prompts_submitted = 0
            self.rooms[room_id].is_scored = False
            # Reset per-round player state
            for i in range(room.player_count):
                player_key = self._player_key(room_id, i)
                self.room_players[player_key].prompt = ""
                self.room_players[player_key].round_score = 0
                self.room_players[player_key].has_submitted = False

    def _distribute_xp(self, room_id: u32, player_count: u32):
        # Collect (total_score, index) only for players who actually participated
        scores = []
        for i in range(player_count):
            player_key = self._player_key(room_id, i)
            p = self.room_players[player_key]
            # Only include players who submitted at least one prompt
            if p.rounds_participated > 0:
                scores.append((p.total_score, i))

        # If no one participated, no XP to distribute
        if len(scores) == 0:
            return

        # Simple insertion sort (max 6 players)
        for i in range(1, len(scores)):
            key = scores[i]
            j = i - 1
            while j >= 0 and scores[j][0] < key[0]:
                scores[j + 1] = scores[j]
                j -= 1
            scores[j + 1] = key

        # Award XP only to participants
        for rank, (total_score, player_idx) in enumerate(scores):
            player_key = self._player_key(room_id, player_idx)
            player = self.room_players[player_key]
            xp = XP_REWARDS[rank] if rank < len(XP_REWARDS) else 10
            current_xp = self.global_xp.get(player.address, 0)
            self.global_xp[player.address] = current_xp + xp

    # ── Admin ───────────────────────────────────────────────────────────

    @gl.public.write
    def update_seed(self, new_seed: u32):
        self.challenge_seed = new_seed

    # ── View Methods ────────────────────────────────────────────────────

    @gl.public.view
    def get_room(self, room_id: u32) -> dict:
        room = self.rooms[room_id]
        return {
            "room_id": room.room_id,
            "creator": str(room.creator),
            "current_round": room.current_round,
            "challenge_seed": room.challenge_seed,
            "player_count": room.player_count,
            "max_players": room.max_players,
            "prompts_submitted": room.prompts_submitted,
            "is_scored": room.is_scored,
        }

    @gl.public.view
    def get_room_players(self, room_id: u32) -> list:
        room = self.rooms[room_id]
        players = []
        for i in range(room.player_count):
            player_key = self._player_key(room_id, i)
            p = self.room_players[player_key]
            players.append(
                {
                    "index": i,
                    "address": str(p.address),
                    "prompt": p.prompt if room.is_scored else "",
                    "round_score": p.round_score,
                    "total_score": p.total_score,
                    "has_submitted": p.has_submitted,
                    "rounds_participated": p.rounds_participated,
                }
            )
        return players

    @gl.public.view
    def get_challenge(self, room_id: u32) -> str:
        room = self.rooms[room_id]
        if room.current_round < 1 or room.current_round > TOTAL_ROUNDS:
            return ""
        return _get_challenge_text(room.challenge_seed, room.current_round)

    @gl.public.view
    def get_leaderboard(self) -> list:
        entries = []
        for address in self.global_xp:
            xp = self.global_xp[address]
            entries.append({"address": str(address), "xp": xp})
        # Sort by XP descending
        for i in range(1, len(entries)):
            key = entries[i]
            j = i - 1
            while j >= 0 and entries[j]["xp"] < key["xp"]:
                entries[j + 1] = entries[j]
                j -= 1
            entries[j + 1] = key
        return entries[:20]  # top 20

    @gl.public.view
    def get_total_rooms(self) -> u32:
        return self.next_room_id

    @gl.public.view
    def get_player_xp(self, address: Address) -> u32:
        return self.global_xp.get(address, 0)


# ── Helper (module-level, deterministic) ────────────────────────────────────


def _get_challenge_text(seed: u32, round_num: u32) -> str:
    theme_idx = seed % len(CHALLENGES)
    round_idx = round_num - 1
    if round_idx < 0 or round_idx >= len(CHALLENGES[theme_idx]):
        return "Write the most creative prompt you can think of"
    return CHALLENGES[theme_idx][round_idx]
