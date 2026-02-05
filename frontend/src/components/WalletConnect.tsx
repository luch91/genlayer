"use client";

import { useGenLayer } from "@/hooks/useGenLayer";
import { useState } from "react";

export function WalletConnect() {
  const { address, isReady, resetAccount } = useGenLayer();
  const [copied, setCopied] = useState(false);

  if (!isReady) return null;

  const shortAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : "";

  const copyAddress = async () => {
    if (address) {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex items-center gap-3">
      {address ? (
        <>
          <button
            onClick={copyAddress}
            className="px-3 py-1.5 bg-primary-100 text-primary-800 rounded-lg text-sm font-mono hover:bg-primary-200 transition-colors"
            title="Click to copy full address"
          >
            {copied ? "Copied!" : shortAddress}
          </button>
          <button
            onClick={resetAccount}
            className="text-xs text-gray-500 hover:text-gray-700 underline"
          >
            Reset
          </button>
        </>
      ) : (
        <div className="text-sm text-gray-500">Connecting...</div>
      )}
    </div>
  );
}
