import type { ReadonlyURLSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { computeElectionId, type ElectionConfig } from "../../lib/crypto";

export function useElectionConfig(searchParams: ReadonlyURLSearchParams) {
  const [config, setConfig] = useState<ElectionConfig | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  useEffect(() => {
    const raw = searchParams.get("config");
    if (!raw) {
      setParseError("Missing election configuration in URL.");
      return;
    }
    try {
      const decoded = JSON.parse(atob(raw));
      setConfig(decoded);
    } catch {
      setParseError("Invalid election configuration.");
    }
  }, [searchParams]);

  const electionId = useMemo(
    () => (config ? computeElectionId(config) : null),
    [config],
  );

  return { config, electionId, parseError };
}
