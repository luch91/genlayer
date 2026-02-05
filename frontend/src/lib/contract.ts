import { getClient, getContractAddress } from "./client";
import type { CalldataEncodable } from "genlayer-js/types";
import { TransactionStatus } from "genlayer-js/types";

// Transaction status mapping (based on GenLayer SDK)
const TX_STATUS_NAMES: Record<number, string> = {
  0: "PENDING",
  1: "CANCELED",
  2: "PROPOSING",
  3: "COMMITTING",
  4: "REVEALING",
  5: "ACCEPTED",
  6: "FINALIZED",
  7: "UNDETERMINED",
};

// Check status of a pending transaction
export async function checkTransactionStatus(hash: string): Promise<{
  status: string;
  statusCode?: number;
  data?: unknown;
  error?: string;
}> {
  const client = getClient();
  if (!client) return { status: "unknown", error: "Client not initialized" };

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tx = await client.getTransaction({ hash: hash as any });
    console.log("Transaction status check:", tx);
    const rawStatus = tx?.status;
    const statusCode = typeof rawStatus === "number" ? rawStatus : -1;
    const statusName = TX_STATUS_NAMES[statusCode] || `UNKNOWN(${rawStatus})`;
    return {
      status: statusName,
      statusCode,
      data: tx,
    };
  } catch (error) {
    console.error("Error checking transaction:", error);
    return {
      status: "error",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Convert BigInt values to numbers and Map to plain objects recursively
function convertBigInts(obj: unknown): unknown {
  if (typeof obj === "bigint") {
    return Number(obj);
  }
  // Handle Map objects (GenLayer SDK returns Maps for dict responses)
  if (obj instanceof Map) {
    const result: Record<string, unknown> = {};
    for (const [key, value] of obj.entries()) {
      result[key] = convertBigInts(value);
    }
    return result;
  }
  if (Array.isArray(obj)) {
    return obj.map(convertBigInts);
  }
  if (obj !== null && typeof obj === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = convertBigInts(value);
    }
    return result;
  }
  return obj;
}

export async function readContract<T>(
  functionName: string,
  args: unknown[] = []
): Promise<T> {
  const client = getClient();
  if (!client) throw new Error("Client not initialized");

  const result = await client.readContract({
    address: getContractAddress() as `0x${string}`,
    functionName,
    args: args as CalldataEncodable[],
  });

  console.log(`readContract ${functionName} raw result:`, result);
  const converted = convertBigInts(result);
  console.log(`readContract ${functionName} converted:`, converted);
  return converted as T;
}

export async function writeContract(
  functionName: string,
  args: unknown[] = [],
  options: { longTimeout?: boolean; fireAndForget?: boolean } = {}
): Promise<string> {
  const client = getClient();
  if (!client) throw new Error("Client not initialized");

  const contractAddress = getContractAddress();
  if (!contractAddress) throw new Error("Contract address not configured");

  console.log("writeContract:", { functionName, args, contractAddress });

  // Disable fire-and-forget for debugging - we need to see actual errors
  const fireAndForget = options.fireAndForget ?? false;

  // Use longer timeouts for LLM operations
  const isLLMOperation = functionName === "score_round";
  const retries = isLLMOperation || options.longTimeout ? 150 : 30; // 5 minutes for LLM ops
  const interval = 2000;

  console.log(`writeContract config: fireAndForget=${fireAndForget}, retries=${retries}, timeout=${retries * interval / 1000}s`);

  try {
    console.log("Submitting transaction to GenLayer...");
    const tx = await client.writeContract({
      address: contractAddress as `0x${string}`,
      functionName,
      args: args as CalldataEncodable[],
      value: BigInt(0),
    });

    console.log("Transaction hash returned:", tx);

    // Immediately verify the transaction exists
    try {
      const txCheck = await client.getTransaction({ hash: tx });
      console.log("Transaction verification:", txCheck);
      if (!txCheck) {
        console.warn("WARNING: Transaction not found immediately after submission!");
      }
    } catch (verifyError) {
      console.warn("Could not verify transaction:", verifyError);
    }

    // For fire-and-forget mode, return early
    if (fireAndForget) {
      console.log("Transaction submitted in fire-and-forget mode. Polling will detect state changes.");
      if (typeof window !== "undefined") {
        const pendingTxs = JSON.parse(localStorage.getItem("pending-txs") || "[]");
        pendingTxs.push({ hash: tx, functionName, timestamp: Date.now() });
        localStorage.setItem("pending-txs", JSON.stringify(pendingTxs.slice(-10)));
      }
      return tx;
    }

    // Wait for the transaction to be accepted
    console.log(`Waiting for transaction receipt (up to ${retries * interval / 1000}s)...`);
    const receipt = await client.waitForTransactionReceipt({
      hash: tx,
      status: TransactionStatus.ACCEPTED,
      interval,
      retries,
    });

    console.log("Transaction accepted:", receipt);
    console.log("Transaction status:", receipt.status);
    console.log("Transaction data:", JSON.stringify(receipt.data, null, 2));
    console.log("Transaction consensus_data:", JSON.stringify(receipt.consensus_data, null, 2));

    // Check if the transaction had an error
    if (receipt.consensus_data?.leader_receipt?.[0]?.error) {
      const errorMsg = receipt.consensus_data.leader_receipt[0].error;
      console.error("Contract execution error:", errorMsg);
      throw new Error(`Contract execution error: ${errorMsg}`);
    }

    // Give the state time to propagate after acceptance
    await new Promise((resolve) => setTimeout(resolve, 2000));

    return tx;
  } catch (error) {
    console.error("writeContract error details:", {
      error,
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw error;
  }
}
