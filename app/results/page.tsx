"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import {
  type AggregatedResult,
  computeElectionId,
  type ElectionConfig,
} from "../lib/crypto";
import { ResultsChart } from "./_components/ResultsChart";
import { TallyTable } from "./_components/TallyTable";
import { VerificationSection } from "./_components/VerificationSection";

const METHOD_LABELS: Record<string, string> = {
  single: "Single Choice",
  approval: "Approval Voting",
  ranked: "Ranked Choice",
  score: "Score Voting",
};

function ResultsContent() {
  const searchParams = useSearchParams();
  const dataParam = searchParams.get("data");
  const configParam = searchParams.get("config");

  if (!dataParam || !configParam) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6">
        <p className="text-zinc-400">
          Missing results data or config in URL parameters.
        </p>
        <Link
          href="/"
          className="mt-4 text-sm text-zinc-500 transition-colors hover:text-zinc-300"
        >
          ← Back to Home
        </Link>
      </div>
    );
  }

  let result: AggregatedResult;
  let config: ElectionConfig;
  try {
    const resultJson = new TextDecoder().decode(
      Uint8Array.from(atob(dataParam), (c) => c.charCodeAt(0)),
    );
    result = JSON.parse(resultJson) as AggregatedResult;

    const configJson = new TextDecoder().decode(
      Uint8Array.from(atob(configParam), (c) => c.charCodeAt(0)),
    );
    config = JSON.parse(configJson) as ElectionConfig;
  } catch {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6">
        <p className="text-red-400">
          Failed to parse results data or election config.
        </p>
        <Link
          href="/"
          className="mt-4 text-sm text-zinc-500 transition-colors hover:text-zinc-300"
        >
          ← Back to Home
        </Link>
      </div>
    );
  }

  const electionId = computeElectionId(config);

  return (
    <div className="flex min-h-screen flex-col items-center px-6 py-16">
      <div className="w-full max-w-2xl">
        <Link
          href="/"
          className="mb-8 inline-block text-sm text-zinc-500 transition-colors hover:text-zinc-300"
        >
          ← Back to Home
        </Link>

        {/* Election header */}
        <div className="mb-8 flex items-start gap-4">
          {config.emoji && (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-3xl">
              {config.emoji}
            </div>
          )}
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {config.title}
            </h1>
            {config.description && (
              <p className="mt-1 text-zinc-400">{config.description}</p>
            )}
            <p className="mt-1 text-sm text-zinc-500">
              {METHOD_LABELS[config.votingMethod] ?? config.votingMethod} · {config.candidates.length} candidates
            </p>
          </div>
        </div>

        <ResultsChart config={config} tally={result.tally} />
        <TallyTable config={config} tally={result.tally} />
        <VerificationSection result={result} config={config} />

        {/* Election ID footer */}
        <div className="mt-8 text-center">
          <span className="text-xs text-zinc-500">Election ID: </span>
          <span className="font-mono text-xs text-zinc-600 break-all">
            {electionId}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          Loading...
        </div>
      }
    >
      <ResultsContent />
    </Suspense>
  );
}
