"use client";

import { get, set } from "idb-keyval";

function storeKey(electionId: string, suffix: string): string {
  return `ballotzero:${electionId}:${suffix}`;
}

// ─── Election Config ────────────────────────────────────────────────

export interface SavedElection {
  electionId: string;
  title: string;
  createdAt: number;
  emoji?: string;
}

const ELECTIONS_INDEX_KEY = "ballotzero:elections";

export async function saveConfig(electionId: string, configBase64: string, title?: string, emoji?: string): Promise<void> {
  await set(storeKey(electionId, "config"), configBase64);
  if (title) {
    const index = await getSavedElections();
    if (!index.some((e) => e.electionId === electionId)) {
      index.push({ electionId, title, createdAt: Date.now(), emoji });
      await set(ELECTIONS_INDEX_KEY, index);
    }
  }
}

export async function getConfig(electionId: string): Promise<string | null> {
  return (await get<string>(storeKey(electionId, "config"))) ?? null;
}

export async function getSavedElections(): Promise<SavedElection[]> {
  return (await get<SavedElection[]>(ELECTIONS_INDEX_KEY)) ?? [];
}

// ─── Voter Keys (for Create page) ──────────────────────────────────

export async function getVoterKeys(electionDraft: string): Promise<string[]> {
  return (await get<string[]>(`ballotzero:draft:${electionDraft}:voterkeys`)) ?? [];
}

export async function saveVoterKeys(electionDraft: string, keys: string[]): Promise<void> {
  await set(`ballotzero:draft:${electionDraft}:voterkeys`, keys);
}

// ─── Ballots (for Aggregate page) ──────────────────────────────────

export async function getBallots(electionId: string): Promise<string[]> {
  return (await get<string[]>(storeKey(electionId, "ballots"))) ?? [];
}

export async function saveBallots(electionId: string, ballots: string[]): Promise<void> {
  await set(storeKey(electionId, "ballots"), ballots);
}

export async function addBallot(electionId: string, ballot: string): Promise<void> {
  const ballots = await getBallots(electionId);
  if (!ballots.includes(ballot)) {
    ballots.push(ballot);
    await saveBallots(electionId, ballots);
  }
}

export async function removeBallot(electionId: string, ballot: string): Promise<void> {
  const ballots = (await getBallots(electionId)).filter((b) => b !== ballot);
  await saveBallots(electionId, ballots);
}

// ─── Address Aliases (global, reused across elections) ──────────────

const ALIASES_KEY = "ballotzero:aliases";

export type AliasMap = Record<string, string>; // lowercase address → alias

export async function getAliases(): Promise<AliasMap> {
  return (await get<AliasMap>(ALIASES_KEY)) ?? {};
}

export async function saveAliases(aliases: AliasMap): Promise<void> {
  await set(ALIASES_KEY, aliases);
}

export async function setAlias(address: string, alias: string): Promise<void> {
  const aliases = await getAliases();
  const key = address.toLowerCase();
  if (alias.trim()) {
    aliases[key] = alias.trim();
  } else {
    delete aliases[key];
  }
  await saveAliases(aliases);
}

// ─── Address Book (global voter key registry) ───────────────────────

const ADDRESS_BOOK_KEY = "ballotzero:addressbook";

export type AddressBook = Record<string, string>; // lowercase address → serialized voter key

export async function getAddressBook(): Promise<AddressBook> {
  return (await get<AddressBook>(ADDRESS_BOOK_KEY)) ?? {};
}

export async function saveToAddressBook(address: string, serializedKey: string): Promise<void> {
  const book = await getAddressBook();
  book[address.toLowerCase()] = serializedKey;
  await set(ADDRESS_BOOK_KEY, book);
}

export async function saveAllToAddressBook(entries: { address: string; serializedKey: string }[]): Promise<void> {
  const book = await getAddressBook();
  for (const { address, serializedKey } of entries) {
    book[address.toLowerCase()] = serializedKey;
  }
  await set(ADDRESS_BOOK_KEY, book);
}
