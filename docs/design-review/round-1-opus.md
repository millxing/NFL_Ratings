# Design Review — Round 1 — Reviewer: opus

App: `NFLPowerRatings-v3.html` @ http://localhost:8765/NFLPowerRatings-v3.html
Method: supplied screenshots (initial, calculated) + own browser tab (1280×800, 390×844), DOM/a11y inspection via scripted interaction. Read-only.

## Scores (1–10)

| Category | Score |
|---|---|
| Visual hierarchy | 6.8 |
| Typography | 7.0 |
| Color and contrast | 7.0 |
| Layout and spacing | 6.5 |
| Table/data readability | 6.3 |
| Controls and interaction feedback | 5.8 |
| Navigation and workflow | 6.5 |
| Responsive design | 5.5 |
| Accessibility | 4.5 |
| Overall polish | 6.2 |

**Overall: 6.1 / 10** (not yet professional-developer level; main gaps are sortable-header accessibility, stale-state feedback, mobile table).

## Test results

| Task | Result |
|---|---|
| Calculate 2025 wk 1–18 | PASS. 32 rows in ratings table, 272 games, HFA 2.16, "calculated successfully" status. |
| Sort Team | Works both directions, but first click sorts Z→A (descending) — counterintuitive for text. |
| Sort Wins/Losses/Ties (record) | Works both directions (14→3, 3→14). |
| Sort Rating | Works both directions (+12.8 → −12.4 and reverse). |
| Change weeks → stale invalidation | Table hidden immediately on change (good), but no explanation shown and old "Power ratings calculated successfully!" message stays. Reverting to the original range does not restore results. |
| Invalid range (start 12 > end 10) | End auto-clamped to 12 silently; calc gives "Not enough games found (14). Need at least 32…" error banner. No inline guidance before calculate. |
| Matchup SEA vs NE | Neutral: SEA by 7.3; SEA home: 9.4; NE home: 5.1. Consistent with HFA ≈2.1. PASS. |
| Identical teams | "Choose two different teams." shown, but comparison table still renders duplicate SEA rows. |
| Return to ratings | Table intact, 32 rows. PASS. |
| Reload | Season/weeks (2025, 1–18), ratings and sort persisted. Matchup team/venue selections NOT persisted (reset to ARI/neutral). |
| Source details / import | Disclosure opens: source, game count, incompleteness note, Refresh data + Import CSV buttons. Import not exercised (no overwrite). |
| 390 px | No page h-scroll (docW 390). Table scrolls horizontally inside box (760 px); Rating column off-screen. Season select truncated "2025 Se…". |
| 1280 px | Fine, but table sits in fixed-height inner scroll box. |
| Keyboard | Tab order: nav links, 3 selects, Calculate, Source summary, Refresh, Import. Sort headers NOT reachable (tabIndex −1, no button). Scroll container not focusable. |
| Not tested | Actual CSV import, Refresh data network behavior, screen reader output, dark/light switching, zoom 200%. |

## Issues

| ID | Severity | Issue / Evidence | Recommended fix | Status |
|---|---|---|---|---|
| O-01 | High | Sortable headers not keyboard-operable: `th` tabIndex −1, no inner `<button>`, no `aria-sort` on any header. | Wrap header label in `<button>`; set `aria-sort="ascending/descending/none"` on `th`; visible focus ring. | NEW |
| O-02 | High | Stale invalidation silent/contradictory: changing weeks hides table while "calculated successfully!" persists. | Replace status with "Range changed — recalculate to update" (or keep table dimmed with stale banner); clear success message. | NEW |
| O-03 | Medium | Every sortable header shows ▼ arrow; active sort only distinguished by color (yellow). Ambiguous, color-only. | Show arrow only on active column (neutral ↕ glyph on others, low opacity). | NEW |
| O-04 | Medium | Team column first click sorts Z→A. | Text columns default ascending; numeric default descending. | NEW |
| O-05 | Medium | Mobile 390: Rating (primary metric) off-screen; no sticky Rank/Team column while scrolling horizontally. | Sticky first two columns, or reorder so Rating follows Team on narrow widths; hide Δ columns by default. | NEW |
| O-06 | Medium | Nested scroll: table in fixed-height inner scroll box (237 px tall at 390, ~370 at 1280) inside scrolling page; double scrollbars, white scrollbar track on dark theme (visible in screenshots). | Let table flow at page height with sticky `thead`; style scrollbar dark. | NEW |
| O-07 | Medium | Scroll container not focusable/labelled; keyboard users cannot scroll table horizontally. | `tabindex="0" role="region" aria-label="Power ratings table"` on wrapper. | NEW |
| O-08 | Medium | Invalid range auto-clamps end week silently; then 1-week calc errors with technical message. | Disable invalid end-week options or show inline hint; message: "Pick a range with at least ~2 weeks (32 games)". | NEW |
| O-09 | Low | Mobile: Season select truncated "2025 Se…". | Stack controls (season full width, weeks in 2 cols) or use "2025" labels. | NEW |
| O-10 | Low | Identical-teams state still renders duplicate comparison rows. | Hide table when A = B, or prevent selecting same team. | NEW |
| O-11 | Low | Venue options "Team A home / Team B home" are generic. | Use team names dynamically ("Seahawks home"). | NEW |
| O-12 | Low | Matchup table: Rank header right-aligned, values left-aligned; empty leading spacing. | Align header/value consistently. | NEW |
| O-13 | Low | Matchup selections not persisted across reload while other prefs are. | Persist team A/B/venue in preferences. | NEW |
| O-14 | Low | Existing title block is heavy (large all-caps "NFL POWER RATINGS V3" + subtitle) and consumes ~90 px above controls, worse on mobile. User forbids large hero titles — do not enlarge; consider compacting to a slim app bar. | Reduce to compact header row (title left, nav right). | NEW |
| O-15 | Low | Prediction text "Choose two different teams." / "X by N points" uses large heading size even for validation message. | Style validation as muted note; reserve large type for actual result. | NEW |
| O-16 | Low | Small all-caps header labels (~11 px, gray on dark) and tiny team abbreviation badges are low legibility. | ≥12 px, raise contrast to ≥4.5:1. | NEW |
| O-17 | Low | Footer "Week 9 may be incomplete" refers to 2026 while viewing 2025; context mismatch. | Qualify with season or show only when viewing current season. | NEW |

## Positives
- Correct, fast calculation; matchup math consistent with HFA.
- Native labelled selects, `nav` with `aria-current="page"`, status live region.
- Consistent dark palette; green/red signed values readable; source disclosure is concise.
