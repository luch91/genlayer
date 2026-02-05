import { createClient, createAccount, generatePrivateKey } from "genlayer-js";
import { localnet, studionet, testnetAsimov } from "genlayer-js/chains";
import * as fs from "fs";
import * as path from "path";

const CHAINS: Record<string, any> = {
  localnet,
  studionet,
  testnetAsimov,
};

const KEY_FILE = path.resolve(__dirname, "../.deploy-key");

function getOrCreatePrivateKey(): `0x${string}` {
  if (fs.existsSync(KEY_FILE)) {
    return fs.readFileSync(KEY_FILE, "utf-8").trim() as `0x${string}`;
  }
  const pk = generatePrivateKey();
  fs.writeFileSync(KEY_FILE, pk, "utf-8");
  console.log("Generated new deploy key (saved to .deploy-key)");
  return pk;
}

async function requestFaucet(address: string): Promise<boolean> {
  console.log(`  Requesting testnet GEN tokens from faucet...`);
  try {
    const res = await fetch("https://genlayer-faucet.vercel.app/api/faucet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        address,
        network: "Genlayer Testnet",
        token: "GEN",
        turnstileToken: "",
      }),
    });
    const body = await res.text();
    if (res.ok) {
      console.log(`  Faucet response: ${body}`);
      return true;
    } else {
      console.warn(`  Faucet returned ${res.status}: ${body}`);
      return false;
    }
  } catch (err) {
    console.warn(`  Faucet request failed:`, err);
    return false;
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function deploy() {
  const privateKey = getOrCreatePrivateKey();
  const account = createAccount(privateKey);

  const networkName = process.env.GENLAYER_NETWORK || "testnetAsimov";
  const chain = CHAINS[networkName];
  if (!chain) {
    console.error(
      `Unknown network: ${networkName}. Valid: ${Object.keys(CHAINS).join(", ")}`
    );
    process.exit(1);
  }

  const client = createClient({ chain, account });

  // Ensure consensus contract is initialized before deploying
  if (networkName !== "testnetAsimov") {
    await client.initializeConsensusSmartContract(true);
  }

  console.log(`Deploying PromptDuel contract...`);
  console.log(`  Network: ${networkName}`);
  console.log(`  Account: ${account.address}`);

  // Request faucet tokens on testnet
  if (networkName === "testnetAsimov") {
    const faucetOk = await requestFaucet(account.address);
    if (faucetOk) {
      console.log(`  Waiting 15s for faucet tokens to arrive...`);
      await sleep(15000);
    }
  }

  const contractPath = path.resolve(__dirname, "../contracts/prompt_duel.py");
  const code = fs.readFileSync(contractPath, "utf-8");

  const seed = parseInt(process.env.CHALLENGE_SEED || "0", 10);
  console.log(`  Challenge seed: ${seed}`);

  const tx = await client.deployContract({
    account,
    code,
    args: [seed],
  });

  console.log(`  Transaction hash: ${tx}`);
  console.log(`  Waiting for acceptance...`);

  const receipt = await client.waitForTransactionReceipt({
    hash: tx,
    status: "ACCEPTED" as any,
  });

  console.log(`\nContract deployed successfully!`);
  console.log(`  Result:`, JSON.stringify(receipt, null, 2));
  console.log(
    `\nSet this in frontend/.env:\n  NEXT_PUBLIC_CONTRACT_ADDRESS=<address from result above>`
  );
}

deploy().catch((err) => {
  console.error("Deployment failed:", err);
  process.exit(1);
});
