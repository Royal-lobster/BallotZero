import type { UseFormReturn } from "react-hook-form";
import type { ElectionFormValues } from "../_hooks/useElectionForm";

const METHODS = [
  {
    value: "single" as const,
    label: "Single Choice",
    icon: "1",
    desc: "Each voter picks exactly one candidate. The candidate with the most votes wins.",
  },
  {
    value: "approval" as const,
    label: "Approval",
    icon: "\u2713\u2713",
    desc: "Voters can approve as many candidates as they like. Highest approval count wins.",
  },
  {
    value: "ranked" as const,
    label: "Ranked Choice",
    icon: "#",
    desc: "Voters rank candidates by preference. Points are awarded based on rank position.",
  },
  {
    value: "score" as const,
    label: "Score Voting",
    icon: "\u2605",
    desc: "Voters rate each candidate on a scale (e.g. 0\u20135). Highest average score wins.",
  },
];

interface VotingMethodSelectorProps {
  form: UseFormReturn<ElectionFormValues>;
}

export function VotingMethodSelector({ form }: VotingMethodSelectorProps) {
  const votingMethod = form.watch("votingMethod");

  return (
    <>
      <div>
        <p className="mb-3 text-sm font-medium text-zinc-300">Voting Method</p>
        <div className="grid grid-cols-2 gap-3">
          {METHODS.map((method) => (
            <button
              key={method.value}
              type="button"
              onClick={() => form.setValue("votingMethod", method.value)}
              className={`flex flex-col items-start gap-1.5 rounded-xl border p-4 text-left transition-all ${
                votingMethod === method.value
                  ? "border-white bg-white/5"
                  : "border-zinc-800 hover:border-zinc-600"
              }`}
            >
              <div className="flex w-full items-center gap-2.5">
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${
                    votingMethod === method.value
                      ? "bg-white text-black"
                      : "bg-zinc-800 text-zinc-400"
                  }`}
                >
                  {method.icon}
                </span>
                <span
                  className={`text-sm font-semibold ${
                    votingMethod === method.value
                      ? "text-white"
                      : "text-zinc-300"
                  }`}
                >
                  {method.label}
                </span>
              </div>
              <p className="text-xs leading-relaxed text-zinc-500">
                {method.desc}
              </p>
            </button>
          ))}
        </div>
      </div>

      {votingMethod === "ranked" && (
        <div>
          <label
            htmlFor="rankedWeights"
            className="mb-2 block text-sm font-medium text-zinc-300"
          >
            Ranked Weights
          </label>
          <p className="mb-2 text-xs text-zinc-500">
            Comma-separated point values for each rank position (e.g. 1st, 2nd,
            3rd place).
          </p>
          <input
            id="rankedWeights"
            type="text"
            {...form.register("rankedWeights")}
            placeholder="5,3,1"
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 font-mono text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none"
          />
        </div>
      )}

      {votingMethod === "score" && (
        <div>
          <label
            htmlFor="scoreMax"
            className="mb-2 block text-sm font-medium text-zinc-300"
          >
            Maximum Score
          </label>
          <p className="mb-2 text-xs text-zinc-500">
            The highest score a voter can give a candidate (e.g. 5 means the
            scale is 0&ndash;5).
          </p>
          <input
            id="scoreMax"
            type="number"
            min={1}
            max={100}
            {...form.register("scoreMax", { valueAsNumber: true })}
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 font-mono text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none"
          />
        </div>
      )}
    </>
  );
}
