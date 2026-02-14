import Link from "next/link";
import { AddressAvatar } from "../../_components/AddressAvatar";
import { CopyButton } from "../../_components/CopyButton";

interface VoterRegisteredProps {
  voterLink: string;
  address: string | undefined;
}

export function VoterRegistered({ voterLink, address }: VoterRegisteredProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mb-4 text-4xl">✅</div>
          <h1 className="text-3xl font-bold tracking-tight">You're In</h1>
          <p className="mt-2 text-zinc-400">
            Send this link to whoever is setting up the election so they can add
            you.
          </p>
        </div>

        <div className="rounded-xl border border-zinc-800 p-6">
          <p className="mb-3 text-sm font-semibold text-zinc-400">
            Your Voter Link
          </p>
          <div className="flex items-center gap-3">
            <code className="min-w-0 flex-1 truncate rounded-lg bg-zinc-900 px-3 py-2 font-mono text-sm text-zinc-300">
              {voterLink}
            </code>
            <CopyButton text={voterLink} />
          </div>
          <p className="mt-3 text-xs text-zinc-500">
            They can open this link or paste it when creating an election. This
            is a one-time step — the same key works for all elections.
          </p>
        </div>

        <Link
          href="/"
          className="block rounded-full border border-zinc-700 px-8 py-3 text-center text-sm font-semibold transition-colors hover:border-zinc-500 hover:bg-zinc-900"
        >
          Back to Home
        </Link>

        {address && (
          <div
            className="flex items-center justify-center gap-2"
            title={address.toLowerCase()}
          >
            <AddressAvatar address={address} />
            <p className="font-mono text-xs text-zinc-600">
              {address.toLowerCase()}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
