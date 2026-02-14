import { useEffect, useState } from "react";
import { deserializeVoter, serializeVoter, type Voter } from "../../lib/crypto";
import {
  type AddressBook,
  type AliasMap,
  getAddressBook,
  getAliases,
  getVoterKeys,
  saveAllToAddressBook,
  saveVoterKeys,
  setAlias,
} from "../../lib/storage";

const DRAFT_KEY = "current";

export function useVoters() {
  const [voters, setVoters] = useState<Voter[]>([]);
  const [votersLoaded, setVotersLoaded] = useState(false);
  const [voterError, setVoterError] = useState("");
  const [aliases, setAliases] = useState<AliasMap>({});
  const [addressBook, setAddressBook] = useState<AddressBook>({});

  // Load persisted voters and aliases from IndexedDB, then merge hash voter
  useEffect(() => {
    let cancelled = false;
    Promise.all([getVoterKeys(DRAFT_KEY), getAliases(), getAddressBook()]).then(
      ([stored, savedAliases, savedBook]) => {
        if (cancelled) return;
        setAliases(savedAliases);
        setAddressBook(savedBook);

        const loaded: Voter[] = [];
        const seen = new Set<string>();
        for (const s of stored) {
          try {
            const v = deserializeVoter(s);
            if (!seen.has(v.address)) {
              loaded.push(v);
              seen.add(v.address);
            }
          } catch {
            // skip invalid
          }
        }

        // Also extract voter from URL hash if present
        const hash = window.location.hash;
        if (hash.startsWith("#voterkey=")) {
          const voterKeyStr = decodeURIComponent(
            hash.slice("#voterkey=".length),
          );
          try {
            const voter = deserializeVoter(voterKeyStr);
            if (!seen.has(voter.address)) {
              loaded.push(voter);
            }
          } catch {
            // ignore invalid hash
          }
          window.history.replaceState(null, "", window.location.pathname);
        }

        setVoters(loaded);
        setVotersLoaded(true);
      },
    );
    return () => {
      cancelled = true;
    };
  }, []);

  // Persist voters to IndexedDB and global address book whenever they change
  useEffect(() => {
    if (!votersLoaded) return;
    const serialized = voters.map((v) => serializeVoter(v));
    saveVoterKeys(DRAFT_KEY, serialized);
    saveAllToAddressBook(
      voters.map((v, i) => ({
        address: v.address,
        serializedKey: serialized[i],
      })),
    );
  }, [voters, votersLoaded]);

  const tryAddVoter = (raw: string) => {
    const lines = raw
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length === 0) return;
    setVoterError("");

    let added = 0;
    let duplicates = 0;
    let invalid = 0;

    setVoters((prev) => {
      const next = [...prev];
      const seen = new Set(next.map((v) => v.address));
      for (const line of lines) {
        try {
          let voterKeyStr = line;
          const hashIdx = line.indexOf("#voterkey=");
          if (hashIdx !== -1) {
            voterKeyStr = line.slice(hashIdx + "#voterkey=".length);
          }
          const voter = deserializeVoter(voterKeyStr);
          if (seen.has(voter.address)) {
            duplicates++;
            continue;
          }
          next.push(voter);
          seen.add(voter.address);
          added++;
        } catch {
          invalid++;
        }
      }
      return next;
    });

    if (invalid > 0 && added === 0 && duplicates === 0) {
      setVoterError("Invalid voter key or link.");
    } else if (invalid > 0) {
      setVoterError(
        `Added ${added}, skipped ${duplicates} duplicate(s) and ${invalid} invalid.`,
      );
    } else if (duplicates > 0 && added === 0) {
      setVoterError(
        lines.length === 1
          ? "This voter has already been added."
          : `All ${duplicates} voter(s) already added.`,
      );
    }
  };

  const removeVoter = (address: string) => {
    setVoters((prev) => prev.filter((v) => v.address !== address));
  };

  const addressBookEntries = Object.entries(addressBook).filter(
    ([addr]) => !voters.some((v) => v.address.toLowerCase() === addr),
  );

  const addFromAddressBook = () => {
    const newVoters: Voter[] = [];
    const seen = new Set(voters.map((v) => v.address.toLowerCase()));
    for (const [addr, serialized] of Object.entries(addressBook)) {
      if (seen.has(addr)) continue;
      try {
        const voter = deserializeVoter(serialized);
        newVoters.push(voter);
        seen.add(addr);
      } catch {
        // skip invalid
      }
    }
    if (newVoters.length > 0) {
      setVoters((prev) => [...prev, ...newVoters]);
    }
  };

  const updateAlias = (address: string, name: string) => {
    const key = address.toLowerCase();
    setAliases((prev) => {
      const next = { ...prev };
      if (name.trim()) {
        next[key] = name.trim();
      } else {
        delete next[key];
      }
      return next;
    });
    setAlias(address, name);
  };

  return {
    voters,
    votersLoaded,
    voterError,
    setVoterError,
    aliases,
    addressBookEntries,
    tryAddVoter,
    removeVoter,
    addFromAddressBook,
    updateAlias,
  };
}
