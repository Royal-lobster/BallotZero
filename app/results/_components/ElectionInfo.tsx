import type { ElectionConfig } from "../../lib/crypto";

const METHOD_LABELS: Record<string, string> = {
  single: "Single Choice",
  approval: "Approval Voting",
  ranked: "Ranked Choice",
};

interface ElectionInfoProps {
  config: ElectionConfig;
  electionId: string;
}

export function ElectionInfo({ config, electionId }: ElectionInfoProps) {
  return (
    <div className="mb-8 rounded-xl border border-zinc-800 p-6">
      <h2 className="mb-4 text-lg font-semibold">Election Info</h2>
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          {config.emoji && (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-2xl">
              {config.emoji}
            </div>
          )}
          <div>
            <span className="text-sm text-zinc-400">Title: </span>
            <span className="font-semibold">{config.title}</span>
          </div>
        </div>
        {config.description && (
          <div>
            <span className="text-sm text-zinc-400">Description: </span>
            <span className="text-zinc-300">{config.description}</span>
          </div>
        )}
        <div>
          <span className="text-sm text-zinc-400">Voting Method: </span>
          <span className="text-zinc-300">
            {METHOD_LABELS[config.votingMethod] ?? config.votingMethod}
          </span>
          {config.votingMethod === "ranked" && config.rankedWeights && (
            <span className="ml-2 text-xs text-zinc-500">
              (weights: {config.rankedWeights.join(", ")})
            </span>
          )}
        </div>
        <div>
          <span className="text-sm text-zinc-400">Candidates: </span>
          <span className="text-zinc-300">{config.candidates.join(", ")}</span>
        </div>
        <div>
          <span className="text-sm text-zinc-400">Election ID: </span>
          <span className="font-mono text-xs text-zinc-500 break-all">
            {electionId}
          </span>
        </div>
      </div>
    </div>
  );
}
