# Prompt Duel

A multiplayer prompt engineering mini-game built on **GenLayer**. Players compete in rooms to craft the best AI prompt for a given challenge. Prompts are scored by LLM consensus through GenLayer's **Intelligent Contracts** and **Optimistic Democracy**.

## How It Works

1. **Create or join a room** (2-6 players)
2. **A challenge is revealed** each round (e.g., "Write a prompt that generates the most creative haiku about decentralization")
3. **Write your best prompt** within the time limit
4. **LLM scoring via on-chain consensus** — validators independently evaluate all prompts and reach agreement through Optimistic Democracy
5. **3 rounds**, then XP is distributed based on final standings

### GenLayer Features Showcased

- **Intelligent Contracts**: The entire game logic runs as a Python contract on GenLayer's blockchain
- **Optimistic Democracy**: Prompt scoring uses `eq_principle.prompt_non_comparative` — validators evaluate scores against clear criteria without needing identical LLM outputs
- **LLM Integration**: `gl.nondet.exec_prompt` is used within the equivalence principle to score prompts on creativity, relevance, and quality

## Project Structure

```
prompt-duel/
├── contracts/
│   └── prompt_duel.py           # Intelligent Contract
├── deploy/
│   └── deployScript.ts          # Deployment script
├── frontend/                    # Next.js 15 + Tailwind CSS
│   └── src/
│       ├── app/                 # Pages (lobby, room, leaderboard)
│       ├── components/          # UI components
│       ├── hooks/               # React hooks
│       ├── lib/                 # GenLayer client + helpers
│       └── types/               # TypeScript types
├── test/
│   └── test_prompt_duel.py      # Integration tests
├── package.json
├── requirements.txt
└── tsconfig.json
```

## Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [GenLayer CLI](https://docs.genlayer.com/) (`npm install -g genlayer`)
- [GenLayer Studio](https://studio.genlayer.com/) (local or hosted)
- Python 3.10+ (for contract testing)

## Setup

### 1. Install dependencies

```bash
npm install
cd frontend && npm install
```

### 2. Start GenLayer Studio

Either use the hosted version at [studio.genlayer.com](https://studio.genlayer.com) or run locally.

### 3. Deploy the contract

```bash
# Select your network
genlayer network localnet  # or studionet, testnet-asimov

# Deploy
npm run deploy
```

Copy the contract address from the output.

### 4. Configure the frontend

```bash
cp frontend/.env.example frontend/.env
```

Edit `frontend/.env`:
```
NEXT_PUBLIC_CONTRACT_ADDRESS=<your_contract_address>
NEXT_PUBLIC_GENLAYER_NETWORK=localnet
```

### 5. Start the frontend

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Running Tests

```bash
pip install -r requirements.txt
npm run test
```

## Game Design

### Challenge Themes

Challenges rotate weekly via a seed parameter. Each game has 3 rounds with a different challenge per round. Themes include:

- Creative writing (haiku, poetry, stories)
- Persuasive arguments (AI consensus, digital trust)
- Technical communication (ELI5, metaphors, pitches)
- Humor (one-liners, funny scenarios)

### Scoring

The Intelligent Contract uses `gl.eq_principle.prompt_non_comparative` to score prompts:

- **Creativity** (30%): How original and clever is the prompt?
- **Relevance** (30%): How well does it address the challenge?
- **Quality** (40%): How good would the LLM output be?

Validators independently evaluate the scoring through Optimistic Democracy consensus.

### XP Distribution

After 3 rounds, XP is awarded based on total score ranking:

| Place | XP |
|-------|-----|
| 1st   | 100 |
| 2nd   | 60  |
| 3rd   | 30  |
| 4th+  | 10  |

## License

MIT
