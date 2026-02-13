"use client";

function key(electionId: string, suffix: string): string {
  return `ballotzero:${electionId}:${suffix}`;
}

export function saveConfig(electionId: string, configBase64: string): void {
  localStorage.setItem(key(electionId, "config"), configBase64);
}

export function getConfig(electionId: string): string | null {
  return localStorage.getItem(key(electionId, "config"));
}

export function getBallots(electionId: string): string[] {
  const raw = localStorage.getItem(key(electionId, "ballots"));
  if (!raw) return [];
  return JSON.parse(raw) as string[];
}

export function addBallot(electionId: string, ballot: string): void {
  const ballots = getBallots(electionId);
  if (!ballots.includes(ballot)) {
    ballots.push(ballot);
    localStorage.setItem(key(electionId, "ballots"), JSON.stringify(ballots));
  }
}

export function removeBallot(electionId: string, ballot: string): void {
  const ballots = getBallots(electionId).filter((b) => b !== ballot);
  localStorage.setItem(key(electionId, "ballots"), JSON.stringify(ballots));
}
