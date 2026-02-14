import { ConnectKitButton } from "connectkit";
import { useState } from "react";
import { useAccount } from "wagmi";
import {
  type AggregatedResult,
  aggregateMaskedVotes,
  computeAggregationHash,
  type ElectionConfig,
} from "../../lib/crypto";

interface VerifyBallotProps {
  result: AggregatedResult;
  config: ElectionConfig;
}

export function VerifyBallot({ result, config }: VerifyBallotProps) {
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
      <h2 className="mb-4 text-lg font-semibold">✅ Verify Your Ballot</h2>
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
    </div>
  );
}
