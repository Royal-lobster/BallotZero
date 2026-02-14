import { useMemo } from "react";
import { AddressAvatar } from "../../_components/AddressAvatar";
import { truncateAddress } from "../../_components/utils";
import type { BallotData, ElectionConfig } from "../../lib/crypto";
import type { AliasMap } from "../../lib/storage";

interface CollectionProgressProps {
  config: ElectionConfig;
  ballots: BallotData[];
  aliases: AliasMap;
}

export function CollectionProgress({
  config,
  ballots,
  aliases,
}: CollectionProgressProps) {
  const collectedAddresses = useMemo(
    () => new Set(ballots.map((b) => b.voter_address.toLowerCase())),
    [ballots],
  );

  const missingVoters = useMemo(
    () =>
      config.voters.filter(
        (v) => !collectedAddresses.has(v.address.toLowerCase()),
      ),
    [config.voters, collectedAddresses],
  );

  return (
    <div className="rounded-xl border border-zinc-800 p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-300">
          Collection Progress
        </h3>
        <span className="text-sm font-medium tabular-nums">
          <span
            className={
              ballots.length === config.voters.length
                ? "text-green-400"
                : "text-zinc-400"
            }
          >
            {ballots.length}
          </span>
          <span className="text-zinc-600"> / {config.voters.length}</span>
        </span>
      </div>
      <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
        <div
          className="h-full rounded-full bg-white transition-all duration-300"
          style={{
            width: `${(ballots.length / config.voters.length) * 100}%`,
          }}
        />
      </div>

      {missingVoters.length > 0 ? (
        <div>
          <p className="mb-2 text-xs text-zinc-500">
            Awaiting {missingVoters.length} voter
            {missingVoters.length > 1 ? "s" : ""}:
          </p>
          <div className="flex flex-wrap gap-2">
            {missingVoters.map((voter) => (
              <span
                key={voter.address}
                className="inline-flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900/50 px-2.5 py-1"
                title={voter.address}
              >
                <AddressAvatar address={voter.address} />
                <span className="text-xs text-zinc-500">
                  {aliases[voter.address.toLowerCase()] ? (
                    <>
                      <span className="font-medium text-zinc-400">
                        {aliases[voter.address.toLowerCase()]}
                      </span>{" "}
                      <span className="font-mono">
                        {truncateAddress(voter.address)}
                      </span>
                    </>
                  ) : (
                    <span className="font-mono">
                      {truncateAddress(voter.address)}
                    </span>
                  )}
                </span>
              </span>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-sm text-green-400">
          ✓ All ballots collected — ready to count
        </p>
      )}
    </div>
  );
}
