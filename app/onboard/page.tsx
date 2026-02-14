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

        <div className="rounded-xl border border-zinc-800 bg-zinc-950/30 p-8 space-y-6 backdrop-blur-sm">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-zinc-400">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-800 text-xs font-bold">
                1
              </div>
              <span>Connect your wallet</span>
            </div>
          </div>

          <ConnectKitButton.Custom>
            {({ isConnected, show, truncatedAddress, ensName }) => (
              <button
                onClick={show}
                className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-zinc-800 to-zinc-700 px-6 py-4 text-base font-semibold transition-all hover:from-zinc-700 hover:to-zinc-600 hover:shadow-lg hover:shadow-zinc-900/50"
              >
                <div className="relative z-10 flex items-center justify-center gap-3">
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                    />
                  </svg>
                  <span>
                    {isConnected ? ensName || truncatedAddress : "Connect Wallet"}
                  </span>
                </div>
                <div className="absolute inset-0 -z-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 opacity-0 transition-opacity group-hover:opacity-100" />
              </button>
            )}
          </ConnectKitButton.Custom>

          {isConnected && (
            <div className="space-y-6 border-t border-zinc-800 pt-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-zinc-400">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-800 text-xs font-bold">
                    2
                  </div>
                  <span>Generate your voter key</span>
                </div>
              </div>

              {status && (
                <div
                  className={`rounded-lg border px-4 py-3 text-sm ${
                    status.startsWith("Error")
                      ? "border-red-900/50 bg-red-950/20 text-red-400"
                      : "border-blue-900/50 bg-blue-950/20 text-blue-400"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {!status.startsWith("Error") && (
                      <svg
                        className="h-4 w-4 animate-spin"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                    )}
                    <span>{status}</span>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={handleGenerate}
                disabled={!!status && !status.startsWith("Error")}
                className="group relative w-full overflow-hidden rounded-xl bg-white px-8 py-4 text-base font-semibold text-black transition-all hover:bg-zinc-100 hover:shadow-lg hover:shadow-white/10 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white disabled:hover:shadow-none"
              >
                <div className="relative z-10 flex items-center justify-center gap-3">
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                    />
                  </svg>
                  <span>Generate Key</span>
                </div>
                <div className="absolute inset-0 -z-0 bg-gradient-to-r from-transparent via-zinc-200 to-transparent opacity-0 transition-opacity group-hover:opacity-100 group-disabled:opacity-0" />
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
