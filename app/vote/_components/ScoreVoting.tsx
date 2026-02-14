interface ScoreVotingProps {
  candidates: string[];
  scoreChoices: number[];
  scoreMax: number;
  onUpdate: (idx: number, value: number) => void;
}

export function ScoreVoting({
  candidates,
  scoreChoices,
  scoreMax,
  onUpdate,
}: ScoreVotingProps) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-400">
        Rate each candidate from 0 to {scoreMax}.
      </p>
      {candidates.map((candidate, idx) => (
        <div
          key={candidate}
          className="rounded-lg border border-zinc-800 p-4 space-y-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{candidate}</span>
            <span className="text-sm font-bold tabular-nums text-zinc-300">
              {scoreChoices[idx] ?? 0}/{scoreMax}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={scoreMax}
            value={scoreChoices[idx] ?? 0}
            onChange={(e) => onUpdate(idx, Number(e.target.value))}
            className="w-full accent-white"
          />
          <div className="flex justify-between text-xs text-zinc-600">
            <span>0</span>
            <span>{scoreMax}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
