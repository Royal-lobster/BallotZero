"use client";

import { Calculator, Check, Copy, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { decompressFromUrl } from "../lib/compression";
import { computeElectionId, type ElectionConfig } from "../lib/crypto";
import {
  type AliasMap,
  getAliases,
  getConfig,
  getSavedElections,
  type SavedElection,
} from "../lib/storage";
import { BallotList } from "./_components/BallotList";
import { CollectionProgress } from "./_components/CollectionProgress";
import { SavedElectionPicker } from "./_components/SavedElectionPicker";
import { TallyResult } from "./_components/TallyResult";
import { useAggregation } from "./_hooks/useAggregation";
import { useBallots } from "./_hooks/useBallots";

function AggregateContent() {
  const searchParams = useSearchParams();
  const initialConfig = searchParams.get("config") ?? "";

  const [configBase64, setConfigBase64] = useState(initialConfig);
  const [linkInput, setLinkInput] = useState("");
  const [copiedElectionLink, setCopiedElectionLink] = useState(false);
  const [aliases, setAliasMap] = useState<AliasMap>({});

  function handleLinkInput(value: string) {
    setLinkInput(value);
    try {
      const url = new URL(value);
      const config = url.searchParams.get("config");
      if (config) {
        setConfigBase64(config);
      }
    } catch {
      // not a valid URL yet, ignore
    }
  }
  const [savedElections, setSavedElections] = useState<SavedElection[]>([]);

  useEffect(() => {
    getAliases().then(setAliasMap);
    getSavedElections().then((elections) =>
      setSavedElections(elections.sort((a, b) => b.createdAt - a.createdAt)),
    );
  }, []);

  const parsedConfig = useMemo<{
    config: ElectionConfig;
    electionId: string;
  } | null>(() => {
    try {
      const cfg: ElectionConfig = JSON.parse(decompressFromUrl(configBase64));
      if (cfg.title && cfg.voters?.length) {
        const eid = computeElectionId(cfg);
        return { config: cfg, electionId: eid };
      }
      return null;
    } catch {
      return null;
    }
  }, [configBase64]);

  const ballotState = useBallots(parsedConfig?.electionId);
  const aggregation = useAggregation();

  async function loadSavedElection(electionId: string) {
    const configB64 = await getConfig(electionId);
    if (configB64) setConfigBase64(configB64);
  }

  function copyElectionLink() {
    const link = `${window.location.origin}/vote?config=${configBase64}`;
    navigator.clipboard.writeText(link);
    setCopiedElectionLink(true);
    setTimeout(() => setCopiedElectionLink(false), 2000);
  }

  if (aggregation.resultsLink) {
    return (
      <TallyResult
        resultsLink={aggregation.resultsLink}
        validCount={aggregation.validCount}
      />
    );
  }

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
          Tally Results
        </h1>
        <p className="mb-8 text-zinc-400">
          Collect everyone's ballot links, then count the votes.
        </p>

        <div className="space-y-6">
          <div>
            <label
              htmlFor="config"
              className="mb-2 block text-sm font-medium text-zinc-300"
            >
              Election
            </label>

            {!parsedConfig && (
              <SavedElectionPicker
                savedElections={savedElections}
                onSelect={loadSavedElection}
              />
            )}

            {parsedConfig ? (
              <div className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2">
                <span className="text-green-400 text-sm">✓</span>
                <span className="min-w-0 flex-1 text-sm text-zinc-300">
                  {parsedConfig.config.title}
                  <span className="ml-2 text-xs text-zinc-500">
                    · {parsedConfig.config.voters.length} voters ·{" "}
                    {parsedConfig.config.candidates.length} candidates
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => { setConfigBase64(""); setLinkInput(""); }}
                  className="flex shrink-0 items-center gap-1 text-xs text-zinc-500 transition-colors hover:text-zinc-300"
                >
                  <RefreshCw size={10} />
                  Change
                </button>
              </div>
            ) : (
              <input
                id="config"
                type="text"
                value={linkInput}
                onChange={(e) => handleLinkInput(e.target.value)}
                onPaste={(e) => {
                  e.preventDefault();
                  const pasted = e.clipboardData.getData("text/plain").trim();
                  handleLinkInput(pasted);
                }}
                placeholder="Paste voting link..."
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 font-mono text-sm text-zinc-100 placeholder-zinc-600 outline-none transition-colors focus:border-zinc-600"
              />
            )}
          </div>

          {parsedConfig && (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label
                  htmlFor="ballotInput"
                  className="text-sm font-medium text-zinc-300"
                >
                  Collect Ballots
                </label>
                <button
                  type="button"
                  onClick={copyElectionLink}
                  className="flex items-center gap-1.5 rounded-lg border border-zinc-700 px-2.5 py-1 text-xs font-medium text-zinc-400 transition-colors hover:border-zinc-500 hover:text-zinc-200"
                >
                  {copiedElectionLink ? <Check size={12} /> : <Copy size={12} />}
                  {copiedElectionLink ? "Copied!" : "Copy Election Link"}
                </button>
              </div>
              <p className="mb-2 text-xs text-zinc-500">
                Paste ballot links or strings from voters.
              </p>
              {/* biome-ignore lint/a11y/noStaticElementInteractions: wrapper div delegates focus to inner input */}
              <div
                className="flex w-full cursor-text items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 focus-within:border-zinc-600"
                onClick={() => ballotState.ballotInputRef.current?.focus()}
                onKeyDown={() => ballotState.ballotInputRef.current?.focus()}
              >
                <input
                  ref={ballotState.ballotInputRef}
                  id="ballotInput"
                  type="text"
                  onChange={(e) => {
                    // controlled only for clearing
                    e.target.value;
                    ballotState.setBallotError("");
                  }}
                  onPaste={(e) => {
                    e.preventDefault();
                    const pasted = e.clipboardData.getData("text/plain");
                    ballotState.addBallot(pasted);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const input = e.currentTarget;
                      ballotState.addBallot(input.value);
                      input.value = "";
                    }
                  }}
                  placeholder="Paste a ballot link or string..."
                  className="min-w-0 flex-1 bg-transparent font-mono text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none"
                />
              </div>
              {ballotState.ballotError && (
                <p className="mt-1.5 text-xs text-red-400">
                  {ballotState.ballotError}
                </p>
              )}

              <BallotList
                ballots={ballotState.ballots}
                aliases={aliases}
                onRemove={ballotState.removeBallot}
              />
            </div>
          )}

          {parsedConfig && (
            <CollectionProgress
              config={parsedConfig.config}
              ballots={ballotState.ballots}
              aliases={aliases}
            />
          )}

          <button
            type="button"
            onClick={() =>
              aggregation.handleAggregate(configBase64, ballotState.ballots)
            }
            disabled={
              aggregation.processing ||
              !configBase64 ||
              ballotState.ballots.length === 0
            }
            className="flex w-full items-center justify-center gap-2 rounded-full bg-white px-8 py-3 text-sm font-semibold text-black transition-colors hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Calculator size={16} />
            {aggregation.processing ? "Counting..." : "Count Votes"}
          </button>
        </div>

        {aggregation.status?.startsWith("Error") && (
          <div className="mt-6 rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-3">
            <p className="text-sm text-red-400">{aggregation.status}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AggregatePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          Loading...
        </div>
      }
    >
      <AggregateContent />
    </Suspense>
  );
}
