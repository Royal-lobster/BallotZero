"use client";

import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import type { ElectionConfig } from "../../lib/crypto";

interface ResultsChartProps {
  config: ElectionConfig;
  tally: number[];
}

export function ResultsChart({ config, tally }: ResultsChartProps) {
  const data = config.candidates
    .map((candidate, i) => ({ candidate, score: tally[i] }))
    .sort((a, b) => b.score - a.score);

  const maxScore = Math.max(...data.map((d) => d.score));
  const label =
    config.votingMethod === "ranked" || config.votingMethod === "score"
      ? "Score"
      : "Votes";

  return (
    <div className="mb-8 rounded-xl border border-zinc-800 p-6">
      <h2 className="mb-4 text-lg font-semibold">{label}</h2>
      <ResponsiveContainer width="100%" height={data.length * 48 + 16}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 0, right: 40, bottom: 0, left: 0 }}
        >
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="candidate"
            width={120}
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#a1a1aa", fontSize: 14 }}
          />
          <Bar
            dataKey="score"
            radius={[0, 6, 6, 0]}
            animationDuration={800}
            label={{
              position: "right",
              fill: "#71717a",
              fontSize: 13,
              fontFamily: "monospace",
            }}
          >
            {data.map((entry) => (
              <Cell
                key={entry.candidate}
                fill={entry.score === maxScore ? "#a1a1aa" : "#52525b"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      {config.votingMethod === "ranked" && config.rankedWeights && (
        <p className="mt-2 text-xs text-zinc-500">
          Scores reflect weighted ranked-choice voting (weights:{" "}
          {config.rankedWeights.join(", ")})
        </p>
      )}
    </div>
  );
}
