import { useCallback, useEffect, useRef, useState } from "react";

/**
 * useApiQuery(fetcher, deps)
 *
 * Wraps a call to the api.js layer with the three states every screen in
 * this app must handle: loading, success (data) and error. Never leaves
 * the screen blank — callers render <StateWrapper> around the result.
 */
export function useApiQuery(fetcher, deps = []) {
  const [status, setStatus] = useState("loading"); // loading | success | error
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const requestId = useRef(0);

  const run = useCallback(() => {
    const id = ++requestId.current;
    setStatus("loading");
    setError(null);
    fetcher()
      .then((result) => {
        if (id !== requestId.current) return; // stale response, ignore
        setData(result);
        setStatus("success");
      })
      .catch((err) => {
        if (id !== requestId.current) return;
        setError(err);
        setStatus("error");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    run();
  }, [run]);

  return { status, data, error, refetch: run };
}

/**
 * useApiMutation(mutationFn)
 *
 * For POST/PUT actions (submitting a request, generating a plan). Returns
 * a mutate() you call from an event handler, plus the same loading/error
 * states so buttons can show "Submitting…" and forms can show backend errors.
 */
export function useApiMutation(mutationFn) {
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const mutate = useCallback(
    async (payload) => {
      setStatus("loading");
      setError(null);
      try {
        const result = await mutationFn(payload);
        setData(result);
        setStatus("success");
        return result;
      } catch (err) {
        setError(err);
        setStatus("error");
        throw err;
      }
    },
    [mutationFn]
  );

  const reset = useCallback(() => {
    setStatus("idle");
    setData(null);
    setError(null);
  }, []);

  return { mutate, status, data, error, reset };
}
