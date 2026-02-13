"use client";

import { secp256k1 } from "@noble/curves/secp256k1.js";
import { sha256 } from "@noble/hashes/sha2.js";
import { bytesToHex, hexToBytes } from "@noble/hashes/utils.js";

const Point = secp256k1.Point;
const G = Point.BASE;
const CURVE_ORDER = Point.CURVE().n;

// ─── Types ───────────────────────────────────────────────────────────

export interface Voter {
  address: string; // lowercase ethereum address
  epk: { x: string; y: string }; // BallotZero-derived public key
}

export interface ElectionConfig {
  title: string;
  description: string;
  candidates: string[];
  voters: Voter[];
  votingMethod: "single" | "approval" | "ranked";
  rankedWeights?: number[];
}

export interface BallotData {
  election_id: string;
  voter_address: string;
  masked_vote: string[]; // hex-encoded bigint values (mod CURVE_ORDER)
  signature: string; // wallet signature for integrity
}

export interface AggregatedResult {
  election_id: string;
  tally: number[];
  included_ballots: BallotData[];
  aggregation_hash: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────

function bigintToHex(n: bigint): string {
  return n.toString(16).padStart(64, "0");
}

function hexToBigint(hex: string): bigint {
  return BigInt(`0x${hex}`);
}

function mod(a: bigint, m: bigint): bigint {
  return ((a % m) + m) % m;
}

function pointToJson(p: InstanceType<typeof Point>): { x: string; y: string } {
  const affine = p.toAffine();
  return { x: bigintToHex(affine.x), y: bigintToHex(affine.y) };
}

function jsonToPoint(p: { x: string; y: string }): InstanceType<typeof Point> {
  return Point.fromAffine({ x: hexToBigint(p.x), y: hexToBigint(p.y) });
}

// ─── Canonical JSON ─────────────────────────────────────────────────

export function canonicalJson(obj: unknown): string {
  if (obj === null || obj === undefined) return JSON.stringify(obj);
  if (typeof obj !== "object") return JSON.stringify(obj);
  if (Array.isArray(obj)) {
    return `[${obj.map(canonicalJson).join(",")}]`;
  }
  const sorted = Object.keys(obj as Record<string, unknown>)
    .sort()
    .map((key) => {
      const val = (obj as Record<string, unknown>)[key];
      return `${JSON.stringify(key)}:${canonicalJson(val)}`;
    });
  return `{${sorted.join(",")}}`;
}

// ─── Election ID ─────────────────────────────────────────────────────

export function computeElectionId(config: ElectionConfig): string {
  const json = canonicalJson(config);
  const hash = sha256(new TextEncoder().encode(json));
  return bytesToHex(hash);
}

// ─── Vote Encoding ──────────────────────────────────────────────────

export function encodeVoteVector(
  votingMethod: ElectionConfig["votingMethod"],
  numCandidates: number,
  selection: number | number[],
  rankedWeights?: number[],
): bigint[] {
  const vector = new Array<bigint>(numCandidates).fill(0n);

  switch (votingMethod) {
    case "single": {
      const idx = selection as number;
      vector[idx] = 1n;
      break;
    }
    case "approval": {
      for (const idx of selection as number[]) {
        vector[idx] = 1n;
      }
      break;
    }
    case "ranked": {
      const weights = rankedWeights ?? [5, 3, 1];
      const ranked = selection as number[];
      for (let i = 0; i < ranked.length && i < weights.length; i++) {
        vector[ranked[i]] = BigInt(weights[i]);
      }
      break;
    }
  }

  return vector;
}

// ─── Key Derivation ─────────────────────────────────────────────────

/**
 * Derive a BallotZero keypair from a wallet signature.
 * The voter signs a one-time onboard message, and we derive a
 * secp256k1 keypair from the signature bytes.
 */
export function deriveKeypair(walletSignature: string): {
  esk: bigint;
  epk: { x: string; y: string };
} {
  // Hash the signature to get a scalar
  const sigBytes = hexToBytes(walletSignature.replace("0x", ""));
  const hash = sha256(sigBytes);
  let esk = hexToBigint(bytesToHex(hash));
  // Ensure esk is a valid scalar (1 < esk < CURVE_ORDER)
  esk = mod(esk, CURVE_ORDER - 2n) + 1n;
  const epk = G.multiply(esk);
  return { esk, epk: pointToJson(epk) };
}

/**
 * The one-time onboard message each voter signs to derive their BallotZero keypair.
 */
export function registrationMessage(): string {
  return "BallotZero:onboard";
}

/**
 * The deterministic message each voter signs when casting their vote.
 * This is different from the registration message to avoid signature reuse.
 */
export function ballotSignMessage(electionId: string, maskedVote: string[]): string {
  const payload = canonicalJson({ election_id: electionId, masked_vote: maskedVote });
  const hash = sha256(new TextEncoder().encode(payload));
  return bytesToHex(hash);
}

// ─── DC-Net Masking ─────────────────────────────────────────────────

/**
 * Compute the ECDH shared secret between two election keys.
 * shared = myEsk * theirEpk (a point on the curve)
 * This is symmetric: esk_i * epk_j = esk_j * epk_i
 */
function computeSharedSecret(
  myEsk: bigint,
  theirEpk: { x: string; y: string },
): { x: string; y: string } {
  const theirPoint = jsonToPoint(theirEpk);
  const shared = theirPoint.multiply(myEsk);
  return pointToJson(shared);
}

/**
 * Derive a mask scalar for a specific pair and component index.
 * Uses SHA-256(shared_secret.x || shared_secret.y || election_id || component_index)
 */
function deriveMaskComponent(
  sharedSecret: { x: string; y: string },
  electionId: string,
  componentIndex: number,
): bigint {
  const input = `${sharedSecret.x}${sharedSecret.y}${electionId}${componentIndex}`;
  const hash = sha256(new TextEncoder().encode(input));
  return mod(hexToBigint(bytesToHex(hash)), CURVE_ORDER);
}

/**
 * Compute the full mask vector for a voter.
 * 
 * For each pair (i, j) where i < j (sorted by address):
 *   - voter i ADDS the mask
 *   - voter j SUBTRACTS the mask
 * 
 * When all voters' masked votes are summed, masks cancel: Σ masks = 0
 */
export function computeMaskVector(
  myAddress: string,
  myEsk: bigint,
  voters: Voter[],
  numCandidates: number,
  electionId: string,
): bigint[] {
  const mask = new Array<bigint>(numCandidates).fill(0n);
  const myAddrLower = myAddress.toLowerCase();

  for (const voter of voters) {
    if (voter.address.toLowerCase() === myAddrLower) continue;

    const shared = computeSharedSecret(myEsk, voter.epk);
    const iAmSmaller = myAddrLower < voter.address.toLowerCase();

    for (let k = 0; k < numCandidates; k++) {
      const maskVal = deriveMaskComponent(shared, electionId, k);
      if (iAmSmaller) {
        mask[k] = mod(mask[k] + maskVal, CURVE_ORDER);
      } else {
        mask[k] = mod(mask[k] - maskVal, CURVE_ORDER);
      }
    }
  }

  return mask;
}

/**
 * Apply mask to vote vector: p_i = (v_i + mask_i) mod CURVE_ORDER
 */
export function applyMask(voteVector: bigint[], maskVector: bigint[]): string[] {
  return voteVector.map((v, i) => bigintToHex(mod(v + maskVector[i], CURVE_ORDER)));
}

// ─── Aggregation ────────────────────────────────────────────────────

/**
 * Sum all masked vote vectors mod CURVE_ORDER.
 * Since masks cancel, the result is the plaintext tally.
 * Small positive results stay small. Results close to CURVE_ORDER would
 * indicate negative values (shouldn't happen with valid votes).
 */
export function aggregateMaskedVotes(
  ballots: BallotData[],
  numCandidates: number,
): number[] {
  const sums = new Array<bigint>(numCandidates).fill(0n);

  for (const ballot of ballots) {
    for (let k = 0; k < numCandidates; k++) {
      sums[k] = mod(sums[k] + hexToBigint(ballot.masked_vote[k]), CURVE_ORDER);
    }
  }

  // Convert to small integers. The result should be small and positive.
  return sums.map((s) => {
    // If s > CURVE_ORDER / 2, it represents a negative number (shouldn't happen)
    if (s > CURVE_ORDER / 2n) {
      return Number(s - CURVE_ORDER);
    }
    return Number(s);
  });
}

// ─── Serialization ──────────────────────────────────────────────────

export function serializeBallot(ballot: BallotData): string {
  const json = canonicalJson(ballot);
  return btoa(
    Array.from(new TextEncoder().encode(json), (b) =>
      String.fromCharCode(b),
    ).join(""),
  );
}

export function deserializeBallot(encoded: string): BallotData {
  const binary = atob(encoded);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  const json = new TextDecoder().decode(bytes);
  return JSON.parse(json) as BallotData;
}

export function serializeVoter(voter: Voter): string {
  const point = Point.fromAffine({
    x: hexToBigint(voter.epk.x),
    y: hexToBigint(voter.epk.y),
  });
  const compressedHex = bytesToHex(point.toBytes(true));
  const json = canonicalJson({ a: voter.address, k: compressedHex });
  return btoa(
    Array.from(new TextEncoder().encode(json), (b) =>
      String.fromCharCode(b),
    ).join(""),
  );
}

export function deserializeVoter(encoded: string): Voter {
  const binary = atob(encoded);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  const json = new TextDecoder().decode(bytes);
  const parsed = JSON.parse(json);
  if (parsed.a && parsed.k) {
    const point = Point.fromHex(parsed.k);
    return { address: parsed.a, epk: pointToJson(point) };
  }
  return parsed as Voter;
}

// ─── Hashing ────────────────────────────────────────────────────────

export function computeAggregationHash(ballots: BallotData[]): string {
  const serialized = ballots.map((b) => serializeBallot(b));
  const hashed = serialized.map((s) => {
    const h = sha256(new TextEncoder().encode(s));
    return bytesToHex(h);
  });
  const sorted = [...hashed].sort();
  const concat = sorted.join("");
  const finalHash = sha256(new TextEncoder().encode(concat));
  return bytesToHex(finalHash);
}
