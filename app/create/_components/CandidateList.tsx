import { ChevronDown, ChevronUp, Plus, Shuffle, X } from "lucide-react";
import { useState } from "react";

interface CandidateListProps {
  candidateList: string[];
  onAdd: (raw: string) => void;
  onRemove: (index: number) => void;
  onMove: (index: number, direction: -1 | 1) => void;
  onShuffle: () => void;
  onUpdate: (index: number, value: string) => void;
}

export function CandidateList({
  candidateList,
  onAdd,
  onRemove,
  onMove,
  onShuffle,
  onUpdate,
}: CandidateListProps) {
  const [candidateInput, setCandidateInput] = useState("");

  return (
    <div>
      <label
        htmlFor="candidateInput"
        className="mb-2 block text-sm font-medium text-zinc-300"
      >
        Candidates <span className="text-red-400">*</span>
      </label>
      <p className="mb-2 text-xs text-zinc-500">
        Add candidates one at a time or paste multiple names (one per line).
        Minimum 2.
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
              onAdd(pasted);
              setCandidateInput("");
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (candidateInput.trim()) {
                onAdd(candidateInput);
                setCandidateInput("");
              }
            }
          }}
          placeholder="Type a name and press Enter, or paste multiple..."
          className="min-w-0 flex-1 rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none"
        />
        <button
          type="button"
          onClick={() => {
            if (candidateInput.trim()) {
              onAdd(candidateInput);
              setCandidateInput("");
            }
          }}
          className="flex shrink-0 items-center gap-1.5 rounded-lg border border-zinc-700 px-4 py-3 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-500 hover:bg-zinc-800"
        >
          <Plus size={14} />
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
              onClick={onShuffle}
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
                onChange={(e) => onUpdate(idx, e.target.value)}
                className="min-w-0 flex-1 bg-transparent text-sm text-zinc-100 focus:outline-none"
              />
              <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() => onMove(idx, -1)}
                  disabled={idx === 0}
                  className="rounded p-1 text-zinc-500 transition-colors hover:text-zinc-200 disabled:opacity-30 disabled:hover:text-zinc-500"
                  aria-label="Move up"
                >
                  <ChevronUp size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => onMove(idx, 1)}
                  disabled={idx === candidateList.length - 1}
                  className="rounded p-1 text-zinc-500 transition-colors hover:text-zinc-200 disabled:opacity-30 disabled:hover:text-zinc-500"
                  aria-label="Move down"
                >
                  <ChevronDown size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => onRemove(idx)}
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
  );
}
