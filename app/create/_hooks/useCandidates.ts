import { useState } from "react";

export function useCandidates() {
  const [candidateList, setCandidateList] = useState<string[]>([]);

  const addCandidates = (raw: string) => {
    const names = raw
      .split("\n")
      .map((c) => c.trim())
      .filter(Boolean);
    if (names.length === 0) return;
    setCandidateList((prev) => [...prev, ...names]);
  };

  const removeCandidate = (index: number) => {
    setCandidateList((prev) => prev.filter((_, i) => i !== index));
  };

  const moveCandidate = (index: number, direction: -1 | 1) => {
    setCandidateList((prev) => {
      const next = [...prev];
      const newIndex = index + direction;
      if (newIndex < 0 || newIndex >= next.length) return prev;
      [next[index], next[newIndex]] = [next[newIndex], next[index]];
      return next;
    });
  };

  const shuffleCandidates = () => {
    setCandidateList((prev) => {
      const next = [...prev];
      for (let i = next.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [next[i], next[j]] = [next[j], next[i]];
      }
      return next;
    });
  };

  const updateCandidate = (index: number, value: string) => {
    setCandidateList((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  return {
    candidateList,
    addCandidates,
    removeCandidate,
    moveCandidate,
    shuffleCandidates,
    updateCandidate,
  };
}
