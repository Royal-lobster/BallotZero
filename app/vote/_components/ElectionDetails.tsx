import type { ElectionConfig } from "../../lib/crypto";

const METHOD_LABELS: Record<ElectionConfig["votingMethod"], string> = {
  single: "Single Choice",
  approval: "Approval Voting",
  ranked: "Ranked Choice",
  score: "Score Voting",
};

interface ElectionDetailsProps {
  config: ElectionConfig;
  electionId: string;
}

export function ElectionDetails({ config, electionId }: ElectionDetailsProps) {
  return (
    <div className="rounded-xl border border-zinc-800 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-zinc-500">Voting Method</span>
        <span className="text-sm font-medium">
          {METHOD_LABELS[config.votingMethod]}
        </span>
      </div>
      {config.votingMethod === "ranked" && config.rankedWeights && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-zinc-500">Point Weights</span>
          <span className="text-sm font-medium">
            {config.rankedWeights.join(", ")}
          </span>
        </div>
      )}
      <div className="flex items-center justify-between">
        <span className="text-sm text-zinc-500">Candidates</span>
        <span className="text-sm font-medium">{config.candidates.length}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-zinc-500">Eligible Voters</span>
        <span className="text-sm font-medium">{config.voters.length}</span>
      </div>
      <div className="border-t border-zinc-800 pt-4">
        <span className="text-sm text-zinc-500">Election ID</span>
        <p className="mt-1 break-all font-mono text-xs text-zinc-400">
          {electionId}
        </p>
      </div>
    </div>
  );
}
