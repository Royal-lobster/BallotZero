import { useEffect, useRef, useState } from "react";
import {
  type BallotData,
  deserializeBallot,
  serializeBallot,
} from "../../lib/crypto";
import { getBallots, saveBallots } from "../../lib/storage";

export function useBallots(electionId: string | undefined) {
  const [ballots, setBallots] = useState<BallotData[]>([]);
  const [ballotError, setBallotError] = useState("");
  const [ballotsLoaded, setBallotsLoaded] = useState(false);
  const ballotInputRef = useRef<HTMLInputElement>(null);

  // Load persisted ballots from IndexedDB when electionId is available
  useEffect(() => {
    if (!electionId) {
      setBallotsLoaded(false);
      return;
    }
    let cancelled = false;
    getBallots(electionId).then((stored) => {
      if (cancelled) return;
      if (stored.length > 0) {
        const parsed: BallotData[] = [];
        const seen = new Set<string>();
        for (const s of stored) {
          try {
            const b = deserializeBallot(s);
            const addr = b.voter_address.toLowerCase();
            if (!seen.has(addr)) {
              parsed.push(b);
              seen.add(addr);
            }
          } catch {
            // skip invalid
          }
        }
        if (parsed.length > 0) {
          setBallots((prev) => {
            const existingAddrs = new Set(
              prev.map((b) => b.voter_address.toLowerCase()),
            );
            const newBallots = parsed.filter(
              (b) => !existingAddrs.has(b.voter_address.toLowerCase()),
            );
            return newBallots.length > 0 ? [...prev, ...newBallots] : prev;
          });
        }
      }
      setBallotsLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, [electionId]);

  // Persist ballots to IndexedDB whenever they change
  useEffect(() => {
    if (!electionId || !ballotsLoaded) return;
    const serialized = ballots.map((b) => serializeBallot(b));
    saveBallots(electionId, serialized);
  }, [ballots, electionId, ballotsLoaded]);

  // Auto-extract ballot from URL hash on mount
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes("ballot=")) {
      const ballotStr = hash.slice(hash.indexOf("ballot=") + "ballot=".length);
      if (ballotStr) {
        try {
          const ballot = deserializeBallot(decodeURIComponent(ballotStr));
          setBallots((prev) => {
            const addrLower = ballot.voter_address.toLowerCase();
            if (prev.some((b) => b.voter_address.toLowerCase() === addrLower)) {
              return prev;
            }
            return [...prev, ballot];
          });
        } catch {
          // ignore invalid hash ballot
        }
      }
      window.history.replaceState(
        null,
        "",
        window.location.pathname + window.location.search,
      );
    }
  }, []);

  function extractBallotString(raw: string): string {
    const trimmed = raw.trim();
    const hashIdx = trimmed.indexOf("#ballot=");
    if (hashIdx !== -1) {
      return trimmed.slice(hashIdx + "#ballot=".length);
    }
    const queryIdx = trimmed.indexOf("ballot=");
    if (
      queryIdx !== -1 &&
      (trimmed.includes("/tally") || trimmed.includes("/aggregate"))
    ) {
      return trimmed.slice(queryIdx + "ballot=".length);
    }
    return trimmed;
  }

  function addBallot(raw: string) {
    const lines = raw
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length === 0) return;
    setBallotError("");

    let added = 0;
    let duplicates = 0;
    let invalid = 0;

    setBallots((prev) => {
      const next = [...prev];
      const seen = new Set(next.map((b) => b.voter_address.toLowerCase()));
      for (const line of lines) {
        const str = extractBallotString(line);
        if (!str) {
          invalid++;
          continue;
        }
        try {
          const ballot = deserializeBallot(str);
          const addrLower = ballot.voter_address.toLowerCase();
          if (seen.has(addrLower)) {
            duplicates++;
            continue;
          }
          next.push(ballot);
          seen.add(addrLower);
          added++;
        } catch {
          invalid++;
        }
      }
      return next;
    });

    if (invalid > 0 && added === 0 && duplicates === 0) {
      setBallotError("Invalid ballot string or link.");
    } else if (invalid > 0) {
      setBallotError(
        `Added ${added}, skipped ${duplicates} duplicate(s) and ${invalid} invalid.`,
      );
    } else if (duplicates > 0 && added === 0) {
      setBallotError(
        lines.length === 1
          ? "This voter's ballot has already been added."
          : `All ${duplicates} ballot(s) already added.`,
      );
    }
  }

  function removeBallot(index: number) {
    setBallots((prev) => prev.filter((_, i) => i !== index));
  }

  return {
    ballots,
    ballotError,
    setBallotError,
    ballotsLoaded,
    ballotInputRef,
    addBallot,
    removeBallot,
  };
}
