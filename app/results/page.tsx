"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ConnectKitButton } from "connectkit";
import { useAccount } from "wagmi";
import {
  type AggregatedResult,
  type ElectionConfig,
  computeElectionId,
  computeAggregationHash,
  aggregateMaskedVotes,
} from "../lib/crypto";

function ResultsContent() {
  const searchParams = useSearchParams();
  const dataParam = searchParams.get("data");
  const configParam = searchParams.get("config");
  const { address, isConnected } = useAccount();

  const [verifyStatus, setVerifyStatus] = useState("");

  if (!dataParam || !configParam) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6">
        <p className="text-zinc-400">
          Missing results data or config in URL parameters.
        </p>
        <Link
          href="/"
          className="mt-4 text-sm text-zinc-500 transition-colors hover:text-zinc-300"
        >
          ← Back to Home
        </Link>
      </div>
    );
  }

  let result: AggregatedResult;
  let config: ElectionConfig;
  try {
    const resultJson = new TextDecoder().decode(
      Uint8Array.from(atob(dataParam), (c) => c.charCodeAt(0)),
    );
    result = JSON.parse(resultJson) as AggregatedResult;

    const configJson = new TextDecoder().decode(
      Uint8Array.from(atob(configParam), (c) => c.charCodeAt(0)),
    );
    config = JSON.parse(configJson) as ElectionConfig;
  } catch {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6">
        <p className="text-red-400">
          Failed to parse results data or election config.
        </p>
        <Link
          href="/"
          className="mt-4 text-sm text-zinc-500 transition-colors hover:text-zinc-300"
        >
          ← Back to Home
        </Link>
      </div>
    );
  }

  const electionId = computeElectionId(config);

  const methodLabels: Record<string, string> = {
    single: "Single Choice",
    approval: "Approval Voting",
    ranked: "Ranked Choice",
  };

  const sortedTallies = config.candidates
    .map((candidate, i) => ({ candidate, score: result.tally[i] }))
    .sort((a, b) => b.score - a.score);

  function handleVerify() {
    setVerifyStatus("");

    if (!isConnected || !address) {
      setVerifyStatus("Please connect your wallet first.");
      return;
    }

    const voterAddr = address.toLowerCase();
    const included = result.included_ballots.some(
      (b) => b.voter_address.toLowerCase() === voterAddr,
    );

    if (!included) {
      setVerifyStatus("❌ Your ballot was NOT found in the aggregation.");
      return;
    }

    try {
      const recomputedHash = computeAggregationHash(result.included_ballots);
      if (recomputedHash !== result.aggregation_hash) {
        setVerifyStatus(
          "⚠️ Your ballot is included, but the aggregation hash does not match. The aggregation may have been tampered with.",
        );
        return;
      }

      const recomputedTally = aggregateMaskedVotes(
        result.included_ballots,
        config.candidates.length,
      );
      const tallyMatch = recomputedTally.every(
        (v, i) => v === result.tally[i],
      );

      if (!tallyMatch) {
        setVerifyStatus(
          "⚠️ Your ballot is included, but the recomputed tally does not match. The results may be incorrect.",
        );
        return;
      }

      setVerifyStatus(
        "✅ Your ballot is included and the tally is verified! The results are consistent with the included ballots.",
      );
    } catch (err) {
      setVerifyStatus(
        `Verification error: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
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
          Election Results
        </h1>
        <p className="mb-8 text-zinc-400">
          View and verify the election results. No decryption needed.
        </p>

        {/* Election Info */}
        <div className="mb-8 rounded-xl border border-zinc-800 p-6">
          <h2 className="mb-4 text-lg font-semibold">Election Info</h2>
          <div className="space-y-3">
            <div>
              <span className="text-sm text-zinc-400">Title: </span>
              <span className="font-semibold">{config.title}</span>
            </div>
            {config.description && (
              <div>
                <span className="text-sm text-zinc-400">Description: </span>
                <span className="text-zinc-300">{config.description}</span>
              </div>
            )}
            <div>
              <span className="text-sm text-zinc-400">Voting Method: </span>
              <span className="text-zinc-300">
                {methodLabels[config.votingMethod] ?? config.votingMethod}
              </span>
              {config.votingMethod === "ranked" && config.rankedWeights && (
                <span className="ml-2 text-xs text-zinc-500">
                  (weights: {config.rankedWeights.join(", ")})
                </span>
              )}
            </div>
            <div>
              <span className="text-sm text-zinc-400">Candidates: </span>
              <span className="text-zinc-300">
                {config.candidates.join(", ")}
              </span>
            </div>
            <div>
              <span className="text-sm text-zinc-400">Election ID: </span>
              <span className="font-mono text-xs text-zinc-500 break-all">
                {electionId}
              </span>
            </div>
          </div>
        </div>

        {/* Tally Results */}
        <div className="mb-8 rounded-xl border border-zinc-800 p-6">
          <h2 className="mb-4 text-lg font-semibold">Final Tally</h2>
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
                {sortedTallies.map((t, i) => (
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

        {/* Aggregation Info */}
        <div className="mb-8 rounded-xl border border-zinc-800 p-6">
          <h2 className="mb-4 text-lg font-semibold">Aggregation Summary</h2>
          <div className="space-y-3">
            <div>
              <span className="text-sm text-zinc-400">Included Ballots: </span>
              <span className="font-semibold">
                {result.included_ballots.length}
              </span>
            </div>
            <div>
              <span className="text-sm text-zinc-400">
                Aggregation Hash:{" "}
              </span>
              <span className="font-mono text-xs text-zinc-500 break-all">
                {result.aggregation_hash}
              </span>
            </div>
            <div>
              <span className="mb-2 block text-sm text-zinc-400">
                Included Voters:
              </span>
              <ul className="space-y-1">
                {result.included_ballots.map((b) => (
                  <li
                    key={b.voter_address}
                    className="rounded bg-zinc-900 px-3 py-1.5 font-mono text-xs text-zinc-300"
                  >
                    {b.voter_address}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Verify Section */}
        <div className="rounded-xl border border-zinc-800 p-6">
          <h2 className="mb-4 text-lg font-semibold">✅ Verify Your Ballot</h2>
          <p className="mb-4 text-sm text-zinc-400">
            Connect your wallet to verify that your ballot was included in the
            aggregation and that the tally is correct.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <ConnectKitButton />
            {isConnected && (
              <button
                type="button"
                onClick={handleVerify}
                className="rounded-full border border-zinc-700 px-6 py-2 text-sm font-semibold transition-colors hover:border-zinc-500 hover:bg-zinc-900"
              >
                Verify Inclusion
              </button>
            )}
          </div>
          {verifyStatus && (
            <div className="mt-4 rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-3">
              <p className="text-sm text-zinc-300">{verifyStatus}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          Loading...
        </div>
      }
    >
      <ResultsContent />
    </Suspense>
  );
}
