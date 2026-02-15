"use client";

import { ConnectKitButton } from "connectkit";
import { Send } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useAccount, useSignMessage } from "wagmi";

import { ApprovalVoting } from "./_components/ApprovalVoting";
import { BallotCast } from "./_components/BallotCast";
import { ElectionDetails } from "./_components/ElectionDetails";
import { RankedChoice } from "./_components/RankedChoice";
import { ScoreVoting } from "./_components/ScoreVoting";
import { SingleChoice } from "./_components/SingleChoice";
import { useElectionConfig } from "./_hooks/useElectionConfig";
import { useVoteSubmission } from "./_hooks/useVoteSubmission";

function ElectionPageContent() {
  const searchParams = useSearchParams();
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();

  const { config, electionId, parseError } = useElectionConfig(searchParams);

  const [singleChoice, setSingleChoice] = useState<number | null>(null);
  const [approvalChoices, setApprovalChoices] = useState<Set<number>>(
    new Set(),
  );
  const [rankedChoices, setRankedChoices] = useState<(number | null)[]>([]);
  const [scoreChoices, setScoreChoices] = useState<number[]>([]);

  // Initialize ranked/score arrays when config loads
  const [initialized, setInitialized] = useState(false);
  if (config && !initialized) {
    const numPositions =
      config.votingMethod === "ranked"
        ? (config.rankedWeights?.length ?? 3)
        : 0;
    setRankedChoices(new Array(numPositions).fill(null));
    setScoreChoices(new Array(config.candidates?.length ?? 0).fill(0));
    setInitialized(true);
  }

  const { status, resultString, handleSubmitVote } = useVoteSubmission({
    config,
    electionId,
    address,
    signMessageAsync,
  });

  const isAuthorized =
    config && address
      ? config.voters.some(
          (v) => v.address.toLowerCase() === address.toLowerCase(),
        )
      : false;

  function toggleApproval(idx: number) {
    setApprovalChoices((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }

  function isSubmitDisabled(): boolean {
    if (!config) return true;
    if (config.votingMethod === "single") return singleChoice === null;
    if (config.votingMethod === "approval") return approvalChoices.size === 0;
    if (config.votingMethod === "ranked")
      return rankedChoices.some((c) => c === null);
    return false;
  }

  function onSubmit() {
    if (!config) return;
    let selection: number | number[];
    if (config.votingMethod === "single") {
      selection = singleChoice as number;
    } else if (config.votingMethod === "approval") {
      selection = Array.from(approvalChoices);
    } else if (config.votingMethod === "score") {
      selection = scoreChoices;
    } else {
      selection = rankedChoices as number[];
    }
    handleSubmitVote(selection);
  }

  if (parseError) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="rounded-xl border border-red-800 bg-red-950/30 p-8 text-center">
          <p className="text-lg font-semibold text-red-400">{parseError}</p>
          <p className="mt-2 text-sm text-zinc-400">
            Please check the election link and try again.
          </p>
        </div>
      </div>
    );
  }

  if (!config || !electionId) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-zinc-400">Loading election...</p>
      </div>
    );
  }

  if (resultString) {
    return <BallotCast resultString={resultString} config={config} />;
  }

  return (
    <div className="flex min-h-screen flex-col items-center px-6 py-16">
      <div className="w-full max-w-2xl space-y-8">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            {config.emoji && (
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-zinc-800 text-3xl">
                {config.emoji}
              </div>
            )}
            <h1 className="text-3xl font-bold tracking-tight">
              {config.title}
            </h1>
          </div>
          <p className="text-zinc-400">{config.description}</p>
        </div>

        <ElectionDetails config={config} electionId={electionId} />

        <div className="rounded-xl border border-zinc-800 p-6 space-y-4">
          <h2 className="text-lg font-semibold">Connect Wallet to Vote</h2>
          <ConnectKitButton />

          {isConnected && !isAuthorized && (
            <div className="rounded-lg border border-red-800 bg-red-950/30 p-4">
              <p className="text-sm text-red-400">
                Your wallet ({address}) is not on the voter allowlist for this
                election.
              </p>
            </div>
          )}
        </div>

        {isConnected && isAuthorized && (
          <div className="rounded-xl border border-zinc-800 p-6 space-y-6">
            <h2 className="text-lg font-semibold">Cast Your Vote</h2>

            {config.votingMethod === "single" && (
              <SingleChoice
                candidates={config.candidates}
                selected={singleChoice}
                onChange={setSingleChoice}
              />
            )}

            {config.votingMethod === "approval" && (
              <ApprovalVoting
                candidates={config.candidates}
                selected={approvalChoices}
                onToggle={toggleApproval}
              />
            )}

            {config.votingMethod === "ranked" && (
              <RankedChoice
                candidates={config.candidates}
                rankedChoices={rankedChoices}
                rankedWeights={config.rankedWeights ?? [5, 3, 1]}
                onUpdate={(position, candidateIdx) => {
                  setRankedChoices((prev) => {
                    const next = [...prev];
                    next[position] = candidateIdx;
                    return next;
                  });
                }}
              />
            )}

            {config.votingMethod === "score" && (
              <ScoreVoting
                candidates={config.candidates}
                scoreChoices={scoreChoices}
                scoreMax={config.scoreMax ?? 5}
                onUpdate={(idx, value) => {
                  setScoreChoices((prev) => {
                    const next = [...prev];
                    next[idx] = value;
                    return next;
                  });
                }}
              />
            )}

            {status && (
              <p
                className={`text-sm ${status.startsWith("Error") ? "text-red-400" : "text-zinc-400"}`}
              >
                {status}
              </p>
            )}

            <div className="rounded-lg border border-zinc-800 bg-zinc-900/30 px-4 py-3">
              <p className="text-xs text-zinc-500">
                Submitting will ask for two wallet signatures. Neither sends a
                transaction or spends any funds — the first creates your voter
                identity, the second signs your ballot so it can be verified.
              </p>
            </div>

            <button
              type="button"
              onClick={onSubmit}
              disabled={
                isSubmitDisabled() || (!!status && !status.startsWith("Error"))
              }
              className="flex items-center gap-2 rounded-full bg-white px-8 py-3 text-sm font-semibold text-black transition-colors hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Send size={14} />
              Submit Vote
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ElectionPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          Loading...
        </div>
      }
    >
      <ElectionPageContent />
    </Suspense>
  );
}
