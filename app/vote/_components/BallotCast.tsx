import Link from "next/link";
import { CopyButton } from "../../_components/CopyButton";
import type { ElectionConfig } from "../../lib/crypto";

const METHOD_LABELS: Record<ElectionConfig["votingMethod"], string> = {
  single: "Single Choice",
  approval: "Approval Voting",
  ranked: "Ranked Choice",
  score: "Score Voting",
};

interface BallotCastProps {
  resultString: string;
  config: ElectionConfig;
}

export function BallotCast({ resultString, config }: BallotCastProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mb-4 text-4xl">✅</div>
          <h1 className="text-3xl font-bold tracking-tight">Ballot Cast</h1>
          <p className="mt-2 text-zinc-400">
            Send this link to whoever is running the election to submit your
            vote.
          </p>
        </div>

        <div className="rounded-xl border border-zinc-800 p-6">
          <p className="mb-3 text-sm font-semibold text-zinc-400">
            Your Ballot Link
          </p>
          <div className="flex items-center gap-3">
            <code className="min-w-0 flex-1 truncate rounded-lg bg-zinc-900 px-3 py-2 font-mono text-sm text-zinc-300">
              {resultString}
            </code>
            <CopyButton text={resultString} />
          </div>
          <p className="mt-3 text-xs text-zinc-500">
            The link has been auto-copied to your clipboard. Your vote is
            cryptographically masked — no one can see how you voted.
          </p>
        </div>

        <Link
          href="/"
          className="block rounded-full border border-zinc-700 px-8 py-3 text-center text-sm font-semibold transition-colors hover:border-zinc-500 hover:bg-zinc-900"
        >
          Back to Home
        </Link>

        <div className="text-center text-xs text-zinc-600">
          <span>{config.title}</span>
          <span className="mx-1.5">·</span>
          <span>{METHOD_LABELS[config.votingMethod]}</span>
          <span className="mx-1.5">·</span>
          <span>{config.candidates.length} candidates</span>
        </div>
      </div>
    </div>
  );
}
