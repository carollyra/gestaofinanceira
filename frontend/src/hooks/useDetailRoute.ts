import { useCallback } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router';

interface DetailState {
  // How many history entries the open details pushed
  detailDepth?: number;
}

// Which detail is open lives in the URL (e.g. ?transacao=<id>), next to the
// list filters: the link can be shared and the browser Back button closes it.
// Opening pushes a history entry; closing pops exactly the entries the details
// pushed. When the page was opened from a shared link, there is nothing of ours
// to pop, so closing only removes the parameters (and never leaves the page).
export function useDetailRoute<K extends string>(keys: readonly K[]) {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const depth = (location.state as DetailState | null)?.detailDepth ?? 0;

  const values = Object.fromEntries(keys.map((key) => [key, searchParams.get(key)])) as Record<
    K,
    string | null
  >;

  const open = useCallback(
    (key: K, id: string) => {
      const next = new URLSearchParams(searchParams);
      next.set(key, id);
      navigate({ search: `?${next}` }, { state: { detailDepth: depth + 1 } satisfies DetailState });
    },
    [searchParams, navigate, depth],
  );

  const removeParams = useCallback(
    (toRemove: readonly K[]) => {
      const next = new URLSearchParams(searchParams);
      toRemove.forEach((key) => next.delete(key));
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  // Closes every open detail
  const close = useCallback(() => {
    if (depth > 0) navigate(-depth);
    else removeParams(keys);
  }, [depth, navigate, removeParams, keys]);

  // Goes back one level (e.g. from the recurrence to the transaction)
  const back = useCallback(
    (key: K) => {
      if (depth > 0) navigate(-1);
      else removeParams([key]);
    },
    [depth, navigate, removeParams],
  );

  return { values, open, close, back, depth };
}
