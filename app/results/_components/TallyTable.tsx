import type { ElectionConfig } from "../../lib/crypto";

interface TallyTableProps {
  config: ElectionConfig;
  tally: number[];
}

export function TallyTable({ config, tally }: TallyTableProps) {
  const sortedTallies = config.candidates
    .map((candidate, i) => ({ candidate, score: tally[i] }))
    .sort((a, b) => b.score - a.score);

  return (
    <div className="mb-8 rounded-xl border border-zinc-800 p-6">
      <h2 className="mb-4 text-lg font-semibold">Final Tally</h2>
      <div className="overflow-hidden rounded-lg border border-zinc-800">
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900/50">
              <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-400">
                Rank
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-zinc-400">
                Candidate
              </th>
              <th className="px-4 py-2.5 text-right text-xs font-medium text-zinc-400">
                {config.votingMethod === "ranked" ? "Score" : "Votes"}
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedTallies.map((t, i) => (
              <tr
                key={t.candidate}
                className="border-b border-zinc-800/50 last:border-0"
              >
                <td className="px-4 py-2.5 text-sm text-zinc-500">{i + 1}</td>
                <td className="px-4 py-2.5 text-sm font-medium">
                  {i === 0 && "🏆 "}
                  {t.candidate}
                </td>
                <td className="px-4 py-2.5 text-right font-mono text-sm">
                  {t.score}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {config.votingMethod === "ranked" && config.rankedWeights && (
        <p className="mt-2 text-xs text-zinc-500">
          Scores reflect weighted ranked-choice voting (weights:{" "}
          {config.rankedWeights.join(", ")})
        </p>
      )}
    </div>
  );
}
