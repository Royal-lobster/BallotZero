import Link from "next/link";
import { CopyButton } from "../../_components/CopyButton";

interface TallyResultProps {
  resultsLink: string;
  validCount: number;
}

export function TallyResult({ resultsLink, validCount }: TallyResultProps) {
  const fullResultsUrl = `${typeof window !== "undefined" ? window.location.origin : ""}${resultsLink}`;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mb-4 text-4xl">✅</div>
          <h1 className="text-3xl font-bold tracking-tight">Votes Counted</h1>
          <p className="mt-2 text-zinc-400">
            {validCount} ballot{validCount !== 1 ? "s" : ""} counted
            successfully.
          </p>
        </div>

        <div className="rounded-xl border border-zinc-800 p-6">
          <p className="mb-3 text-sm font-semibold text-zinc-400">
            Results Link
          </p>
          <div className="flex items-center gap-3">
            <code className="min-w-0 flex-1 truncate rounded-lg bg-zinc-900 px-3 py-2 font-mono text-sm text-zinc-300">
              {fullResultsUrl}
            </code>
            <CopyButton text={fullResultsUrl} />
          </div>
          <p className="mt-3 text-xs text-zinc-500">
            Share this link so anyone can verify the election results.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Link
            href={resultsLink}
            className="rounded-full bg-white px-8 py-3 text-center text-sm font-semibold text-black transition-colors hover:bg-zinc-200"
          >
            View Results →
          </Link>
          <Link
            href="/"
            className="rounded-full border border-zinc-700 px-8 py-3 text-center text-sm font-semibold transition-colors hover:border-zinc-500 hover:bg-zinc-900"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
