"use client";

import { Theme as EmojiTheme } from "emoji-picker-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useRef, useState } from "react";
import { CandidateList } from "./_components/CandidateList";
import { ElectionCreated } from "./_components/ElectionCreated";
import { VoterList } from "./_components/VoterList";
import { VotingMethodSelector } from "./_components/VotingMethodSelector";
import { useCandidates } from "./_hooks/useCandidates";
import { useClickOutside } from "./_hooks/useClickOutside";
import { type ElectionResult, useElectionForm } from "./_hooks/useElectionForm";
import { useVoters } from "./_hooks/useVoters";

const EmojiPicker = dynamic(() => import("emoji-picker-react"), { ssr: false });

export default function CreateElectionPage() {
  const { form, handleCreate } = useElectionForm();
  const candidates = useCandidates();
  const voterState = useVoters();
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [result, setResult] = useState<ElectionResult | null>(null);

  const emoji = form.watch("emoji");

  useClickOutside(
    emojiPickerRef,
    showEmojiPicker,
    useCallback(() => setShowEmojiPicker(false), []),
  );

  const onSubmit = async () => {
    const values = form.getValues();
    const outcome = await handleCreate(
      values,
      candidates.candidateList,
      voterState.voters,
    );
    if (Array.isArray(outcome)) {
      setErrors(outcome);
    } else {
      setErrors([]);
      setResult(outcome);
    }
  };

  if (result) {
    return <ElectionCreated result={result} emoji={emoji} />;
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
                {...form.register("title")}
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
                className="relative h-11.5 w-full rounded-lg border border-zinc-800 bg-zinc-900 text-2xl transition-colors hover:border-zinc-600 focus:border-zinc-600 focus:outline-none"
              >
                {emoji || "📊"}
              </button>
              {showEmojiPicker && (
                <div className="absolute right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-zinc-800 shadow-2xl">
                  <EmojiPicker
                    onEmojiClick={(emojiData) => {
                      form.setValue("emoji", emojiData.emoji);
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
              {...form.register("description")}
              rows={3}
              placeholder="Optional description of the election..."
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none"
            />
          </div>

          <CandidateList
            candidateList={candidates.candidateList}
            onAdd={candidates.addCandidates}
            onRemove={candidates.removeCandidate}
            onMove={candidates.moveCandidate}
            onShuffle={candidates.shuffleCandidates}
            onUpdate={candidates.updateCandidate}
          />

          <VoterList
            voters={voterState.voters}
            aliases={voterState.aliases}
            voterError={voterState.voterError}
            addressBookEntries={voterState.addressBookEntries}
            onAdd={voterState.tryAddVoter}
            onRemove={voterState.removeVoter}
            onAddFromAddressBook={voterState.addFromAddressBook}
            onUpdateAlias={voterState.updateAlias}
            onClearError={() => voterState.setVoterError("")}
          />

          <VotingMethodSelector form={form} />
        </div>

        <button
          type="button"
          onClick={onSubmit}
          className="w-full rounded-full bg-white px-8 py-3 text-sm font-semibold text-black transition-colors hover:bg-zinc-200"
        >
          Create Election
        </button>
      </div>
    </div>
  );
}
