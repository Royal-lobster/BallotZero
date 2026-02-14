import { useForm } from "react-hook-form";
import useFormPersist from "react-hook-form-persist";
import { compressForUrl } from "../../lib/compression";
import {
  computeElectionId,
  type ElectionConfig,
  type Voter,
} from "../../lib/crypto";
import { clearDraft, saveConfig } from "../../lib/storage";

export interface ElectionFormValues {
  title: string;
  description: string;
  emoji: string;
  votingMethod: "single" | "approval" | "ranked" | "score";
  rankedWeights: string;
  scoreMax: number;
}

const STORAGE_KEY = "ballotzero:draft:form";

export interface ElectionResult {
  electionId: string;
  votingLink: string;
  configBase64: string;
}

export function useElectionForm() {
  const form = useForm<ElectionFormValues>({
    defaultValues: {
      title: "",
      description: "",
      emoji: "",
      votingMethod: "single",
      rankedWeights: "5,3,1",
      scoreMax: 5,
    },
  });

  useFormPersist(STORAGE_KEY, {
    watch: form.watch,
    setValue: form.setValue,
    storage: typeof window !== "undefined" ? window.localStorage : undefined,
  });

  const validate = (
    values: ElectionFormValues,
    candidateList: string[],
    voters: Voter[],
  ): string[] => {
    const errs: string[] = [];
    if (!values.title.trim()) errs.push("Title is required.");
    const filtered = candidateList.filter((c) => c.trim());
    if (filtered.length < 2) errs.push("At least 2 candidates are required.");
    if (voters.length < 1) errs.push("At least 1 voter is required.");
    if (values.votingMethod === "ranked") {
      const weights = values.rankedWeights.split(",").map((w) => w.trim());
      if (weights.some((w) => !w || Number.isNaN(Number.parseInt(w, 10)))) {
        errs.push("Ranked weights must be comma-separated numbers.");
      }
    }
    if (values.votingMethod === "score") {
      if (values.scoreMax < 1 || values.scoreMax > 100) {
        errs.push("Score max must be between 1 and 100.");
      }
    }
    return errs;
  };

  const handleCreate = async (
    values: ElectionFormValues,
    candidateList: string[],
    voters: Voter[],
  ): Promise<ElectionResult | string[]> => {
    const validationErrors = validate(values, candidateList, voters);
    if (validationErrors.length > 0) {
      return validationErrors;
    }

    const filtered = candidateList.filter((c) => c.trim());

    const config: ElectionConfig = {
      title: values.title.trim(),
      description: values.description.trim(),
      candidates: filtered,
      voters,
      votingMethod: values.votingMethod,
      ...(values.votingMethod === "ranked"
        ? {
            rankedWeights: values.rankedWeights
              .split(",")
              .map((w) => Number.parseInt(w.trim(), 10)),
          }
        : {}),
      ...(values.votingMethod === "score" ? { scoreMax: values.scoreMax } : {}),
      ...(values.emoji ? { emoji: values.emoji } : {}),
    };

    const electionId = computeElectionId(config);
    const configEncoded = compressForUrl(JSON.stringify(config));
    await saveConfig(
      electionId,
      configEncoded,
      config.title,
      values.emoji || undefined,
    );
    const votingLink = `${window.location.origin}/vote?config=${configEncoded}`;

    // Clear draft after successful creation
    window.localStorage.removeItem(STORAGE_KEY);
    await clearDraft();

    return { electionId, votingLink, configBase64: configEncoded };
  };

  return { form, handleCreate };
}
