"use client";

import { useState, useEffect, useRef, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  type ElectionConfig,
  type BallotData,
  type AggregatedResult,
  computeElectionId,
  deserializeBallot,
  serializeBallot,
  aggregateMaskedVotes,
  computeAggregationHash,
  canonicalJson,
} from "../lib/crypto";
import { saveBallots, getBallots, getAliases, type AliasMap, getSavedElections, getConfig, type SavedElection } from "../lib/storage";

interface RejectedBallot {
  index: number;
  reason: string;
  voterAddress?: string;
}

function truncateAddress(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function AddressAvatar({
  address,
  size = "sm",
}: { address: string; size?: "sm" | "md" }) {
  const hex = address.replace(/^0x/, "").slice(0, 6);
  const bg = `#${hex}`;
  const label = address.replace(/^0x/, "").slice(0, 2).toUpperCase();
  const sizeClass =
    size === "md"
      ? "h-8 w-8 text-xs"
      : "h-5 w-5 text-[10px]";
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-bold leading-none text-white ${sizeClass}`}
      style={{ backgroundColor: bg }}
    >
      {label}
    </span>
  );
}

function AggregateContent() {
  const searchParams = useSearchParams();
  const initialConfig = searchParams.get("config") ?? "";

  const [configBase64, setConfigBase64] = useState(initialConfig);
  const [ballots, setBallots] = useState<BallotData[]>([]);
  const [ballotInput, setBallotInput] = useState("");
  const [ballotError, setBallotError] = useState("");
  const ballotInputRef = useRef<HTMLInputElement>(null);
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState("");
  const [resultsLink, setResultsLink] = useState("");
  const [validCount, setValidCount] = useState(0);
  const [copied, setCopied] = useState(false);
  const [ballotsLoaded, setBallotsLoaded] = useState(false);
  const [copiedElectionLink, setCopiedElectionLink] = useState(false);
  const [aliases, setAliasMap] = useState<AliasMap>({});
  const [savedElections, setSavedElections] = useState<SavedElection[]>([]);

  // Load aliases and saved elections from IndexedDB on mount
  useEffect(() => {
    getAliases().then(setAliasMap);
    getSavedElections().then((elections) =>
      setSavedElections(elections.sort((a, b) => b.createdAt - a.createdAt)),
    );
  }, []);

  // Parse config whenever configBase64 changes
  const parsedConfig = useMemo<{
    config: ElectionConfig;
    electionId: string;
  } | null>(() => {
    try {
      const json = new TextDecoder().decode(
        Uint8Array.from(atob(configBase64), (c) => c.charCodeAt(0)),
      );
      const cfg: ElectionConfig = JSON.parse(json);
      if (cfg.title && cfg.voters?.length) {
        const eid = computeElectionId(cfg);
        return { config: cfg, electionId: eid };
      }
      return null;
    } catch {
      return null;
    }
  }, [configBase64]);

  // Load persisted ballots from IndexedDB when config is parsed
  useEffect(() => {
    if (!parsedConfig) {
      setBallotsLoaded(false);
      return;
    }
    let cancelled = false;
    getBallots(parsedConfig.electionId).then((stored) => {
      if (cancelled) return;
      if (stored.length > 0) {
        const parsed: BallotData[] = [];
        const seen = new Set(ballots.map((b) => b.voter_address.toLowerCase()));
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
          setBallots((prev) => [...prev, ...parsed]);
        }
      }
      setBallotsLoaded(true);
    });
    return () => { cancelled = true; };
  }, [parsedConfig?.electionId]);

  // Persist ballots to IndexedDB whenever they change
  useEffect(() => {
    if (!parsedConfig || !ballotsLoaded) return;
    const serialized = ballots.map((b) => serializeBallot(b));
    saveBallots(parsedConfig.electionId, serialized);
  }, [ballots, parsedConfig?.electionId, ballotsLoaded]);

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
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    }
  }, []);

  // Live tracker: which voters have submitted, which are missing
  const collectedAddresses = useMemo(
    () => new Set(ballots.map((b) => b.voter_address.toLowerCase())),
    [ballots],
  );

  const liveMissingVoters = useMemo(() => {
    if (!parsedConfig) return [];
    return parsedConfig.config.voters.filter(
      (v) => !collectedAddresses.has(v.address.toLowerCase()),
    );
  }, [parsedConfig, collectedAddresses]);

  function extractBallotString(raw: string): string {
    const trimmed = raw.trim();
    const hashIdx = trimmed.indexOf("#ballot=");
    if (hashIdx !== -1) {
      return trimmed.slice(hashIdx + "#ballot=".length);
    }
    // Also handle ?ballot= just in case
    const queryIdx = trimmed.indexOf("ballot=");
    if (queryIdx !== -1 && trimmed.includes("/aggregate")) {
      return trimmed.slice(queryIdx + "ballot=".length);
    }
    return trimmed;
  }

  function addBallot(raw: string) {
    // Support pasting multiple ballot links/strings at once (one per line)
    const lines = raw.split("\n").map((l) => l.trim()).filter(Boolean);
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
        if (!str) { invalid++; continue; }
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

    setBallotInput("");
    if (invalid > 0 && added === 0 && duplicates === 0) {
      setBallotError("Invalid ballot string or link.");
    } else if (invalid > 0) {
      setBallotError(`Added ${added}, skipped ${duplicates} duplicate(s) and ${invalid} invalid.`);
    } else if (duplicates > 0 && added === 0) {
      setBallotError(lines.length === 1 ? "This voter's ballot has already been added." : `All ${duplicates} ballot(s) already added.`);
    }
  }

  function removeBallot(index: number) {
    setBallots((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleAggregate() {
    setProcessing(true);
    setStatus("");
    setResultsLink("");
    setValidCount(0);

    try {
      setStatus("Decoding election config...");
      const configJson = new TextDecoder().decode(
        Uint8Array.from(atob(configBase64), (c) => c.charCodeAt(0)),
      );
      const electionConfig: ElectionConfig = JSON.parse(configJson);

      if (!electionConfig.voters || electionConfig.voters.length === 0) {
        setStatus("Error: Config must include voters with their public keys.");
        setProcessing(false);
        return;
      }

      const electionId = computeElectionId(electionConfig);

      if (ballots.length === 0) {
        setStatus("Error: No ballots have been added.");
        setProcessing(false);
        return;
      }

      setStatus("Validating ballots...");
      const validBallots: BallotData[] = [];
      const rejectedBallots: RejectedBallot[] = [];
      const seenAddresses = new Set<string>();

      for (let i = 0; i < ballots.length; i++) {
        const ballot = ballots[i];

        if (ballot.election_id !== electionId) {
          rejectedBallots.push({
            index: i + 1,
            reason: "Election ID mismatch",
            voterAddress: ballot.voter_address,
          });
          continue;
        }

        const addrLower = ballot.voter_address.toLowerCase();
        const voterAddresses = electionConfig.voters.map((v) =>
          v.address.toLowerCase(),
        );
        if (!voterAddresses.includes(addrLower)) {
          rejectedBallots.push({
            index: i + 1,
            reason: "Voter not in allowlist",
            voterAddress: ballot.voter_address,
          });
          continue;
        }

        if (ballot.masked_vote.length !== electionConfig.candidates.length) {
          rejectedBallots.push({
            index: i + 1,
            reason: `Masked vote length ${ballot.masked_vote.length} does not match candidate count ${electionConfig.candidates.length}`,
            voterAddress: ballot.voter_address,
          });
          continue;
        }

        if (seenAddresses.has(addrLower)) {
          rejectedBallots.push({
            index: i + 1,
            reason: "Duplicate voter (keeping first occurrence)",
            voterAddress: ballot.voter_address,
          });
          continue;
        }

        seenAddresses.add(addrLower);
        validBallots.push(ballot);
      }

      if (validBallots.length === 0) {
        setStatus("Error: No valid ballots after validation.");
        setProcessing(false);
        return;
      }

      setStatus(
        `Validated ${validBallots.length} ballots. Aggregating masked votes...`,
      );

      const numCandidates = electionConfig.candidates.length;
      const tallyResult = aggregateMaskedVotes(validBallots, numCandidates);

      setStatus("Computing aggregation hash...");
      const aggHash = computeAggregationHash(validBallots);

      const result: AggregatedResult = {
        election_id: electionId,
        tally: tallyResult,
        included_ballots: validBallots,
        aggregation_hash: aggHash,
      };

      const resultJson = canonicalJson(result);
      const resultBase64 = btoa(
        Array.from(new TextEncoder().encode(resultJson), (b) =>
          String.fromCharCode(b),
        ).join(""),
      );

      const link = `/results?data=${encodeURIComponent(resultBase64)}&config=${encodeURIComponent(configBase64)}`;

      setResultsLink(link);
      setValidCount(validBallots.length);
    } catch (err) {
      setStatus(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setProcessing(false);
    }
  }

  async function loadSavedElection(electionId: string) {
    const configB64 = await getConfig(electionId);
    if (configB64) {
      setConfigBase64(configB64);
    }
  }

  function copyLink() {
    const fullUrl = `${window.location.origin}${resultsLink}`;
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function copyElectionLink() {
    const link = `${window.location.origin}/election?config=${encodeURIComponent(configBase64)}`;
    navigator.clipboard.writeText(link);
    setCopiedElectionLink(true);
    setTimeout(() => setCopiedElectionLink(false), 2000);
  }

  if (resultsLink) {
    const fullResultsUrl = `${typeof window !== "undefined" ? window.location.origin : ""}${resultsLink}`;
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6 py-16">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <div className="mb-4 text-4xl">✅</div>
            <h1 className="text-3xl font-bold tracking-tight">
              Aggregation Complete
            </h1>
            <p className="mt-2 text-zinc-400">
              {validCount} ballot{validCount !== 1 ? "s" : ""} aggregated successfully.
            </p>
          </div>

          <div className="rounded-xl border border-zinc-800 p-6">
            <label className="mb-3 block text-sm font-semibold text-zinc-400">
              Results Link
            </label>
            <div className="flex items-center gap-3">
              <code className="min-w-0 flex-1 truncate rounded-lg bg-zinc-900 px-3 py-2 font-mono text-sm text-zinc-300">
                {fullResultsUrl}
              </code>
              <button
                type="button"
                onClick={copyLink}
                className="shrink-0 rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-medium transition-colors hover:border-zinc-500 hover:bg-zinc-800"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <p className="mt-3 text-xs text-zinc-500">
              Share this link so anyone can verify the election results.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Link
              href={resultsLink}
              className="rounded-full bg-white px-8 py-3 text-center text-sm font-semibold text-black transition-colors hover:bg-zinc-200"
            >
              View Results →
            </Link>
            <Link
              href="/"
              className="rounded-full border border-zinc-700 px-8 py-3 text-center text-sm font-semibold transition-colors hover:border-zinc-500 hover:bg-zinc-900"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center px-6 py-16">
      <div className="w-full max-w-2xl">
        <Link
          href="/"
          className="mb-8 inline-block text-sm text-zinc-500 transition-colors hover:text-zinc-300"
        >
          ← Back to Home
        </Link>

        <h1 className="mb-2 text-3xl font-bold tracking-tight">
          Aggregate Ballots
        </h1>
        <p className="mb-8 text-zinc-400">
          Paste the election config and collected ballot links to produce the
          tally.
        </p>

        <div className="space-y-6">
          {/* Election Config */}
          <div>
            <label
              htmlFor="config"
              className="mb-2 block text-sm font-medium text-zinc-300"
            >
              Election Config
            </label>

            {/* Saved elections picker */}
            {!parsedConfig && savedElections.length > 0 && (
              <div className="mb-3 space-y-3">
                <p className="text-xs text-zinc-500">
                  Load a previously created election:
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {savedElections.map((election) => (
                    <button
                      key={election.electionId}
                      type="button"
                      onClick={() => loadSavedElection(election.electionId)}
                      className="group relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 text-left transition-all hover:border-zinc-600 hover:bg-zinc-800/80 hover:shadow-lg hover:shadow-zinc-900/50"
                    >
                      <div className="flex items-start gap-3">
                        {election.emoji && (
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-2xl transition-colors group-hover:bg-zinc-700">
                            {election.emoji}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <h3 className="mb-1 font-semibold text-zinc-200 group-hover:text-white">
                            {election.title}
                          </h3>
                          <p className="text-xs text-zinc-500">
                            {new Date(election.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="absolute inset-0 -z-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-3 text-xs text-zinc-600">
                  <span className="h-px flex-1 bg-zinc-800" />
                  or paste config
                  <span className="h-px flex-1 bg-zinc-800" />
                </div>
              </div>
            )}

            {parsedConfig ? (
              <div className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2">
                <span className="text-green-400 text-sm">✓</span>
                <span className="min-w-0 flex-1 text-sm text-zinc-300">
                  {parsedConfig.config.title}
                  <span className="ml-2 text-xs text-zinc-500">
                    · {parsedConfig.config.voters.length} voters ·{" "}
                    {parsedConfig.config.candidates.length} candidates
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => setConfigBase64("")}
                  className="shrink-0 text-xs text-zinc-500 transition-colors hover:text-zinc-300"
                >
                  Change
                </button>
              </div>
            ) : (
              <textarea
                id="config"
                value={configBase64}
                onChange={(e) => setConfigBase64(e.target.value)}
                placeholder="Paste the base64-encoded election config..."
                rows={3}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 font-mono text-sm text-zinc-100 placeholder-zinc-600 outline-none transition-colors focus:border-zinc-600"
              />
            )}
          </div>

          {/* Ballot Input */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label
                htmlFor="ballotInput"
                className="text-sm font-medium text-zinc-300"
              >
                Collect Ballots
              </label>
              {parsedConfig && (
                <button
                  type="button"
                  onClick={copyElectionLink}
                  className="rounded-lg border border-zinc-700 px-2.5 py-1 text-xs font-medium text-zinc-400 transition-colors hover:border-zinc-500 hover:text-zinc-200"
                >
                  {copiedElectionLink ? "Copied!" : "Copy Election Link"}
                </button>
              )}
            </div>
            <p className="mb-2 text-xs text-zinc-500">
              Paste ballot links or strings from voters.
            </p>
            <div
              className="flex w-full cursor-text items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 focus-within:border-zinc-600"
              onClick={() => ballotInputRef.current?.focus()}
            >
              <input
                ref={ballotInputRef}
                id="ballotInput"
                type="text"
                value={ballotInput}
                onChange={(e) => {
                  setBallotInput(e.target.value);
                  setBallotError("");
                }}
                onPaste={(e) => {
                  e.preventDefault();
                  const pasted = e.clipboardData.getData("text/plain");
                  addBallot(pasted);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addBallot(ballotInput);
                  }
                }}
                placeholder="Paste a ballot link or string..."
                className="min-w-0 flex-1 bg-transparent font-mono text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none"
              />
            </div>
            {ballotError && (
              <p className="mt-1.5 text-xs text-red-400">{ballotError}</p>
            )}

            {/* Collected ballots chips */}
            {ballots.length > 0 && (
              <div className="mt-3 space-y-2">
                {ballots.map((ballot, i) => (
                  <div
                    key={`${ballot.voter_address}-${i}`}
                    className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2"
                    title={`Voter: ${ballot.voter_address}`}
                  >
                    <AddressAvatar address={ballot.voter_address} size="md" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-zinc-200">
                        {aliases[ballot.voter_address.toLowerCase()] ? (
                          <><span className="font-medium">{aliases[ballot.voter_address.toLowerCase()]}</span>{" "}<span className="font-mono text-xs text-zinc-500">{truncateAddress(ballot.voter_address)}</span></>
                        ) : (
                          <span className="font-mono">{truncateAddress(ballot.voter_address)}</span>
                        )}
                      </p>
                      <p className="text-xs text-green-400/70">ballot received</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeBallot(i)}
                      className="shrink-0 text-zinc-500 transition-colors hover:text-red-400"
                      aria-label={`Remove ballot from ${ballot.voter_address}`}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Live Collection Progress */}
          {parsedConfig && (
            <div className="rounded-xl border border-zinc-800 p-5">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-zinc-300">
                  Collection Progress
                </h3>
                <span className="text-sm font-medium tabular-nums">
                  <span className={ballots.length === parsedConfig.config.voters.length ? "text-green-400" : "text-zinc-400"}>
                    {ballots.length}
                  </span>
                  <span className="text-zinc-600"> / {parsedConfig.config.voters.length}</span>
                </span>
              </div>
              {/* Progress bar */}
              <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
                <div
                  className="h-full rounded-full bg-white transition-all duration-300"
                  style={{
                    width: `${(ballots.length / parsedConfig.config.voters.length) * 100}%`,
                  }}
                />
              </div>

              {liveMissingVoters.length > 0 ? (
                <div>
                  <p className="mb-2 text-xs text-zinc-500">
                    Awaiting {liveMissingVoters.length} voter{liveMissingVoters.length > 1 ? "s" : ""}:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {liveMissingVoters.map((voter) => (
                      <span
                        key={voter.address}
                        className="inline-flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900/50 px-2.5 py-1"
                        title={voter.address}
                      >
                        <AddressAvatar address={voter.address} />
                        <span className="text-xs text-zinc-500">
                          {aliases[voter.address.toLowerCase()] ? (
                            <><span className="font-medium text-zinc-400">{aliases[voter.address.toLowerCase()]}</span>{" "}<span className="font-mono">{truncateAddress(voter.address)}</span></>
                          ) : (
                            <span className="font-mono">{truncateAddress(voter.address)}</span>
                          )}
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-green-400">
                  ✓ All ballots collected — ready to aggregate
                </p>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={handleAggregate}
            disabled={processing || !configBase64 || ballots.length === 0}
            className="w-full rounded-full bg-white px-8 py-3 text-sm font-semibold text-black transition-colors hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {processing ? "Processing..." : "Aggregate"}
          </button>
        </div>

        {status && status.startsWith("Error") && (
          <div className="mt-6 rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-3">
            <p className="text-sm text-red-400">{status}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AggregatePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          Loading...
        </div>
      }
    >
      <AggregateContent />
    </Suspense>
  );
}
