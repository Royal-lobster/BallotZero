interface RankedChoiceProps {
  candidates: string[];
  rankedChoices: (number | null)[];
  rankedWeights: number[];
  onUpdate: (position: number, candidateIdx: number | null) => void;
}

export function RankedChoice({
  candidates,
  rankedChoices,
  rankedWeights,
  onUpdate,
}: RankedChoiceProps) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-400">
        Select your ranked choices. Points: {rankedWeights.join(", ")}
      </p>
      {rankedChoices.map((selected, position) => {
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
              Choice ({rankedWeights[position]} pts)
            </label>
            <select
              id={rankId}
              value={selected ?? ""}
              onChange={(e) =>
                onUpdate(
                  position,
                  e.target.value === "" ? null : Number(e.target.value),
                )
              }
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 p-3 text-sm text-zinc-200 focus:outline-none focus:border-zinc-500"
            >
              <option value="">Select a candidate</option>
              {candidates.map((candidate, idx) => (
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
  );
}
