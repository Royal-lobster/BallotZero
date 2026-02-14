import { secp256k1 } from "@noble/curves/secp256k1.js";
import { bytesToHex } from "@noble/hashes/utils.js";
import { useCallback, useRef, useState } from "react";
import { truncateAddress } from "../../_components/utils";
import type { Voter } from "../../lib/crypto";
import type { AliasMap } from "../../lib/storage";

interface VoterListProps {
  voters: Voter[];
  aliases: AliasMap;
  voterError: string;
  addressBookEntries: [string, string][];
  onAdd: (raw: string) => void;
  onRemove: (address: string) => void;
  onAddFromAddressBook: () => void;
  onUpdateAlias: (address: string, name: string) => void;
  onClearError: () => void;
}

function compressedEpkHex(voter: Voter) {
  const point = secp256k1.Point.fromAffine({
    x: BigInt(`0x${voter.epk.x}`),
    y: BigInt(`0x${voter.epk.y}`),
  });
  return bytesToHex(point.toBytes(true));
}

export function VoterList({
  voters,
  aliases,
  voterError,
  addressBookEntries,
  onAdd,
  onRemove,
  onAddFromAddressBook,
  onUpdateAlias,
  onClearError,
}: VoterListProps) {
  const [voterInput, setVoterInput] = useState("");
  const [copied, setCopied] = useState(false);
  const voterInputRef = useRef<HTMLInputElement>(null);

  const copyJoinLink = useCallback(async () => {
    const link = `${window.location.origin}/join`;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label
          htmlFor="voterInput"
          className="text-sm font-medium text-zinc-300"
        >
          Voters <span className="text-red-400">*</span>
        </label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={copyJoinLink}
            className="rounded-lg border border-zinc-700 px-2.5 py-1 text-xs font-medium text-zinc-400 transition-colors hover:border-zinc-500 hover:text-zinc-200"
          >
            {copied ? "Copied!" : "Copy join link"}
          </button>
          {addressBookEntries.length > 0 && (
            <button
              type="button"
              onClick={onAddFromAddressBook}
              className="rounded-lg border border-zinc-700 px-2.5 py-1 text-xs font-medium text-zinc-400 transition-colors hover:border-zinc-500 hover:text-zinc-200"
            >
              + Add known ({addressBookEntries.length})
            </button>
          )}
        </div>
      </div>
      <p className="mb-2 text-xs text-zinc-500">
        Paste the link each voter shared with you after joining.
      </p>
      <div className="flex w-full items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 focus-within:border-zinc-600">
        <input
          ref={voterInputRef}
          id="voterInput"
          type="text"
          value={voterInput}
          onChange={(e) => {
            setVoterInput(e.target.value);
            onClearError();
          }}
          onPaste={(e) => {
            e.preventDefault();
            const pasted = e.clipboardData.getData("text/plain");
            onAdd(pasted);
            setVoterInput("");
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onAdd(voterInput);
              setVoterInput("");
            }
          }}
          placeholder="Paste a voter key or link..."
          className="min-w-0 flex-1 bg-transparent font-mono text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none"
        />
      </div>
      {voterError && (
        <p className="mt-1.5 text-xs text-red-400">{voterError}</p>
      )}

      {voters.length > 0 && (
        <div className="mt-3 space-y-2">
          {voters.map((voter) => {
            const epkHex = compressedEpkHex(voter);
            const avatarColor = `#${voter.address.slice(2, 8)}`;
            const avatarLabel = voter.address.slice(2, 4).toUpperCase();
            const alias = aliases[voter.address.toLowerCase()] ?? "";
            return (
              <div
                key={voter.address}
                className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2"
                title={`Address: ${voter.address}\nPublic Key: ${epkHex}`}
              >
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                  style={{ backgroundColor: avatarColor }}
                >
                  {avatarLabel}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="shrink-0 font-mono text-sm text-zinc-200">
                      {truncateAddress(voter.address)}
                    </p>
                    <input
                      type="text"
                      value={alias}
                      onChange={(e) =>
                        onUpdateAlias(voter.address, e.target.value)
                      }
                      placeholder="add alias..."
                      className="min-w-0 flex-1 bg-transparent text-sm text-zinc-100 placeholder:text-zinc-700 focus:outline-none"
                    />
                  </div>
                  <p className="truncate font-mono text-xs text-zinc-500">
                    epk: {epkHex.slice(0, 8)}...
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onRemove(voter.address)}
                  className="shrink-0 text-zinc-500 transition-colors hover:text-red-400"
                  aria-label={`Remove voter ${voter.address}`}
                >
                  x
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
