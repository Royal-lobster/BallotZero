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

  if (voterKey) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6 py-16">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <div className="mb-4 text-4xl">✅</div>
            <h1 className="text-3xl font-bold tracking-tight">
              Voter Key Generated
            </h1>
            <p className="mt-2 text-zinc-400">
              Send this link to the election organizer to be added to an
              election.
            </p>
          </div>

          <div className="rounded-xl border border-zinc-800 p-6">
            <label className="mb-3 block text-sm font-semibold text-zinc-400">
              Your Voter Link
            </label>
            <div className="flex items-center gap-3">
              <code className="min-w-0 flex-1 truncate rounded-lg bg-zinc-900 px-3 py-2 font-mono text-sm text-zinc-300">
                {voterLink}
              </code>
              <button
                type="button"
                onClick={copyLink}
                className="shrink-0 rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-medium transition-colors hover:border-zinc-500 hover:bg-zinc-800"
              >
                {copiedLink ? "Copied!" : "Copy"}
              </button>
            </div>
            <p className="mt-3 text-xs text-zinc-500">
              The organizer can open this link or paste it when creating an
              election. This is a one-time step — the same key works for all
              elections.
            </p>
          </div>

          <Link
            href="/"
            className="block rounded-full border border-zinc-700 px-8 py-3 text-center text-sm font-semibold transition-colors hover:border-zinc-500 hover:bg-zinc-900"
          >
            Back to Home
          </Link>

          <p
            className="text-center font-mono text-xs text-zinc-600"
            title={address?.toLowerCase()}
          >
            {address?.toLowerCase()}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">
            Get Your Voter Key
          </h1>
          <p className="mt-2 text-zinc-400">
            Connect your wallet and sign a message to derive your BallotZero
            keypair. Share it with the organizer to join an election.
          </p>
        </div>

        <div className="rounded-xl border border-zinc-800 p-6 space-y-4">
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
                className="w-full rounded-full bg-white px-8 py-3 text-sm font-semibold text-black transition-colors hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Generate Key
              </button>
            </div>
          )}
        </div>

        <Link
          href="/"
          className="block text-center text-sm text-zinc-500 transition-colors hover:text-zinc-300"
        >
          ← Back to Home
        </Link>
      </div>
    </div>
  );
}
