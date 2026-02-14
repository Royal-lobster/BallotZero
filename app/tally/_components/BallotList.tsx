import { X } from "lucide-react";
import { AddressAvatar } from "../../_components/AddressAvatar";
import { truncateAddress } from "../../_components/utils";
import type { BallotData } from "../../lib/crypto";
import type { AliasMap } from "../../lib/storage";

interface BallotListProps {
  ballots: BallotData[];
  aliases: AliasMap;
  onRemove: (index: number) => void;
}

export function BallotList({ ballots, aliases, onRemove }: BallotListProps) {
  if (ballots.length === 0) return null;

  return (
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
                <>
                  <span className="font-medium">
                    {aliases[ballot.voter_address.toLowerCase()]}
                  </span>{" "}
                  <span className="font-mono text-xs text-zinc-500">
                    {truncateAddress(ballot.voter_address)}
                  </span>
                </>
              ) : (
                <span className="font-mono">
                  {truncateAddress(ballot.voter_address)}
                </span>
              )}
            </p>
            <p className="text-xs text-green-400/70">ballot received</p>
          </div>
          <button
            type="button"
            onClick={() => onRemove(i)}
            className="shrink-0 text-zinc-500 transition-colors hover:text-red-400"
            aria-label={`Remove ballot from ${ballot.voter_address}`}
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}
