import Link from "next/link";
import { CopyButton } from "../../_components/CopyButton";
import type { ElectionResult } from "../_hooks/useElectionForm";

interface ElectionCreatedProps {
  result: ElectionResult;
  emoji: string;
}

export function ElectionCreated({ result, emoji }: ElectionCreatedProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mb-4 text-4xl">{emoji || "✅"}</div>
          <h1 className="text-3xl font-bold tracking-tight">
            Election Created
          </h1>
          <p className="mt-2 text-zinc-400">
            Send this link to all voters to start collecting ballots.
          </p>
        </div>

        <div className="rounded-xl border border-zinc-800 p-6">
          <p className="mb-3 text-sm font-semibold text-zinc-400">
            Voting Link
          </p>
          <div className="flex items-center gap-3">
            <code className="min-w-0 flex-1 truncate rounded-lg bg-zinc-900 px-3 py-2 font-mono text-sm text-zinc-300">
              {result.votingLink}
            </code>
            <CopyButton text={result.votingLink} />
          </div>
          <p className="mt-3 text-xs text-zinc-500">
            Each voter will connect their wallet and cast their vote. Once
            everyone has voted, collect and count the results.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Link
            href={`/tally?config=${encodeURIComponent(result.configBase64)}`}
            className="rounded-full bg-white px-8 py-3 text-center text-sm font-semibold text-black transition-colors hover:bg-zinc-200"
          >
            Collect &amp; Count Votes →
          </Link>
          <Link
            href="/"
            className="rounded-full border border-zinc-700 px-8 py-3 text-center text-sm font-semibold transition-colors hover:border-zinc-500 hover:bg-zinc-900"
          >
            Back to Home
          </Link>
        </div>

        <p
          className="text-center font-mono text-xs text-zinc-600"
          title={result.electionId}
        >
          ID: {result.electionId.slice(0, 16)}...
        </p>
      </div>
    </div>
  );
}
