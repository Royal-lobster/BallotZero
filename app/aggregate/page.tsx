"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  type ElectionConfig,
  type BallotData,
  type AggregatedResult,
  computeElectionId,
  deserializeBallot,
  aggregateMaskedVotes,
  computeAggregationHash,
  canonicalJson,
} from "../lib/crypto";

interface RejectedBallot {
  index: number;
  reason: string;
  voterAddress?: string;
}

function AggregateContent() {
  const searchParams = useSearchParams();
  const initialConfig = searchParams.get("config") ?? "";

  const [configBase64, setConfigBase64] = useState(initialConfig);
  const [ballotsText, setBallotsText] = useState("");
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState("");
  const [resultsLink, setResultsLink] = useState("");
  const [validCount, setValidCount] = useState(0);
  const [includedVoters, setIncludedVoters] = useState<string[]>([]);
  const [rejected, setRejected] = useState<RejectedBallot[]>([]);
  const [missingVoters, setMissingVoters] = useState<string[]>([]);
  const [tally, setTally] = useState<number[] | null>(null);
  const [config, setConfig] = useState<ElectionConfig | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleAggregate() {
    setProcessing(true);
    setStatus("");
    setResultsLink("");
    setValidCount(0);
    setIncludedVoters([]);
    setRejected([]);
    setMissingVoters([]);
    setTally(null);
    setConfig(null);

    try {
      setStatus("Decoding election config...");
      const configJson = new TextDecoder().decode(
        Uint8Array.from(atob(configBase64), (c) => c.charCodeAt(0)),
      );
      const electionConfig: ElectionConfig = JSON.parse(configJson);

      if (
        !electionConfig.voters ||
        electionConfig.voters.length === 0
      ) {
        setStatus(
          "Error: Config must include voters with their public keys.",
        );
        setProcessing(false);
        return;
      }

      const electionId = computeElectionId(electionConfig);

      setStatus("Parsing ballot strings...");
      const lines = ballotsText
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

      if (lines.length === 0) {
        setStatus("Error: No ballot strings provided.");
        setProcessing(false);
        return;
      }

      const validBallots: BallotData[] = [];
      const rejectedBallots: RejectedBallot[] = [];
      const seenAddresses = new Set<string>();

      for (let i = 0; i < lines.length; i++) {
        try {
          const ballot = deserializeBallot(lines[i]);

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
        } catch {
          rejectedBallots.push({
            index: i + 1,
            reason: "Failed to parse ballot string",
          });
        }
      }

      if (validBallots.length === 0) {
        setStatus("Error: No valid ballots after validation.");
        setRejected(rejectedBallots);
        setProcessing(false);
        return;
      }

      // Check for missing voters (DC-net requires all registered voters)
      const registeredAddresses = electionConfig.voters.map((v) =>
        v.address.toLowerCase(),
      );
      const missing = registeredAddresses.filter(
        (addr) => !seenAddresses.has(addr),
      );

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
      setIncludedVoters(validBallots.map((b) => b.voter_address));
      setRejected(rejectedBallots);
      setMissingVoters(missing);
      setTally(tallyResult);
      setConfig(electionConfig);
      setStatus("Aggregation complete!");
    } catch (err) {
      setStatus(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setProcessing(false);
    }
  }

  function copyLink() {
    const fullUrl = `${window.location.origin}${resultsLink}`;
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
          Paste the election config and collected ballot strings to produce the
          tally.
        </p>

        <div className="space-y-6">
          <div>
            <label
              htmlFor="config"
              className="mb-2 block text-sm font-medium text-zinc-300"
            >
              Election Config (base64)
            </label>
            <textarea
              id="config"
              value={configBase64}
              onChange={(e) => setConfigBase64(e.target.value)}
              placeholder="Paste the base64-encoded election config (must include voters)..."
              rows={3}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 font-mono text-sm text-zinc-100 placeholder-zinc-600 outline-none transition-colors focus:border-zinc-600"
            />
          </div>

          <div>
            <label
              htmlFor="ballots"
              className="mb-2 block text-sm font-medium text-zinc-300"
            >
              Ballot Strings (one per line)
            </label>
            <textarea
              id="ballots"
              value={ballotsText}
              onChange={(e) => setBallotsText(e.target.value)}
              placeholder="Paste ballot strings here, one per line..."
              rows={10}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 font-mono text-sm text-zinc-100 placeholder-zinc-600 outline-none transition-colors focus:border-zinc-600"
            />
          </div>

          <button
            type="button"
            onClick={handleAggregate}
            disabled={processing || !configBase64 || !ballotsText}
            className="w-full rounded-full bg-white px-8 py-3 text-sm font-semibold text-black transition-colors hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {processing ? "Processing..." : "Aggregate"}
          </button>
        </div>

        {status && (
          <div className="mt-6 rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-3">
            <p
              className={`text-sm ${status.startsWith("Error") ? "text-red-400" : "text-zinc-300"}`}
            >
              {status}
            </p>
          </div>
        )}

        {missingVoters.length > 0 && (
          <div className="mt-6 rounded-xl border border-yellow-900/50 p-6">
            <h2 className="mb-4 text-lg font-semibold text-yellow-400">
              ⚠️ Missing Voters ({missingVoters.length})
            </h2>
            <p className="mb-3 text-sm text-zinc-400">
              DC-net requires ALL registered voters to submit a ballot for masks
              to cancel correctly. The following registered voters did not
              submit:
            </p>
            <ul className="space-y-1">
              {missingVoters.map((addr) => (
                <li
                  key={addr}
                  className="rounded bg-zinc-900 px-3 py-1.5 font-mono text-xs text-yellow-300"
                >
                  {addr}
                </li>
              ))}
            </ul>
          </div>
        )}

        {tally && config && (
          <div className="mt-8 space-y-6">
            <div className="rounded-xl border border-zinc-800 p-6">
              <h2 className="mb-4 text-lg font-semibold">Tally Results</h2>
              <div className="overflow-hidden rounded-lg border border-zinc-800">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-zinc-800 bg-zinc-900/50">
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-400">
                        Rank
                      </th>
                      <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-400">
                        Candidate
                      </th>
                      <th className="px-4 py-2.5 text-right text-xs font-medium text-zinc-400">
                        {config.votingMethod === "ranked" ? "Score" : "Votes"}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {config.candidates
                      .map((candidate, i) => ({
                        candidate,
                        score: tally[i],
                      }))
                      .sort((a, b) => b.score - a.score)
                      .map((t, i) => (
                        <tr
                          key={t.candidate}
                          className="border-b border-zinc-800/50 last:border-0"
                        >
                          <td className="px-4 py-2.5 text-sm text-zinc-500">
                            {i + 1}
                          </td>
                          <td className="px-4 py-2.5 text-sm font-medium">
                            {i === 0 && "🏆 "}
                            {t.candidate}
                          </td>
                          <td className="px-4 py-2.5 text-right font-mono text-sm">
                            {t.score}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
              {config.votingMethod === "ranked" && config.rankedWeights && (
                <p className="mt-2 text-xs text-zinc-500">
                  Scores reflect weighted ranked-choice voting (weights:{" "}
                  {config.rankedWeights.join(", ")})
                </p>
              )}
            </div>

            <div className="rounded-xl border border-zinc-800 p-6">
              <h2 className="mb-4 text-lg font-semibold">
                Aggregation Summary
              </h2>
              <div className="space-y-4">
                <div>
                  <span className="text-sm text-zinc-400">Valid Ballots: </span>
                  <span className="font-semibold">{validCount}</span>
                </div>
                <div>
                  <span className="mb-2 block text-sm text-zinc-400">
                    Included Voters:
                  </span>
                  <ul className="space-y-1">
                    {includedVoters.map((addr) => (
                      <li
                        key={addr}
                        className="rounded bg-zinc-900 px-3 py-1.5 font-mono text-xs text-zinc-300"
                      >
                        {addr}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {rejected.length > 0 && (
              <div className="rounded-xl border border-red-900/50 p-6">
                <h2 className="mb-4 text-lg font-semibold text-red-400">
                  Rejected Ballots ({rejected.length})
                </h2>
                <ul className="space-y-2">
                  {rejected.map((r) => (
                    <li
                      key={`${r.index}-${r.reason}`}
                      className="text-sm text-zinc-400"
                    >
                      <span className="text-red-400">Ballot #{r.index}</span>
                      {r.voterAddress && (
                        <span className="ml-2 font-mono text-xs text-zinc-500">
                          ({r.voterAddress.slice(0, 10)}...)
                        </span>
                      )}
                      <span className="ml-2">— {r.reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {resultsLink && (
              <div className="rounded-xl border border-zinc-800 p-6">
                <h2 className="mb-4 text-lg font-semibold">
                  Shareable Results Link
                </h2>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    readOnly
                    value={`${typeof window !== "undefined" ? window.location.origin : ""}${resultsLink}`}
                    className="flex-1 rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2 font-mono text-xs text-zinc-300 outline-none"
                  />
                  <button
                    type="button"
                    onClick={copyLink}
                    className="shrink-0 rounded-full border border-zinc-700 px-4 py-2 text-sm font-semibold transition-colors hover:border-zinc-500 hover:bg-zinc-900"
                  >
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {rejected.length > 0 && validCount === 0 && (
          <div className="mt-8 rounded-xl border border-red-900/50 p-6">
            <h2 className="mb-4 text-lg font-semibold text-red-400">
              Rejected Ballots ({rejected.length})
            </h2>
            <ul className="space-y-2">
              {rejected.map((r) => (
                <li
                  key={`${r.index}-${r.reason}`}
                  className="text-sm text-zinc-400"
                >
                  <span className="text-red-400">Ballot #{r.index}</span>
                  {r.voterAddress && (
                    <span className="ml-2 font-mono text-xs text-zinc-500">
                      ({r.voterAddress.slice(0, 10)}...)
                    </span>
                  )}
                  <span className="ml-2">— {r.reason}</span>
                </li>
              ))}
            </ul>
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
