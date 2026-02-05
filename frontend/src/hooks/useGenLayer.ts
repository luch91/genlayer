"use client";

import { useState, useEffect, useCallback } from "react";
import { getAccount, getClient } from "@/lib/client";

export function useGenLayer() {
  const [address, setAddress] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const account = getAccount();
    if (account) {
      setAddress(account.address);
    }
    setIsReady(true);
  }, []);

  const resetAccount = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("prompt-duel-private-key");
      window.location.reload();
    }
  }, []);

  return {
    address,
    isReady,
    client: isReady ? getClient() : null,
    resetAccount,
  };
}
