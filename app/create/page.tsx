"use client";

import { useState } from "react";
import Link from "next/link";
import {
  computeElectionId,
  deserializeVoter,
  type ElectionConfig,
  type Voter,
} from "../lib/crypto";
import { saveConfig } from "../lib/storage";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="shrink-0 rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-medium transition-colors hover:border-zinc-500 hover:bg-zinc-800"
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

export default function CreateElectionPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [candidates, setCandidates] = useState("");
  const [votersInput, setVotersInput] = useState("");
  const [votingMethod, setVotingMethod] = useState<
    "single" | "approval" | "ranked"
  >("single");
  const [rankedWeights, setRankedWeights] = useState("5,3,1");
  const [errors, setErrors] = useState<string[]>([]);

  const [result, setResult] = useState<{
    electionId: string;
    votingLink: string;
    configBase64: string;
  } | null>(null);

  const validate = (): string[] => {
    const errs: string[] = [];
    if (!title.trim()) errs.push("Title is required.");
    const candidateList = candidates
      .split("\n")
      .map((c) => c.trim())
      .filter(Boolean);
    if (candidateList.length < 2)
      errs.push("At least 2 candidates are required.");
    const voterLines = votersInput
      .split("\n")
      .map((v) => v.trim())
      .filter(Boolean);
    if (voterLines.length < 1)
      errs.push("At least 1 voter is required.");
    for (let i = 0; i < voterLines.length; i++) {
      try {
        deserializeVoter(voterLines[i]);
      } catch {
        errs.push(`Invalid voter key on line ${i + 1}`);
      }
    }
    if (votingMethod === "ranked") {
      const weights = rankedWeights.split(",").map((w) => w.trim());
      if (weights.some((w) => !w || Number.isNaN(Number.parseInt(w, 10)))) {
        errs.push("Ranked weights must be comma-separated numbers.");
      }
    }
    return errs;
  };

  const handleCreate = () => {
    const validationErrors = validate();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors([]);

    const candidateList = candidates
      .split("\n")
      .map((c) => c.trim())
      .filter(Boolean);
    const parsedVoters: Voter[] = votersInput
      .split("\n")
      .map((v) => v.trim())
      .filter(Boolean)
      .map((v) => deserializeVoter(v));

    const config: ElectionConfig = {
      title: title.trim(),
      description: description.trim(),
      candidates: candidateList,
      voters: parsedVoters,
      votingMethod,
      ...(votingMethod === "ranked"
        ? {
            rankedWeights: rankedWeights
              .split(",")
              .map((w) => Number.parseInt(w.trim(), 10)),
          }
        : {}),
    };

    const electionId = computeElectionId(config);
    const configBase64 = btoa(JSON.stringify(config));
    saveConfig(electionId, configBase64);
    const votingLink = `${window.location.origin}/election?config=${encodeURIComponent(configBase64)}`;

    setResult({
      electionId,
      votingLink,
      configBase64,
    });
  };

  if (result) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6 py-16">
        <div className="w-full max-w-2xl space-y-8">
          <div className="text-center">
            <div className="mb-4 text-4xl">✅</div>
            <h1 className="text-3xl font-bold tracking-tight">
              Election Created
            </h1>
            <p className="mt-2 text-zinc-400">
              Share the voting link with voters so they can cast their ballots.
            </p>
          </div>

          <div className="space-y-6">
            <div className="rounded-xl border border-zinc-800 p-6">
              <h2 className="mb-1 text-sm font-semibold text-zinc-400">
                Election ID
              </h2>
              <div className="flex items-center gap-3">
                <code className="min-w-0 flex-1 truncate font-mono text-sm text-zinc-300">
                  {result.electionId}
                </code>
                <CopyButton text={result.electionId} />
              </div>
            </div>

            <div className="rounded-xl border border-zinc-800 p-6">
              <h2 className="mb-1 text-sm font-semibold text-zinc-400">
                Voting Link
              </h2>
              <p className="mb-3 text-xs text-zinc-500">
                Share this link with voters so they can cast their ballots.
              </p>
              <div className="flex items-center gap-3">
                <code className="min-w-0 flex-1 truncate rounded-lg bg-zinc-900 px-3 py-2 font-mono text-sm text-zinc-300">
                  {result.votingLink}
                </code>
                <CopyButton text={result.votingLink} />
              </div>
            </div>

            <div className="rounded-xl border border-amber-900/50 bg-amber-950/20 p-6">
              <h2 className="mb-1 text-sm font-semibold text-amber-400">
                📋 Next Steps
              </h2>
              <p className="text-sm text-amber-400/80">
                Share the voting link with all voters listed above. Each voter
                will connect their wallet and cast their vote. Once all ballots
                are collected, aggregate them on the Aggregate page.
              </p>
            </div>

            <div className="rounded-xl border border-zinc-800 p-6">
              <h2 className="mb-1 text-sm font-semibold text-zinc-400">
                Election Config (Base64)
              </h2>
              <p className="mb-3 text-xs text-zinc-500">
                You'll need this when aggregating ballots.
              </p>
              <div className="flex items-center gap-3">
                <code className="min-w-0 flex-1 truncate rounded-lg bg-zinc-900 px-3 py-2 font-mono text-sm text-zinc-300">
                  {result.configBase64}
                </code>
                <CopyButton text={result.configBase64} />
              </div>
            </div>
          </div>

          <div className="flex justify-center gap-4 pt-4">
            <Link
              href="/"
              className="rounded-full border border-zinc-700 px-8 py-3 text-sm font-semibold transition-colors hover:border-zinc-500 hover:bg-zinc-900"
            >
              Back to Home
            </Link>
            <Link
              href="/aggregate"
              className="rounded-full bg-white px-8 py-3 text-sm font-semibold text-black transition-colors hover:bg-zinc-200"
            >
              Go to Aggregate
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center px-6 py-16">
      <div className="w-full max-w-2xl space-y-8">
        <div>
          <Link
            href="/"
            className="mb-6 inline-flex items-center gap-1 text-sm text-zinc-400 transition-colors hover:text-zinc-200"
          >
            ← Back
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">
            Create Election
          </h1>
          <p className="mt-2 text-zinc-400">
            Define your election parameters. No keys are generated — voters
            will register their own keys.
          </p>
        </div>

        {errors.length > 0 && (
          <div className="rounded-xl border border-red-900/50 bg-red-950/20 p-4">
            <ul className="space-y-1 text-sm text-red-400">
              {errors.map((err) => (
                <li key={err}>• {err}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="space-y-6">
          <div>
            <label
              htmlFor="title"
              className="mb-2 block text-sm font-medium text-zinc-300"
            >
              Title <span className="text-red-400">*</span>
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Board of Directors Election 2026"
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="description"
              className="mb-2 block text-sm font-medium text-zinc-300"
            >
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Optional description of the election..."
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="candidates"
              className="mb-2 block text-sm font-medium text-zinc-300"
            >
              Candidates <span className="text-red-400">*</span>
            </label>
            <p className="mb-2 text-xs text-zinc-500">
              One candidate per line. Minimum 2 candidates.
            </p>
            <textarea
              id="candidates"
              value={candidates}
              onChange={(e) => setCandidates(e.target.value)}
              rows={5}
              placeholder={"Alice Johnson\nBob Smith\nCarol Williams"}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 font-mono text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="voters"
              className="mb-2 block text-sm font-medium text-zinc-300"
            >
              Voter Keys <span className="text-red-400">*</span>
            </label>
            <p className="mb-2 text-xs text-zinc-500">
              Paste voter key strings (from the Onboard page), one per line.
            </p>
            <textarea
              id="voters"
              value={votersInput}
              onChange={(e) => setVotersInput(e.target.value)}
              rows={4}
              placeholder={"Paste voter key 1\nPaste voter key 2\n..."}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 font-mono text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="votingMethod"
              className="mb-2 block text-sm font-medium text-zinc-300"
            >
              Voting Method
            </label>
            <select
              id="votingMethod"
              value={votingMethod}
              onChange={(e) =>
                setVotingMethod(
                  e.target.value as "single" | "approval" | "ranked",
                )
              }
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-100 focus:border-zinc-600 focus:outline-none"
            >
              <option value="single">Single Choice</option>
              <option value="approval">Approval Voting</option>
              <option value="ranked">Ranked Choice</option>
            </select>
          </div>

          {votingMethod === "ranked" && (
            <div>
              <label
                htmlFor="rankedWeights"
                className="mb-2 block text-sm font-medium text-zinc-300"
              >
                Ranked Weights
              </label>
              <p className="mb-2 text-xs text-zinc-500">
                Comma-separated point values for each rank position (e.g.
                1st, 2nd, 3rd place).
              </p>
              <input
                id="rankedWeights"
                type="text"
                value={rankedWeights}
                onChange={(e) => setRankedWeights(e.target.value)}
                placeholder="5,3,1"
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 font-mono text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none"
              />
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleCreate}
          className="w-full rounded-full bg-white px-8 py-3 text-sm font-semibold text-black transition-colors hover:bg-zinc-200"
        >
          Create Election
        </button>
      </div>
    </div>
  );
}
