import type { AggregatedResult } from "../../lib/crypto";

interface VerificationDetailsProps {
  result: AggregatedResult;
}

export function VerificationDetails({ result }: VerificationDetailsProps) {
  return (
    <div className="mb-8 rounded-xl border border-zinc-800 p-6">
      <h2 className="mb-4 text-lg font-semibold">Verification Details</h2>
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
  );
}
