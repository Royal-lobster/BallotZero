"use client";

import { secp256k1 } from "@noble/curves/secp256k1.js";
import { bytesToHex } from "@noble/hashes/utils.js";
import { Theme as EmojiTheme } from "emoji-picker-react";
import { ChevronDown, ChevronUp, Shuffle, X } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  computeElectionId,
  deserializeVoter,
  type ElectionConfig,
  serializeVoter,
  type Voter,
} from "../lib/crypto";
import {
  type AddressBook,
  type AliasMap,
  getAddressBook,
  getAliases,
  getVoterKeys,
  saveAllToAddressBook,
  saveConfig,
  saveVoterKeys,
  setAlias,
} from "../lib/storage";

const EmojiPicker = dynamic(() => import("emoji-picker-react"), { ssr: false });

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
  const [emoji, setEmoji] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [description, setDescription] = useState("");
  const [candidateList, setCandidateList] = useState<string[]>([]);
  const [candidateInput, setCandidateInput] = useState("");
  const [voters, setVoters] = useState<Voter[]>([]);
  const [votersLoaded, setVotersLoaded] = useState(false);
  const [voterInput, setVoterInput] = useState("");
  const [voterError, setVoterError] = useState("");
  const [aliases, setAliases] = useState<AliasMap>({});
  const [addressBook, setAddressBook] = useState<AddressBook>({});
  const voterInputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const [votingMethod, setVotingMethod] = useState<
    "single" | "approval" | "ranked" | "score"
  >("single");
  const [scoreMax, setScoreMax] = useState(5);
  const [rankedWeights, setRankedWeights] = useState("5,3,1");
  const [errors, setErrors] = useState<string[]>([]);

  const DRAFT_KEY = "current";

  // Close emoji picker when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target as Node)
      ) {
        setShowEmojiPicker(false);
      }
    }
    if (showEmojiPicker) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showEmojiPicker]);

  // Load persisted voters and aliases from IndexedDB, then merge hash voter
  useEffect(() => {
    let cancelled = false;
    Promise.all([getVoterKeys(DRAFT_KEY), getAliases(), getAddressBook()]).then(
      ([stored, savedAliases, savedBook]) => {
        if (cancelled) return;
        setAliases(savedAliases);
        setAddressBook(savedBook);

        const loaded: Voter[] = [];
        const seen = new Set<string>();
        for (const s of stored) {
          try {
            const v = deserializeVoter(s);
            if (!seen.has(v.address)) {
              loaded.push(v);
              seen.add(v.address);
            }
          } catch {
            // skip invalid
          }
        }

        // Also extract voter from URL hash if present
        const hash = window.location.hash;
        if (hash.startsWith("#voterkey=")) {
          const voterKeyStr = decodeURIComponent(
            hash.slice("#voterkey=".length),
          );
          try {
            const voter = deserializeVoter(voterKeyStr);
            if (!seen.has(voter.address)) {
              loaded.push(voter);
            }
          } catch {
            // ignore invalid hash
          }
          window.history.replaceState(null, "", window.location.pathname);
        }

        setVoters(loaded);
        setVotersLoaded(true);
      },
    );
    return () => {
      cancelled = true;
    };
  }, []);

  // Persist voters to IndexedDB and global address book whenever they change
  useEffect(() => {
    if (!votersLoaded) return;
    const serialized = voters.map((v) => serializeVoter(v));
    saveVoterKeys(DRAFT_KEY, serialized);
    saveAllToAddressBook(
      voters.map((v, i) => ({
        address: v.address,
        serializedKey: serialized[i],
      })),
    );
  }, [voters, votersLoaded]);

  const [result, setResult] = useState<{
    electionId: string;
    votingLink: string;
    configBase64: string;
  } | null>(null);

  const tryAddVoter = (raw: string) => {
    // Support pasting multiple keys/links at once (one per line)
    const lines = raw
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length === 0) return;
    setVoterError("");

    let added = 0;
    let duplicates = 0;
    let invalid = 0;

    setVoters((prev) => {
      const next = [...prev];
      const seen = new Set(next.map((v) => v.address));
      for (const line of lines) {
        try {
          let voterKeyStr = line;
          const hashIdx = line.indexOf("#voterkey=");
          if (hashIdx !== -1) {
            voterKeyStr = line.slice(hashIdx + "#voterkey=".length);
          }
          const voter = deserializeVoter(voterKeyStr);
          if (seen.has(voter.address)) {
            duplicates++;
            continue;
          }
          next.push(voter);
          seen.add(voter.address);
          added++;
        } catch {
          invalid++;
        }
      }
      return next;
    });

    setVoterInput("");
    if (invalid > 0 && added === 0 && duplicates === 0) {
      setVoterError("Invalid voter key or link.");
    } else if (invalid > 0) {
      setVoterError(
        `Added ${added}, skipped ${duplicates} duplicate(s) and ${invalid} invalid.`,
      );
    } else if (duplicates > 0 && added === 0) {
      setVoterError(
        lines.length === 1
          ? "This voter has already been added."
          : `All ${duplicates} voter(s) already added.`,
      );
    }
  };

  const removeVoter = (address: string) => {
    setVoters((prev) => prev.filter((v) => v.address !== address));
  };

  const addressBookEntries = Object.entries(addressBook).filter(
    ([addr]) => !voters.some((v) => v.address.toLowerCase() === addr),
  );

  const addFromAddressBook = () => {
    const newVoters: Voter[] = [];
    const seen = new Set(voters.map((v) => v.address.toLowerCase()));
    for (const [addr, serialized] of Object.entries(addressBook)) {
      if (seen.has(addr)) continue;
      try {
        const voter = deserializeVoter(serialized);
        newVoters.push(voter);
        seen.add(addr);
      } catch {
        // skip invalid
      }
    }
    if (newVoters.length > 0) {
      setVoters((prev) => [...prev, ...newVoters]);
    }
  };

  const updateAlias = (address: string, name: string) => {
    const key = address.toLowerCase();
    setAliases((prev) => {
      const next = { ...prev };
      if (name.trim()) {
        next[key] = name.trim();
      } else {
        delete next[key];
      }
      return next;
    });
    setAlias(address, name);
  };

  const compressedEpkHex = (voter: Voter) => {
    const point = secp256k1.Point.fromAffine({
      x: BigInt(`0x${voter.epk.x}`),
      y: BigInt(`0x${voter.epk.y}`),
    });
    return bytesToHex(point.toBytes(true));
  };

  const truncateAddress = (addr: string) =>
    `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  const addCandidates = (raw: string) => {
    const names = raw
      .split("\n")
      .map((c) => c.trim())
      .filter(Boolean);
    if (names.length === 0) return;
    setCandidateList((prev) => [...prev, ...names]);
    setCandidateInput("");
  };

  const removeCandidate = (index: number) => {
    setCandidateList((prev) => prev.filter((_, i) => i !== index));
  };

  const moveCandidate = (index: number, direction: -1 | 1) => {
    setCandidateList((prev) => {
      const next = [...prev];
      const newIndex = index + direction;
      if (newIndex < 0 || newIndex >= next.length) return prev;
      [next[index], next[newIndex]] = [next[newIndex], next[index]];
      return next;
    });
  };

  const shuffleCandidates = () => {
    setCandidateList((prev) => {
      const next = [...prev];
      for (let i = next.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [next[i], next[j]] = [next[j], next[i]];
      }
      return next;
    });
  };

  const validate = (): string[] => {
    const errs: string[] = [];
    if (!title.trim()) errs.push("Title is required.");
    const filtered = candidateList.filter((c) => c.trim());
    if (filtered.length < 2) errs.push("At least 2 candidates are required.");
    if (voters.length < 1) errs.push("At least 1 voter is required.");
    if (votingMethod === "ranked") {
      const weights = rankedWeights.split(",").map((w) => w.trim());
      if (weights.some((w) => !w || Number.isNaN(Number.parseInt(w, 10)))) {
        errs.push("Ranked weights must be comma-separated numbers.");
      }
    }
    if (votingMethod === "score") {
      if (scoreMax < 1 || scoreMax > 100) {
        errs.push("Score max must be between 1 and 100.");
      }
    }
    return errs;
  };

  const handleCreate = async () => {
    const validationErrors = validate();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors([]);

    const filtered = candidateList.filter((c) => c.trim());

    const config: ElectionConfig = {
      title: title.trim(),
      description: description.trim(),
      candidates: filtered,
      voters,
      votingMethod,
      ...(votingMethod === "ranked"
        ? {
            rankedWeights: rankedWeights
              .split(",")
              .map((w) => Number.parseInt(w.trim(), 10)),
          }
        : {}),
      ...(votingMethod === "score" ? { scoreMax } : {}),
      ...(emoji ? { emoji } : {}),
    };

    const electionId = computeElectionId(config);
    const configBase64 = btoa(JSON.stringify(config));
    await saveConfig(
      electionId,
      configBase64,
      config.title,
      emoji || undefined,
    );
    const votingLink = `${window.location.origin}/vote?config=${encodeURIComponent(configBase64)}`;

    setResult({
      electionId,
      votingLink,
      configBase64,
    });
  };

  if (result) {
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
            ID: {result.electionId.slice(0, 16)}…
          </p>
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
          <h1 className="text-3xl font-bold tracking-tight">Create Election</h1>
          <p className="mt-2 text-zinc-400">
            Set up your election — add candidates, choose a voting method, and
            invite voters.
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
          <div className="flex items-start gap-4">
            <div className="flex-1">
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

            <div ref={emojiPickerRef} className="relative w-24">
              <label
                htmlFor="emoji"
                className="mb-2 block text-sm font-medium text-zinc-300"
              >
                Icon
              </label>
              <button
                id="emoji"
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="relative h-[46px] w-full rounded-lg border border-zinc-800 bg-zinc-900 text-2xl transition-colors hover:border-zinc-600 focus:border-zinc-600 focus:outline-none"
              >
                {emoji || "📊"}
              </button>
              {showEmojiPicker && (
                <div className="absolute right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-zinc-800 shadow-2xl">
                  <EmojiPicker
                    onEmojiClick={(emojiData) => {
                      setEmoji(emojiData.emoji);
                      setShowEmojiPicker(false);
                    }}
                    theme={EmojiTheme.DARK}
                    width={350}
                    height={450}
                  />
                </div>
              )}
            </div>
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
              htmlFor="candidateInput"
              className="mb-2 block text-sm font-medium text-zinc-300"
            >
              Candidates <span className="text-red-400">*</span>
            </label>
            <p className="mb-2 text-xs text-zinc-500">
              Add candidates one at a time or paste multiple names (one per
              line). Minimum 2.
            </p>
            <div className="flex gap-2">
              <input
                id="candidateInput"
                type="text"
                value={candidateInput}
                onChange={(e) => setCandidateInput(e.target.value)}
                onPaste={(e) => {
                  const pasted = e.clipboardData.getData("text/plain");
                  if (pasted.includes("\n")) {
                    e.preventDefault();
                    addCandidates(pasted);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (candidateInput.trim()) {
                      addCandidates(candidateInput);
                    }
                  }
                }}
                placeholder="Type a name and press Enter, or paste multiple..."
                className="min-w-0 flex-1 rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  if (candidateInput.trim()) addCandidates(candidateInput);
                }}
                className="shrink-0 rounded-lg border border-zinc-700 px-4 py-3 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-500 hover:bg-zinc-800"
              >
                Add
              </button>
            </div>

            {candidateList.length > 0 && (
              <div className="mt-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-500">
                    {candidateList.length} candidate
                    {candidateList.length !== 1 ? "s" : ""}
                  </span>
                  <button
                    type="button"
                    onClick={shuffleCandidates}
                    className="flex items-center gap-1.5 rounded-lg border border-zinc-700 px-2.5 py-1 text-xs font-medium text-zinc-400 transition-colors hover:border-zinc-500 hover:text-zinc-200"
                  >
                    <Shuffle size={12} />
                    Shuffle
                  </button>
                </div>
                {candidateList.map((name, idx) => (
                  <div
                    key={`${idx}-${name}`}
                    className="group flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2.5"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-zinc-800 text-xs font-medium text-zinc-400">
                      {idx + 1}
                    </span>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => {
                        setCandidateList((prev) => {
                          const next = [...prev];
                          next[idx] = e.target.value;
                          return next;
                        });
                      }}
                      className="min-w-0 flex-1 bg-transparent text-sm text-zinc-100 focus:outline-none"
                    />
                    <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => moveCandidate(idx, -1)}
                        disabled={idx === 0}
                        className="rounded p-1 text-zinc-500 transition-colors hover:text-zinc-200 disabled:opacity-30 disabled:hover:text-zinc-500"
                        aria-label="Move up"
                      >
                        <ChevronUp size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveCandidate(idx, 1)}
                        disabled={idx === candidateList.length - 1}
                        className="rounded p-1 text-zinc-500 transition-colors hover:text-zinc-200 disabled:opacity-30 disabled:hover:text-zinc-500"
                        aria-label="Move down"
                      >
                        <ChevronDown size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeCandidate(idx)}
                        className="rounded p-1 text-zinc-500 transition-colors hover:text-red-400"
                        aria-label={`Remove ${name}`}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label
                htmlFor="voterInput"
                className="text-sm font-medium text-zinc-300"
              >
                Voters <span className="text-red-400">*</span>
              </label>
              {addressBookEntries.length > 0 && (
                <button
                  type="button"
                  onClick={addFromAddressBook}
                  className="rounded-lg border border-zinc-700 px-2.5 py-1 text-xs font-medium text-zinc-400 transition-colors hover:border-zinc-500 hover:text-zinc-200"
                >
                  + Add known ({addressBookEntries.length})
                </button>
              )}
            </div>
            <p className="mb-2 text-xs text-zinc-500">
              Paste the link each voter shared with you after joining.
            </p>
            <div className="flex w-full items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 focus-within:border-zinc-600">
              <input
                ref={voterInputRef}
                id="voterInput"
                type="text"
                value={voterInput}
                onChange={(e) => {
                  setVoterInput(e.target.value);
                  setVoterError("");
                }}
                onPaste={(e) => {
                  e.preventDefault();
                  const pasted = e.clipboardData.getData("text/plain");
                  tryAddVoter(pasted);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    tryAddVoter(voterInput);
                  }
                }}
                placeholder="Paste a voter key or link..."
                className="min-w-0 flex-1 bg-transparent font-mono text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none"
              />
            </div>
            {voterError && (
              <p className="mt-1.5 text-xs text-red-400">{voterError}</p>
            )}

            {voters.length > 0 && (
              <div className="mt-3 space-y-2">
                {voters.map((voter) => {
                  const epkHex = compressedEpkHex(voter);
                  const avatarColor = `#${voter.address.slice(2, 8)}`;
                  const avatarLabel = voter.address.slice(2, 4).toUpperCase();
                  const alias = aliases[voter.address.toLowerCase()] ?? "";
                  return (
                    <div
                      key={voter.address}
                      className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2"
                      title={`Address: ${voter.address}\nPublic Key: ${epkHex}`}
                    >
                      <div
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                        style={{ backgroundColor: avatarColor }}
                      >
                        {avatarLabel}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="shrink-0 font-mono text-sm text-zinc-200">
                            {truncateAddress(voter.address)}
                          </p>
                          <input
                            type="text"
                            value={alias}
                            onChange={(e) =>
                              updateAlias(voter.address, e.target.value)
                            }
                            placeholder="add alias…"
                            className="min-w-0 flex-1 bg-transparent text-sm text-zinc-100 placeholder:text-zinc-700 focus:outline-none"
                          />
                        </div>
                        <p className="truncate font-mono text-xs text-zinc-500">
                          epk: {epkHex.slice(0, 8)}…
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeVoter(voter.address)}
                        className="shrink-0 text-zinc-500 transition-colors hover:text-red-400"
                        aria-label={`Remove voter ${voter.address}`}
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <p className="mb-3 text-sm font-medium text-zinc-300">
              Voting Method
            </p>
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  value: "single" as const,
                  label: "Single Choice",
                  icon: "1",
                  desc: "Each voter picks exactly one candidate. The candidate with the most votes wins.",
                },
                {
                  value: "approval" as const,
                  label: "Approval",
                  icon: "\u2713\u2713",
                  desc: "Voters can approve as many candidates as they like. Highest approval count wins.",
                },
                {
                  value: "ranked" as const,
                  label: "Ranked Choice",
                  icon: "#",
                  desc: "Voters rank candidates by preference. Points are awarded based on rank position.",
                },
                {
                  value: "score" as const,
                  label: "Score Voting",
                  icon: "\u2605",
                  desc: "Voters rate each candidate on a scale (e.g. 0\u20135). Highest average score wins.",
                },
              ].map((method) => (
                <button
                  key={method.value}
                  type="button"
                  onClick={() => setVotingMethod(method.value)}
                  className={`flex flex-col items-start gap-1.5 rounded-xl border p-4 text-left transition-all ${
                    votingMethod === method.value
                      ? "border-white bg-white/5"
                      : "border-zinc-800 hover:border-zinc-600"
                  }`}
                >
                  <div className="flex w-full items-center gap-2.5">
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${
                        votingMethod === method.value
                          ? "bg-white text-black"
                          : "bg-zinc-800 text-zinc-400"
                      }`}
                    >
                      {method.icon}
                    </span>
                    <span
                      className={`text-sm font-semibold ${
                        votingMethod === method.value
                          ? "text-white"
                          : "text-zinc-300"
                      }`}
                    >
                      {method.label}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed text-zinc-500">
                    {method.desc}
                  </p>
                </button>
              ))}
            </div>
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
                Comma-separated point values for each rank position (e.g. 1st,
                2nd, 3rd place).
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

          {votingMethod === "score" && (
            <div>
              <label
                htmlFor="scoreMax"
                className="mb-2 block text-sm font-medium text-zinc-300"
              >
                Maximum Score
              </label>
              <p className="mb-2 text-xs text-zinc-500">
                The highest score a voter can give a candidate (e.g. 5 means the
                scale is 0&ndash;5).
              </p>
              <input
                id="scoreMax"
                type="number"
                min={1}
                max={100}
                value={scoreMax}
                onChange={(e) => setScoreMax(Number(e.target.value))}
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
