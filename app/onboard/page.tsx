"use client";

import { useState } from "react";
import Link from "next/link";
import { useAccount, useSignMessage } from "wagmi";
import { ConnectKitButton } from "connectkit";
import { type Voter, deriveKeypair, serializeVoter } from "../lib/crypto";

export default function OnboardPage() {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();

  const [status, setStatus] = useState<string | null>(null);
  const [voterKey, setVoterKey] = useState<string | null>(null);
  const [voterLink, setVoterLink] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedRaw, setCopiedRaw] = useState(false);

  async function handleGenerate() {
    if (!address) return;

    try {
      setStatus("Waiting for wallet signature...");
      const sig = await signMessageAsync({ message: "BallotZero:onboard" });

      setStatus("Deriving keypair...");
      const { epk } = deriveKeypair(sig);

      const voter: Voter = { address: address.toLowerCase(), epk };
      const serialized = serializeVoter(voter);

      const link = `${window.location.origin}/create#voterkey=${serialized}`;
      setVoterKey(serialized);
      setVoterLink(link);
      setStatus(null);
      navigator.clipboard.writeText(link).catch(() => {});
    } catch (err) {
      setStatus(
        `Error: ${err instanceof Error ? err.message : "Signing rejected or failed."}`,
      );
    }
  }

  function copyLink() {
    if (!voterLink) return;
    navigator.clipboard.writeText(voterLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  }

  function copyRawKey() {
    if (!voterKey) return;
    navigator.clipboard.writeText(voterKey);
    setCopiedRaw(true);
    setTimeout(() => setCopiedRaw(false), 2000);
  }

  return (
    <div className="flex min-h-screen flex-col items-center px-6 py-16">
      <div className="w-full max-w-2xl space-y-8">
        <div>
          <Link
            href="/"
            className="mb-6 inline-flex items-center gap-1 text-sm text-zinc-400 transition-colors hover:text-zinc-200"
          >
            ← Back
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">
            Get Your Voter Key
          </h1>
          <p className="mt-2 text-zinc-400">
            This is a one-time step. Connect your wallet and sign a message to
            derive your BallotZero keypair. Share the resulting voter key with
            the election organizer so they can add you to an election.
          </p>
        </div>

        {voterKey ? (
          <div className="rounded-xl border border-zinc-800 p-6 space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-green-400 text-lg">✓</span>
              <h2 className="text-lg font-semibold">Voter Key Generated</h2>
            </div>
            <p className="text-sm text-zinc-400">
              Share this link with the election organizer. They can open it or
              paste it to add you to an election.
            </p>
            <div className="space-y-2">
              <span className="text-sm text-zinc-500">Wallet Address</span>
              <p className="break-all font-mono text-xs text-zinc-300">
                {address?.toLowerCase()}
              </p>
            </div>
            <div className="space-y-2">
              <span className="text-sm text-zinc-500">Shareable Link</span>
              <div className="break-all rounded-lg border border-zinc-700 bg-zinc-900 p-4 font-mono text-xs text-zinc-300">
                {voterLink}
              </div>
              <button
                type="button"
                onClick={copyLink}
                className="rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-zinc-200"
              >
                {copiedLink ? "Copied!" : "Copy Link"}
              </button>
            </div>
            <div className="space-y-2">
              <span className="text-sm text-zinc-500">Raw Voter Key</span>
              <div className="break-all rounded-lg border border-zinc-800 bg-zinc-900/50 p-3 font-mono text-[11px] text-zinc-500">
                {voterKey}
              </div>
              <button
                type="button"
                onClick={copyRawKey}
                className="rounded-full border border-zinc-700 px-5 py-2 text-xs font-medium text-zinc-400 transition-colors hover:border-zinc-500 hover:text-zinc-200"
              >
                {copiedRaw ? "Copied!" : "Copy Raw Key"}
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-zinc-800 p-6 space-y-4">
            <h2 className="text-lg font-semibold">Connect Wallet</h2>
            <ConnectKitButton />

            {isConnected && (
              <div className="space-y-4 pt-2">
                {status && (
                  <p
                    className={`text-sm ${status.startsWith("Error") ? "text-red-400" : "text-zinc-400"}`}
                  >
                    {status}
                  </p>
                )}

                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={!!status && !status.startsWith("Error")}
                  className="rounded-full bg-white px-8 py-3 text-sm font-semibold text-black transition-colors hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Generate Key
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
