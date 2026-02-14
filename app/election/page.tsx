"use client";

import { ConnectKitButton } from "connectkit";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useAccount, useSignMessage } from "wagmi";
import {
  applyMask,
  type BallotData,
  ballotSignMessage,
  computeElectionId,
  computeMaskVector,
  deriveKeypair,
  type ElectionConfig,
  encodeVoteVector,
  serializeBallot,
} from "../lib/crypto";

function ElectionPageContent() {
  const searchParams = useSearchParams();
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();

  const [config, setConfig] = useState<ElectionConfig | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [singleChoice, setSingleChoice] = useState<number | null>(null);
  const [approvalChoices, setApprovalChoices] = useState<Set<number>>(
    new Set(),
  );
  const [rankedChoices, setRankedChoices] = useState<(number | null)[]>([]);
  const [scoreChoices, setScoreChoices] = useState<number[]>([]);
  const [resultString, setResultString] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const raw = searchParams.get("config");
    if (!raw) {
      setParseError("Missing election configuration in URL.");
      return;
    }
    try {
      const decoded = JSON.parse(atob(raw));
      setConfig(decoded);
      const numPositions =
        decoded.votingMethod === "ranked"
          ? (decoded.rankedWeights?.length ?? 3)
          : 0;
      setRankedChoices(new Array(numPositions).fill(null));
      setScoreChoices(new Array(decoded.candidates?.length ?? 0).fill(0));
    } catch {
      setParseError("Invalid election configuration.");
    }
  }, [searchParams]);

  const electionId = useMemo(
    () => (config ? computeElectionId(config) : null),
    [config],
  );

  const isAuthorized = useMemo(() => {
    if (!config || !address) return false;
    const lower = address.toLowerCase();
    return config.voters.some((v) => v.address.toLowerCase() === lower);
  }, [config, address]);

  function toggleApproval(idx: number) {
    setApprovalChoices((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }

  function updateRanked(position: number, candidateIdx: number | null) {
    setRankedChoices((prev) => {
      const next = [...prev];
      next[position] = candidateIdx;
      return next;
    });
  }

  function updateScore(idx: number, value: number) {
    setScoreChoices((prev) => {
      const next = [...prev];
      next[idx] = value;
      return next;
    });
  }

  function isSubmitDisabled(): boolean {
    if (!config) return true;
    if (config.votingMethod === "single") return singleChoice === null;
    if (config.votingMethod === "approval") return approvalChoices.size === 0;
    if (config.votingMethod === "ranked")
      return rankedChoices.some((c) => c === null);
    if (config.votingMethod === "score") return false; // all-zeros is valid
    return true;
  }

  async function handleSubmitVote() {
    if (!config || !address || !electionId) return;

    try {
      setStatus("Encoding vote...");
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

      const voteVector = encodeVoteVector(
        config.votingMethod,
        config.candidates.length,
        selection,
        config.rankedWeights,
      );

      setStatus("Signing to derive your BallotZero key...");
      const regSig = await signMessageAsync({ message: "BallotZero:onboard" });

      setStatus("Deriving election keypair...");
      const { esk } = deriveKeypair(regSig);

      setStatus("Computing mask vector...");
      const maskVector = computeMaskVector(
        address,
        esk,
        config.voters,
        config.candidates.length,
        electionId,
      );

      setStatus("Applying mask to vote...");
      const maskedVote = applyMask(voteVector, maskVector);

      setStatus("Waiting for ballot signature...");
      const ballotMsg = ballotSignMessage(electionId, maskedVote);
      const ballotSig = await signMessageAsync({ message: ballotMsg });

      const ballot: BallotData = {
        election_id: electionId,
        voter_address: address,
        masked_vote: maskedVote,
        signature: ballotSig,
      };

      const serialized = serializeBallot(ballot);
      const link = `${window.location.origin}/aggregate#ballot=${serialized}`;
      setResultString(link);
      setStatus(null);
      navigator.clipboard.writeText(link).catch(() => {});
    } catch (err) {
      setStatus(
        `Error: ${err instanceof Error ? err.message : "Signing rejected or failed."}`,
      );
    }
  }

  function copyResult() {
    if (!resultString) return;
    navigator.clipboard.writeText(resultString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

  const methodLabels: Record<ElectionConfig["votingMethod"], string> = {
    single: "Single Choice",
    approval: "Approval Voting",
    ranked: "Ranked Choice",
    score: "Score Voting",
  };

  if (resultString) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6 py-16">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <div className="mb-4 text-4xl">✅</div>
            <h1 className="text-3xl font-bold tracking-tight">Ballot Cast</h1>
            <p className="mt-2 text-zinc-400">
              Send this link to the election organizer to submit your vote.
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
              <button
                type="button"
                onClick={copyResult}
                className="shrink-0 rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-medium transition-colors hover:border-zinc-500 hover:bg-zinc-800"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
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
            <span>{methodLabels[config.votingMethod]}</span>
            <span className="mx-1.5">·</span>
            <span>{config.candidates.length} candidates</span>
          </div>
        </div>
      </div>
    );
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

        <div className="rounded-xl border border-zinc-800 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-500">Voting Method</span>
            <span className="text-sm font-medium">
              {methodLabels[config.votingMethod]}
            </span>
          </div>
          {config.votingMethod === "ranked" && config.rankedWeights && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-500">Point Weights</span>
              <span className="text-sm font-medium">
                {config.rankedWeights.join(", ")}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-500">Candidates</span>
            <span className="text-sm font-medium">
              {config.candidates.length}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-500">Eligible Voters</span>
            <span className="text-sm font-medium">{config.voters.length}</span>
          </div>
          <div className="border-t border-zinc-800 pt-4">
            <span className="text-sm text-zinc-500">Election ID</span>
            <p className="mt-1 break-all font-mono text-xs text-zinc-400">
              {electionId}
            </p>
          </div>
        </div>

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
              <div className="space-y-3">
                {config.candidates.map((candidate, idx) => (
                  <label
                    key={candidate}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors ${
                      singleChoice === idx
                        ? "border-white bg-zinc-800/50"
                        : "border-zinc-800 hover:border-zinc-600"
                    }`}
                  >
                    <input
                      type="radio"
                      name="single-choice"
                      checked={singleChoice === idx}
                      onChange={() => setSingleChoice(idx)}
                      className="accent-white"
                    />
                    <span>{candidate}</span>
                  </label>
                ))}
              </div>
            )}

            {config.votingMethod === "approval" && (
              <div className="space-y-3">
                <p className="text-sm text-zinc-400">
                  Select all candidates you approve of.
                </p>
                {config.candidates.map((candidate, idx) => (
                  <label
                    key={candidate}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors ${
                      approvalChoices.has(idx)
                        ? "border-white bg-zinc-800/50"
                        : "border-zinc-800 hover:border-zinc-600"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={approvalChoices.has(idx)}
                      onChange={() => toggleApproval(idx)}
                      className="accent-white"
                    />
                    <span>{candidate}</span>
                  </label>
                ))}
              </div>
            )}

            {config.votingMethod === "ranked" && (
              <div className="space-y-4">
                <p className="text-sm text-zinc-400">
                  Select your ranked choices. Points:{" "}
                  {(config.rankedWeights ?? [5, 3, 1]).join(", ")}
                </p>
                {rankedChoices.map((selected, position) => {
                  const weights = config.rankedWeights ?? [5, 3, 1];
                  const usedByOthers = rankedChoices
                    .filter((_, i) => i !== position)
                    .filter((v) => v !== null) as number[];
                  const rankId = `ranked-${position}`;
                  return (
                    <div key={rankId} className="space-y-1">
                      <label htmlFor={rankId} className="text-sm text-zinc-400">
                        {position === 0
                          ? "1st"
                          : position === 1
                            ? "2nd"
                            : position === 2
                              ? "3rd"
                              : `${position + 1}th`}{" "}
                        Choice ({weights[position]} pts)
                      </label>
                      <select
                        id={rankId}
                        value={selected ?? ""}
                        onChange={(e) =>
                          updateRanked(
                            position,
                            e.target.value === ""
                              ? null
                              : Number(e.target.value),
                          )
                        }
                        className="w-full rounded-lg border border-zinc-700 bg-zinc-900 p-3 text-sm text-zinc-200 focus:outline-none focus:border-zinc-500"
                      >
                        <option value="">Select a candidate</option>
                        {config.candidates.map((candidate, idx) => (
                          <option
                            key={candidate}
                            value={idx}
                            disabled={usedByOthers.includes(idx)}
                          >
                            {candidate}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                })}
              </div>
            )}

            {config.votingMethod === "score" && (
              <div className="space-y-4">
                <p className="text-sm text-zinc-400">
                  Rate each candidate from 0 to {config.scoreMax ?? 5}.
                </p>
                {config.candidates.map((candidate, idx) => {
                  const max = config.scoreMax ?? 5;
                  return (
                    <div
                      key={candidate}
                      className="rounded-lg border border-zinc-800 p-4 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{candidate}</span>
                        <span className="text-sm font-bold tabular-nums text-zinc-300">
                          {scoreChoices[idx] ?? 0}/{max}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={max}
                        value={scoreChoices[idx] ?? 0}
                        onChange={(e) =>
                          updateScore(idx, Number(e.target.value))
                        }
                        className="w-full accent-white"
                      />
                      <div className="flex justify-between text-xs text-zinc-600">
                        <span>0</span>
                        <span>{max}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {status && (
              <p
                className={`text-sm ${status.startsWith("Error") ? "text-red-400" : "text-zinc-400"}`}
              >
                {status}
              </p>
            )}

            <button
              type="button"
              onClick={handleSubmitVote}
              disabled={
                isSubmitDisabled() || (!!status && !status.startsWith("Error"))
              }
              className="rounded-full bg-white px-8 py-3 text-sm font-semibold text-black transition-colors hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-40"
            >
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
