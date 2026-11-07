# Round 2 implementation and regression checks

Baseline reports are the issue register: round-1-opus.md (O-01–O-17), round-1-astra.md (A-01–A-10). Reviewers must retain every ID and mark FIXED / STILL OPEN; only genuinely new defects receive new IDs.

## Implemented for verification
- O-01/O-03/O-04, A-01/A-09: native sorting buttons, aria-sort, active arrow, rank direction works, alphabetical initial order.
- O-02/O-08, A-05/A-06: stale status, initial instruction, disabled invalid end weeks, adjustment explanation, insufficient-game guidance.
- O-05/O-06/O-07/O-09, A-02/A-04: Rating third, sticky team, page-flow table, dark scrollbar, focusable labelled overflow region, stacked mobile controls.
- O-10/O-11/O-12/O-13/O-15, A-07: same-team stats hidden; actual team venue labels; alignment; matchup persistence; restrained validation.
- O-14/O-16, A-08: slim app bar, subdued accent, legible body-font labels and contrasting secondary text.
- O-17: season-qualified source caveat.
- A-03: intentional import opens chooser without showing network-failure panel.
- A-10: rounded signed zero normalized in both tables.
- Added compact metric definitions and visible mobile scroll instruction.

## Checks performed before evaluator review
- Existing node tests/ratings-model.cjs passes: exact coefficients, neutral-site isolation, insufficient/singular schedules.
- Browser: 2025 weeks 1–18 -> 32 rows, 272 games, HFA 2.16.
- Rank both ways: 1 and 32 first. Team starts Arizona. Rating keyboard Enter toggles to ascending, -12.4 first; aria-sort matches.
- Range change removes stale results and replaces prior feedback. Recalculation succeeds.
- SEA vs NE neutral 7.3, Seattle home 9.4. Same-team state has zero comparison rows.
- Full navigation reload restores SEA/NE/Seattle home and 32 ratings.
- 390px ratings and matchup inspected; primary rating visible and no document horizontal overflow.
- One replacement stylesheet, not stacked override layers. Responsive overrides are scoped to breakpoint rules.

Review status: implemented changes are candidates, not assumed reviewer-verified fixes. Data-source certificate failure remains an external baseline condition; fallback works.
