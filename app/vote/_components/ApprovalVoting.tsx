interface ApprovalVotingProps {
  candidates: string[];
  selected: Set<number>;
  onToggle: (idx: number) => void;
}

export function ApprovalVoting({
  candidates,
  selected,
  onToggle,
}: ApprovalVotingProps) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-zinc-400">
        Select all candidates you approve of.
      </p>
      {candidates.map((candidate, idx) => (
        <label
          key={candidate}
          className={`flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors ${
            selected.has(idx)
              ? "border-white bg-zinc-800/50"
              : "border-zinc-800 hover:border-zinc-600"
          }`}
        >
          <input
            type="checkbox"
            checked={selected.has(idx)}
            onChange={() => onToggle(idx)}
            className="accent-white"
          />
          <span>{candidate}</span>
        </label>
      ))}
    </div>
  );
}
