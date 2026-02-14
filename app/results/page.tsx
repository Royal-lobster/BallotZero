"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import {
  type AggregatedResult,
  computeElectionId,
  type ElectionConfig,
} from "../lib/crypto";
import { ElectionInfo } from "./_components/ElectionInfo";
import { TallyTable } from "./_components/TallyTable";
import { VerificationDetails } from "./_components/VerificationDetails";
import { VerifyBallot } from "./_components/VerifyBallot";

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

        <h1 className="mb-2 text-3xl font-bold tracking-tight">
          Election Results
        </h1>
        <p className="mb-8 text-zinc-400">
          View the final results and verify your vote was counted.
        </p>

        <ElectionInfo config={config} electionId={electionId} />
        <TallyTable config={config} tally={result.tally} />
        <VerificationDetails result={result} />
        <VerifyBallot result={result} config={config} />
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
