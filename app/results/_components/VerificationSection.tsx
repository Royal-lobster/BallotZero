"use client";

import { ConnectKitButton } from "connectkit";
import { useState } from "react";
import { useAccount } from "wagmi";
import {
  type AggregatedResult,
  aggregateMaskedVotes,
  computeAggregationHash,
  type ElectionConfig,
} from "../../lib/crypto";

interface VerificationSectionProps {
  result: AggregatedResult;
  config: ElectionConfig;
}

export function VerificationSection({
  result,
  config,
}: VerificationSectionProps) {
  const { address, isConnected } = useAccount();
  const [verifyStatus, setVerifyStatus] = useState("");

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
      const tallyMatch = recomputedTally.every((v, i) => v === result.tally[i]);

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
    <div className="rounded-xl border border-zinc-800 p-6">
      <h2 className="mb-4 text-lg font-semibold">Verification</h2>

      {/* Verify your ballot */}
      <p className="mb-4 text-sm text-zinc-400">
        Connect your wallet to check that your vote was included and that the
        results are correct.
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

      {/* Audit details */}
      <div className="mt-6 border-t border-zinc-800 pt-6">
        <h3 className="mb-3 text-sm font-medium text-zinc-400">
          Audit Details
        </h3>
        <div className="space-y-3">
          <div>
            <span className="text-sm text-zinc-400">Included Ballots: </span>
            <span className="font-semibold">
              {result.included_ballots.length}
            </span>
          </div>
          <div>
            <span className="text-sm text-zinc-400">Aggregation Hash: </span>
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
    </div>
  );
}
