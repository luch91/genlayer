import { createClient, createAccount, generatePrivateKey } from "genlayer-js";
import { localnet, studionet, testnetAsimov } from "genlayer-js/chains";

const PRIVATE_KEY_STORAGE_KEY = "prompt-duel-private-key";

const CHAINS: Record<string, any> = {
  localnet,
  studionet,
  testnetAsimov,
};

function getOrCreatePrivateKey(): string {
  if (typeof window === "undefined") return "";
  let pk = localStorage.getItem(PRIVATE_KEY_STORAGE_KEY);
  if (!pk) {
    pk = generatePrivateKey();
    localStorage.setItem(PRIVATE_KEY_STORAGE_KEY, pk);
  }
  return pk;
}

export function getAccount() {
  const pk = getOrCreatePrivateKey();
  if (!pk) return null;
  return createAccount(pk as `0x${string}`);
}

export function getClient() {
  const account = getAccount();
  if (!account) return null;

  const networkName = process.env.NEXT_PUBLIC_GENLAYER_NETWORK || "localnet";
  const chain = CHAINS[networkName] || localnet;

  return createClient({
    chain,
    account,
  });
}

export function getContractAddress(): string {
  return process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "";
}
