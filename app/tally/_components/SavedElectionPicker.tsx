import type { SavedElection } from "../../lib/storage";

interface SavedElectionPickerProps {
  savedElections: SavedElection[];
  onSelect: (electionId: string) => void;
}

export function SavedElectionPicker({
  savedElections,
  onSelect,
}: SavedElectionPickerProps) {
  if (savedElections.length === 0) return null;

  return (
    <div className="mb-3 space-y-3">
      <p className="text-xs text-zinc-500">
        Load a previously created election:
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {savedElections.map((election) => (
          <button
            key={election.electionId}
            type="button"
            onClick={() => onSelect(election.electionId)}
            className="group relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 text-left transition-all hover:border-zinc-600 hover:bg-zinc-800/80 hover:shadow-lg hover:shadow-zinc-900/50"
          >
            <div className="flex items-start gap-3">
              {election.emoji && (
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-2xl transition-colors group-hover:bg-zinc-700">
                  {election.emoji}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h3 className="mb-1 font-semibold text-zinc-200 group-hover:text-white">
                  {election.title}
                </h3>
                <p className="text-xs text-zinc-500">
                  {new Date(election.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="absolute inset-0 -z-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
          </button>
        ))}
      </div>
      <div className="flex items-center gap-3 text-xs text-zinc-600">
        <span className="h-px flex-1 bg-zinc-800" />
        or paste election data
        <span className="h-px flex-1 bg-zinc-800" />
      </div>
    </div>
  );
}
