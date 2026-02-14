# Election Results UI Improvements

## Goal

Add a Recharts horizontal bar chart and reorganize the results page data for better hierarchy, while maintaining the existing minimal dark design.

## Current State

Four equally-weighted cards stacked vertically: ElectionInfo, TallyTable, VerificationDetails, VerifyBallot. No visual hierarchy — election title buried in a card, verification split across two cards.

## Design

### Page Layout (top to bottom)

1. **Back link** — unchanged
2. **Election header** — title, emoji, description pulled out of the ElectionInfo card into the page header. Voting method + candidate count shown as zinc-400 metadata. Replaces generic "Election Results" heading.
3. **ResultsChart** (NEW) — Recharts horizontal bar chart in a `rounded-xl border border-zinc-800` card. Bars in zinc-600, winner bar in zinc-400. Candidate names on Y-axis, counts at bar ends. Adapts label ("Votes" vs "Score") per voting method.
4. **TallyTable** — unchanged, keeps exact numbers.
5. **Verification section** — VerificationDetails + VerifyBallot merged into a single card with two subsections: verify action up top, audit data (voter addresses, hash) below.
6. **Election ID** — small footer-style element with canonical ID.

### Component Changes

| Component | Change |
|-----------|--------|
| `ElectionInfo` | Refactored — title/emoji/description become page header, election ID moves to footer |
| `ResultsChart` | New — Recharts horizontal bar chart |
| `TallyTable` | No changes |
| `VerificationDetails` | Merged with VerifyBallot into single `VerificationSection` |
| `VerifyBallot` | Merged into `VerificationSection` |
| `page.tsx` | Updated layout to use new header structure and components |

### Styling Rules

- All existing tokens preserved: `rounded-xl`, `border-zinc-800`, `text-zinc-400`, zinc palette
- No gradients, no new colors, no visual effects
- Same `max-w-2xl` page width
- Recharts themed to match: no grid lines, zinc fills, transparent background

### Dependencies

- `recharts` — bar chart rendering

### Voting Method Adaptation

- Single/Approval: X-axis label "Votes"
- Ranked/Score: X-axis label "Score"
- Ranked: footer note about weights (existing behavior preserved)
