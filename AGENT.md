# About Project

BallotZero is a fully client-side, trustless voting system that uses DC-net (Dining Cryptographers Network) pairwise masking to ensure individual ballot privacy while allowing the aggregate tally to be computed by simple addition. No decryption keys exist. No backend is required. The organizer is purely a coordinator with no cryptographic privilege.

## Pages

BallotZero consists of five pages:

### Onboard (`/onboard`)

The voter connects their wallet via ConnectKit and signs a deterministic message (`BallotZero:onboard`) with their wallet. From this signature, a reusable BallotZero-specific secp256k1 keypair is derived via `SHA-256(signature) mod curve_order`. The derived public key (epk) is serialized with the voter's address into a compact voter key string that the voter copies and shares with the organizer. This is a one-time step — the same keypair works for all elections. The wallet private key never leaves MetaMask — only the deterministic signature is used.

### Create Election (`/create`)

The organizer defines the election: title, description, candidate list, voter keys (address + public key pairs from the Onboard page), and voting method (single choice, approval, or ranked). If ranked voting is selected, they configure point weights (default 5, 3, 1). No encryption keypair is generated — the organizer holds no keys. The page directly produces a shareable voting link that encodes the election configuration (including voter keys) as base64 — no separate finalize step is needed since voter public keys are already included. The SHA-256 hash of the canonical JSON election config defines the election_id.

### Election (`/election?config=...`)

The voter connects their wallet via ConnectKit, which is verified against the voter list. They sign `BallotZero:onboard` to re-derive their BallotZero private key (deterministic — same signature yields same key). They select their vote, which is encoded into a fixed-length integer vector. The voter then computes a DC-net mask vector using ECDH shared secrets with all other voters' public keys. The mask is applied to the vote vector modulo the secp256k1 curve order. A second wallet signature is obtained to sign the masked ballot for integrity. The voter produces a ballot link to share with the organizer.

### Aggregate (`/aggregate`)

The organizer pastes the election config and all collected ballot strings. The system validates each ballot (correct election_id, voter in the election, correct vector length, no duplicate voters). It then simply sums all masked vote vectors modulo the curve order. Because every pairwise mask appears once as addition and once as subtraction across all voters, the masks cancel and the sum equals the plaintext tally. No decryption step exists. The page displays the results directly and generates a shareable results link. It warns if any registered voters are missing (their absence would corrupt the tally).

### Results (`/results?data=...&config=...`)

Displays the election metadata, final tally (sorted by score), aggregation hash, and list of included voter addresses. No private key input is needed — the tally is already in plaintext from the aggregation step. Any voter can connect their wallet to verify their ballot was included. The verification re-sums all included ballot vectors and compares against the published tally, and re-computes the aggregation hash to check for tampering.

## Cryptographic Protocol

BallotZero uses a DC-net (Dining Cryptographers Network) protocol adapted for wallet-based voting:

### Key Derivation
Each voter derives a reusable BallotZero-specific secp256k1 keypair by signing `BallotZero:onboard` with their wallet. MetaMask uses RFC 6979 for deterministic ECDSA, so signing the same message always produces the same signature. The signature is hashed with SHA-256 to produce a private scalar, from which the public key is derived. The same keypair is reused across all elections. Masks remain election-specific because the election_id is mixed into the mask derivation hash.

### Pairwise Shared Secrets
For any two voters i and j, both can independently compute the same ECDH shared secret: `esk_i × epk_j = esk_j × epk_i = (esk_i × esk_j) × G`. This shared point is used to derive deterministic mask values via `SHA-256(shared.x || shared.y || election_id || component_index) mod curve_order`.

### Mask Construction
For each pair (i, j) sorted by address:
- The voter with the smaller address ADDS the mask
- The voter with the larger address SUBTRACTS the mask

When all masked votes are summed: `Σ p_i = Σ (v_i + mask_i) = Σ v_i + 0`, because every mask term appears exactly once as positive and once as negative.

### Security Properties
- **Individual privacy**: A voter's raw vote is hidden by the sum of all their pairwise masks. To recover voter i's vote, an attacker would need ALL N-1 other voters' BallotZero private keys.
- **Information-theoretic security**: Privacy holds even against computationally unbounded adversaries (unlike encryption-based schemes).
- **Verifiability**: Anyone can re-sum the published masked ballots and verify the tally matches.
- **No trusted party**: No decryption key exists. The organizer is a pure coordinator — they cannot learn individual votes or manipulate the tally without detection.

### Trade-off
ALL voters in the election must submit a ballot for the masks to cancel. If any voter drops out, their uncanceled mask corrupts the tally. This is acceptable for small elections where participation is expected.

## Tech Stack
- **Next.js 16** (App Router) with React 19
- **ConnectKit** + **wagmi** + **viem** for wallet connection and message signing
- **@noble/curves** (secp256k1) for elliptic curve point arithmetic and ECDH
- **@noble/hashes** (SHA-256) for hashing
- **Tailwind CSS** for styling (dark theme)
- **Biome** for linting and formatting
- **Canonical JSON** serialization for deterministic hashing of all objects
