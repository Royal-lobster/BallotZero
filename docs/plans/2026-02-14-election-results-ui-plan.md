# Election Results UI Improvements — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a Recharts horizontal bar chart and reorganize the results page for better data hierarchy, while maintaining the existing minimal dark design.

**Architecture:** New `ResultsChart` component using Recharts. Refactor `ElectionInfo` into a page-level header. Merge `VerificationDetails` + `VerifyBallot` into a single `VerificationSection` component. Update `page.tsx` to wire the new layout.

**Tech Stack:** Next.js 16, React 19, Recharts, Tailwind CSS 4, TypeScript

---

### Task 1: Install Recharts

**Files:**
- Modify: `package.json`

**Step 1: Install the dependency**

Run: `pnpm add recharts`

**Step 2: Verify installation**

Run: `pnpm build`
Expected: Build succeeds with no errors

**Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "feat: add recharts dependency for election results charts"
```

---

### Task 2: Create ResultsChart component

**Files:**
- Create: `app/results/_components/ResultsChart.tsx`

**Step 1: Create the component**

```tsx
"use client";

import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import type { ElectionConfig } from "../../lib/crypto";

interface ResultsChartProps {
  config: ElectionConfig;
  tally: number[];
}

export function ResultsChart({ config, tally }: ResultsChartProps) {
  const data = config.candidates
    .map((candidate, i) => ({ candidate, score: tally[i] }))
    .sort((a, b) => b.score - a.score);

  const maxScore = Math.max(...data.map((d) => d.score));
  const label =
    config.votingMethod === "ranked" || config.votingMethod === "score"
      ? "Score"
      : "Votes";

  return (
    <div className="mb-8 rounded-xl border border-zinc-800 p-6">
      <h2 className="mb-4 text-lg font-semibold">{label}</h2>
      <ResponsiveContainer width="100%" height={data.length * 48 + 16}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 0, right: 40, bottom: 0, left: 0 }}
        >
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="candidate"
            width={120}
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#a1a1aa", fontSize: 14 }}
          />
          <Bar
            dataKey="score"
            radius={[0, 6, 6, 0]}
            animationDuration={800}
            label={{
              position: "right",
              fill: "#71717a",
              fontSize: 13,
              fontFamily: "monospace",
            }}
          >
            {data.map((entry) => (
              <Cell
                key={entry.candidate}
                fill={entry.score === maxScore ? "#a1a1aa" : "#52525b"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      {config.votingMethod === "ranked" && config.rankedWeights && (
        <p className="mt-2 text-xs text-zinc-500">
          Scores reflect weighted ranked-choice voting (weights:{" "}
          {config.rankedWeights.join(", ")})
        </p>
      )}
    </div>
  );
}
```

**Step 2: Verify build**

Run: `pnpm build`
Expected: Build succeeds (component not yet imported anywhere, but should compile)

**Step 3: Commit**

```bash
git add app/results/_components/ResultsChart.tsx
git commit -m "feat: add ResultsChart horizontal bar chart component"
```

---

### Task 3: Create VerificationSection component (merge VerificationDetails + VerifyBallot)

**Files:**
- Create: `app/results/_components/VerificationSection.tsx`

**Step 1: Create the merged component**

This combines the existing VerificationDetails and VerifyBallot into one card. The verify action goes at the top, audit data (ballot count, hash, voter list) goes below.

```tsx
"use client";

import { ConnectKitButton } from "connectkit";
import { useState } from "react";
import { useAccount } from "wagmi";
import {
  type AggregatedResult,
  aggregateMaskedVotes,
  computeAggregationHash,
  type ElectionConfig,
} from "../../lib/crypto";

interface VerificationSectionProps {
  result: AggregatedResult;
  config: ElectionConfig;
}

export function VerificationSection({
  result,
  config,
}: VerificationSectionProps) {
  const { address, isConnected } = useAccount();
  const [verifyStatus, setVerifyStatus] = useState("");

  function handleVerify() {
    setVerifyStatus("");

    if (!isConnected || !address) {
      setVerifyStatus("Please connect your wallet first.");
      return;
    }

    const voterAddr = address.toLowerCase();
    const included = result.included_ballots.some(
      (b) => b.voter_address.toLowerCase() === voterAddr,
    );

    if (!included) {
      setVerifyStatus("❌ Your ballot was NOT found in the aggregation.");
      return;
    }

    try {
      const recomputedHash = computeAggregationHash(result.included_ballots);
      if (recomputedHash !== result.aggregation_hash) {
        setVerifyStatus(
          "⚠️ Your ballot is included, but the aggregation hash does not match. The aggregation may have been tampered with.",
        );
        return;
      }

      const recomputedTally = aggregateMaskedVotes(
        result.included_ballots,
        config.candidates.length,
      );
      const tallyMatch = recomputedTally.every(
        (v, i) => v === result.tally[i],
      );

      if (!tallyMatch) {
        setVerifyStatus(
          "⚠️ Your ballot is included, but the recomputed tally does not match. The results may be incorrect.",
        );
        return;
      }

      setVerifyStatus(
        "✅ Your ballot is included and the tally is verified! The results are consistent with the included ballots.",
      );
    } catch (err) {
      setVerifyStatus(
        `Verification error: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  return (
    <div className="rounded-xl border border-zinc-800 p-6">
      <h2 className="mb-4 text-lg font-semibold">Verification</h2>

      {/* Verify your ballot */}
      <p className="mb-4 text-sm text-zinc-400">
        Connect your wallet to check that your vote was included and that the
        results are correct.
      </p>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <ConnectKitButton />
        {isConnected && (
          <button
            type="button"
            onClick={handleVerify}
            className="rounded-full border border-zinc-700 px-6 py-2 text-sm font-semibold transition-colors hover:border-zinc-500 hover:bg-zinc-900"
          >
            Verify Inclusion
          </button>
        )}
      </div>
      {verifyStatus && (
        <div className="mt-4 rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-3">
          <p className="text-sm text-zinc-300">{verifyStatus}</p>
        </div>
      )}

      {/* Audit details */}
      <div className="mt-6 border-t border-zinc-800 pt-6">
        <h3 className="mb-3 text-sm font-medium text-zinc-400">
          Audit Details
        </h3>
        <div className="space-y-3">
          <div>
            <span className="text-sm text-zinc-400">Included Ballots: </span>
            <span className="font-semibold">
              {result.included_ballots.length}
            </span>
          </div>
          <div>
            <span className="text-sm text-zinc-400">Aggregation Hash: </span>
            <span className="font-mono text-xs text-zinc-500 break-all">
              {result.aggregation_hash}
            </span>
          </div>
          <div>
            <span className="mb-2 block text-sm text-zinc-400">
              Included Voters:
            </span>
            <ul className="space-y-1">
              {result.included_ballots.map((b) => (
                <li
                  key={b.voter_address}
                  className="rounded bg-zinc-900 px-3 py-1.5 font-mono text-xs text-zinc-300"
                >
                  {b.voter_address}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Verify build**

Run: `pnpm build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add app/results/_components/VerificationSection.tsx
git commit -m "feat: add VerificationSection merging verify + audit details"
```

---

### Task 4: Refactor page.tsx with new layout

**Files:**
- Modify: `app/results/page.tsx`

**Step 1: Update the results page layout**

Replace the `ResultsContent` function body to use the new layout:
- Election header with title, emoji, description, method metadata (replaces generic "Election Results" heading and ElectionInfo card)
- ResultsChart (new)
- TallyTable (unchanged)
- VerificationSection (replaces VerificationDetails + VerifyBallot)
- Election ID footer

The key changes to `page.tsx`:

1. Replace imports: remove `ElectionInfo`, `VerificationDetails`, `VerifyBallot`; add `ResultsChart`, `VerificationSection`
2. Replace the heading + ElectionInfo with an inline election header section
3. Add `<ResultsChart>` between the header and TallyTable
4. Replace `<VerificationDetails>` + `<VerifyBallot>` with `<VerificationSection>`
5. Add election ID as a footer element

**Step 2: Verify build and dev server**

Run: `pnpm build`
Expected: Build succeeds with no errors

Run: `pnpm dev` (manual check)
Expected: Results page renders with new layout

**Step 3: Commit**

```bash
git add app/results/page.tsx
git commit -m "feat: reorganize results page layout with chart and merged verification"
```

---

### Task 5: Clean up old components

**Files:**
- Delete: `app/results/_components/ElectionInfo.tsx`
- Delete: `app/results/_components/VerificationDetails.tsx`
- Delete: `app/results/_components/VerifyBallot.tsx`

**Step 1: Remove the old files**

These are fully replaced by the inline header in page.tsx and the new VerificationSection.

**Step 2: Verify build**

Run: `pnpm build`
Expected: Build succeeds, no dead imports

**Step 3: Commit**

```bash
git add -u app/results/_components/
git commit -m "refactor: remove old ElectionInfo, VerificationDetails, VerifyBallot components"
```

---

### Task 6: Final verification

**Step 1: Full build check**

Run: `pnpm build`
Expected: Build succeeds

**Step 2: Lint check**

Run: `pnpm lint`
Expected: No errors

**Step 3: Manual smoke test**

Run: `pnpm dev`
Navigate to a results page and verify:
- Election header shows title, emoji, description, method
- Bar chart renders with correct data
- Tally table shows exact numbers
- Verification section works (connect wallet, verify)
- Election ID appears at bottom
- All styling matches existing design (zinc palette, rounded-xl cards, no gradients)
