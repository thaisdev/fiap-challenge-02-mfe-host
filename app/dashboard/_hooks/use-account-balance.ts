'use client';

import { useCallback, useEffect, useState } from 'react';

type UseAccountBalanceResult = {
  balanceInCents: number | null;
  isLoading: boolean;
  error: Error | null;
  refresh: () => void;
};

export default function useAccountBalance(enabled: boolean): UseAccountBalanceResult {
  const [balanceInCents, setBalanceInCents] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchBalance = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/mock/account/balance', { signal });
      if (!res.ok) throw new Error(`Failed to fetch account balance: ${res.status}`);
      const data = await res.json();
      setBalanceInCents(
        typeof data?.accountBalanceInCents === 'number' ? data.accountBalanceInCents : null
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err : new Error(String(err)));
      setBalanceInCents(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const ac = new AbortController();
    void fetchBalance(ac.signal);
    return () => ac.abort();
  }, [enabled, fetchBalance]);

  const refresh = useCallback(() => {
    const ac = new AbortController();
    void fetchBalance(ac.signal);
  }, [fetchBalance]);

  return { balanceInCents, isLoading, error, refresh };
}
