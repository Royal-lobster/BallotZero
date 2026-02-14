"use client";

import { ConnectKitButton } from "connectkit";
import Link from "next/link";
import { useAccount, useSignMessage } from "wagmi";
import { AddressAvatar } from "../_components/AddressAvatar";
import { VoterRegistered } from "./_components/VoterRegistered";
import { useVoterIdentity } from "./_hooks/useVoterIdentity";

export default function OnboardPage() {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { status, voterKey, voterLink, handleGenerate } = useVoterIdentity({
    address,
    signMessageAsync,
  });

  if (voterKey && voterLink) {
    return <VoterRegistered voterLink={voterLink} address={address} />;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">
            Join an Election
          </h1>
          <p className="mt-2 text-zinc-400">
            Connect your wallet to generate your voter identity. Share it with
            whoever is setting up the election.
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
                type="button"
                onClick={show}
                className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-zinc-800 to-zinc-700 px-6 py-4 text-base font-semibold transition-all hover:from-zinc-700 hover:to-zinc-600 hover:shadow-lg hover:shadow-zinc-900/50"
              >
                <div className="relative z-10 flex items-center justify-center gap-3">
                  {isConnected && address ? (
                    <AddressAvatar address={address} />
                  ) : (
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                      />
                    </svg>
                  )}
                  <span>
                    {isConnected
                      ? ensName || truncatedAddress
                      : "Connect Wallet"}
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
                  <span>Generate your voter identity</span>
                </div>
                <p className="ml-8 text-xs text-zinc-500">
                  Your wallet will ask you to sign a message. This does not send
                  any transaction or spend any funds — it just creates a unique
                  identity for voting.
                </p>
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
                        aria-hidden="true"
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
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                    />
                  </svg>
                  <span>Sign &amp; Generate</span>
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
