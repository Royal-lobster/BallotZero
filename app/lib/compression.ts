"use client";

import { deflateRaw, inflateRaw } from "pako";

// ─── Key Abbreviation ───────────────────────────────────────────────

const KEY_MAP: Record<string, string> = {
  election_id: "e",
  voter_address: "a",
  masked_vote: "m",
  signature: "s",
  included_ballots: "b",
  aggregation_hash: "h",
  candidates: "c",
  voters: "V",
  votingMethod: "M",
  description: "d",
  title: "t",
  address: "A",
  tally: "T",
  rankedWeights: "W",
  scoreMax: "S",
  emoji: "E",
};

const REVERSE_KEY_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(KEY_MAP).map(([k, v]) => [v, k]),
);

function abbreviateKeys(json: string): string {
  let result = json;
  for (const [full, short] of Object.entries(KEY_MAP)) {
    result = result.replaceAll(`"${full}":`, `"${short}":`);
  }
  return result;
}

function restoreKeys(json: string): string {
  let result = json;
  // Match "X": (with colon) to only replace JSON keys, never values.
  for (const [short, full] of Object.entries(REVERSE_KEY_MAP)) {
    result = result.replaceAll(`"${short}":`, `"${full}":`);
  }
  return result;
}

// ─── Base64url (RFC 4648 §5) ────────────────────────────────────────

function toBase64url(bytes: Uint8Array): string {
  const binary = Array.from(bytes, (b) => String.fromCharCode(b)).join("");
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function fromBase64url(str: string): Uint8Array {
  // Restore standard base64 characters and padding
  const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

// ─── Version byte ───────────────────────────────────────────────────

const VERSION_COMPRESSED = 0x01;

// ─── Public API ─────────────────────────────────────────────────────

/**
 * Compress a JSON string for URL transport.
 *
 * Pipeline: abbreviate keys → UTF-8 encode → deflate (raw, level 9) →
 * prepend version byte → base64url.
 *
 * The result is URL-safe and does NOT need encodeURIComponent.
 */
export function compressForUrl(json: string): string {
  const abbreviated = abbreviateKeys(json);
  const bytes = new TextEncoder().encode(abbreviated);
  const compressed = deflateRaw(bytes, { level: 9 });
  const withVersion = new Uint8Array(1 + compressed.length);
  withVersion[0] = VERSION_COMPRESSED;
  withVersion.set(compressed, 1);
  return toBase64url(withVersion);
}

/**
 * Decompress a URL-encoded string back to JSON.
 *
 * Handles both the new compressed format (version byte 0x01) and
 * legacy plain base64 for backwards compatibility.
 */
export function decompressFromUrl(encoded: string): string {
  // Try new compressed format first
  try {
    const bytes = fromBase64url(encoded);
    if (bytes.length > 0 && bytes[0] === VERSION_COMPRESSED) {
      const decompressed = inflateRaw(bytes.subarray(1));
      const json = new TextDecoder().decode(decompressed);
      return restoreKeys(json);
    }
  } catch {
    // Fall through to legacy
  }

  // Legacy format: plain base64 (possibly with standard base64 chars)
  const binary = atob(encoded);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}
