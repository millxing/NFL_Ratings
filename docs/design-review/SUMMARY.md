# Design review summary

Completed three rounds on NFLPowerRatings-v3.html. Both evaluators used standard service: Opus 5.5 Light and Astra Medium. Original and v2 app files were not changed. Baseline retained in baseline.html.

| Overall | Round 1 | Round 2 | Round 3 |
|---|---:|---:|---:|
| Opus | 6.1 | 8.0 | 8.4 |
| Astra | 6.4 | 8.7 | 8.9 |

All final categories meet 8.0. Astra meets 8.5 overall; Opus misses by 0.1. Stopped at the requested three-round limit.

## Running issue register

| ID | Round 1 | Round 2 | Round 3 |
|---|---|---|---|
| O-01 | NEW | FIXED | FIXED |
| O-02 | NEW | FIXED | FIXED |
| O-03 | NEW | FIXED | FIXED |
| O-04 | NEW | FIXED | FIXED |
| O-05 | NEW | FIXED | FIXED |
| O-06 | NEW | STILL OPEN (partial) | FIXED |
| O-07 | NEW | FIXED | FIXED |
| O-08 | NEW | STILL OPEN (partial) | FIXED |
| O-09 | NEW | FIXED | FIXED |
| O-10 | NEW | FIXED | FIXED |
| O-11 | NEW | FIXED | FIXED |
| O-12 | NEW | FIXED | FIXED |
| O-13 | NEW | FIXED | FIXED |
| O-14 | NEW | FIXED | FIXED |
| O-15 | NEW | FIXED | FIXED |
| O-16 | NEW | FIXED | FIXED |
| O-17 | NEW | FIXED | FIXED |
| O-18 | — | NEW | FIXED |
| O-19 | — | NEW | FIXED |
| O-20 | — | NEW | FIXED |
| O-21 | — | NEW | FIXED |
| O-22 | — | NEW | FIXED |
| O-23 | — | NEW | FIXED |
| O-24 | — | — | NEW / OPEN |
| O-25 | — | — | NEW / OPEN |
| A-01 | NEW | FIXED | FIXED |
| A-02 | NEW | FIXED | FIXED |
| A-03 | NEW | FIXED | FIXED |
| A-04 | NEW | FIXED | FIXED |
| A-05 | NEW | FIXED | FIXED |
| A-06 | NEW | FIXED | FIXED |
| A-07 | NEW | FIXED | FIXED |
| A-08 | NEW | FIXED | FIXED |
| A-09 | NEW | FIXED | FIXED |
| A-10 | NEW | FIXED | FIXED |
| A-11 | — | NEW | FIXED |

## Remaining issues

- O-24 (low–medium): pinned Rank and Team consume roughly 72% of the mobile ratings viewport. Secondary metrics require substantial horizontal panning. Astra considered this a tradeoff rather than a new defect.
- O-25 (low): floating and original headers expose duplicate sorting controls in keyboard/accessibility navigation.

No changes were made after the final evaluations; final scores describe the delivered app.

## Verification and limits

Existing numerical model tests pass. Parent and independent browser checks cover calculations, all column sorts, keyboard controls, mobile/desktop layouts, header alignment, week validation, stale feedback, matchup venues, persistence, and import cancellation. CSS was consolidated rather than layered between rounds.

Real CSV replacement, failed-network refresh, full screen-reader speech, 200% zoom, and physical touch devices were not comprehensively tested. Original primary source certificate error remains; the GitHub fallback succeeds.

Each round-N-opus.md and round-N-astra.md contains specific findings, individual category scores, evidence, and limitations. round-2-changes.md and round-3-changes.md document implementation and pre-review regression checks.
