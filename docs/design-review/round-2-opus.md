# Design Review — Round 2 — Reviewer: opus

App: `NFLPowerRatings-v3.html` @ http://localhost:8765/NFLPowerRatings-v3.html?review=2b
Method: the three supplied screenshots (desktop 1280, mobile 390 ratings, mobile matchup) plus my own preview tab (opened new, closed when done), at 1280×800 and 390×844. I used real key presses (Enter, Space) on the sort buttons and DOM checks. Read-only: no CSV was imported. The file chooser was opened and then cancelled.

## Scores (1–10)

| Category | R1 | R2 |
|---|---|---|
| Visual hierarchy | 6.8 | 8.2 |
| Typography | 7.0 | 8.2 |
| Color and contrast | 7.0 | 8.1 |
| Layout and spacing | 6.5 | 8.0 |
| Table/data readability | 6.3 | 7.8 |
| Controls and interaction feedback | 5.8 | 8.0 |
| Navigation and workflow | 6.5 | 8.3 |
| Responsive design | 5.5 | 7.8 |
| Accessibility | 4.5 | 7.7 |
| Overall polish | 6.2 | 7.9 |

**Overall: 8.0 / 10.** This is a large improvement, but it is not yet at the 9+ professional level. The main remaining gaps are that table headers scroll out of view, a hidden live region keeps stale text, and some small inconsistencies around the edges.

## Test results

| Task | Result |
|---|---|
| Calculate 2025 wk 1–18 | PASS. 32 ratings rows and "272 games · 2025, W1–18". |
| Sort Rank | PASS. Ascending puts SEA (1) first; descending puts NYJ (32) first. `aria-sort` updates. |
| Sort Team | PASS. Enter key changes sort to ascending (Arizona first), `aria-sort="ascending"`, ▲ shown. Space key also sorts ascending. Focus ring is visible (solid #E8B568) and focus stays on the button. |
| Sort Rating | PASS. Descending +12.8 SEA, ascending −12.4 NYJ. |
| Sort Wins (record) | PASS. Descending 14 (SEA), ascending 3 (ARI). Losses and Ties also use button headers. |
| Range change → stale | PASS. Table hides and "Selection changed. Calculate to update ratings." replaces the old message. |
| Invalid range | PARTIAL. Start 12 disables end weeks 1–11, and an end of 10 changes to 12. The visible message is only the generic "Selection changed…". I did not see a message explaining the change. Calculating 12–12 gives a clear message: "Only 14 completed games… at least 32 games are needed." |
| Matchup SEA/NE | PASS. Neutral 7.3, Seattle home 9.4, New England home 5.1. Venue labels use team names. |
| Same team | PASS. Shows "Choose two different teams." and 0 comparison rows. |
| Reload | PASS. SEA / NE / venue=NE home, 2025 1–18, 32 rows and Team-ascending sort are all restored. |
| Import cancel | PASS. Chooser opened (accept .csv) and I cancelled it. Table (32 rows), status and source are unchanged, with no error panel. Source details show source, fallback, game count, season-qualified caveat, and Refresh/Import. |
| 390 px | PASS with caveat. Controls are stacked and Season is not truncated. Rating is the 3rd column and visible. The scroll hint is shown. Team column is sticky (it stays at x=17 when scrolled, with an opaque background). Rank scrolls away. The matchup table at 390 also scrolls horizontally for only 2 rows (supplied screenshot). |
| 1280 px | PASS. No horizontal overflow in the table. The table flows with the page. |
| Not tested | Real CSV import, Refresh network behavior, screen reader speech, 200% zoom, light theme. |

## Round-1 issue dispositions

| ID | Status | Evidence |
|---|---|---|
| O-01 | FIXED | `<button>` in each sortable `th`, `aria-sort` set, and Enter/Space verified. |
| O-02 | FIXED | Stale message replaces the success message, and the table is hidden. |
| O-03 | FIXED | ▲/▼ appears only on the active column. Other columns show a muted ↕. |
| O-04 | FIXED | Team defaults to A→Z. |
| O-05 | FIXED | Rating is 3rd and visible at 390, and Team is sticky. |
| O-06 | PARTIALLY FIXED (STILL OPEN for sticky header) | Inner scroll box is gone and the scrollbar is dark. However, `thead` is `position: static`. At 1280 the header ends up at top −560 px after scrolling, so the column names are lost for most rows (see O-18). |
| O-07 | FIXED | Region has `tabindex=0`, `role=region` and an aria-label. |
| O-08 | MOSTLY FIXED | Invalid end weeks are disabled and the insufficient-games message is clear. The automatic end-week change gets no specific explanation (see O-20). |
| O-09 | FIXED | Mobile season select is full width and shows the full text. |
| O-10 | FIXED | 0 rows when the two teams are the same. |
| O-11 | FIXED | "Seattle Seahawks home / New England Patriots home". |
| O-12 | FIXED | Matchup Rank header and values are both right-aligned (screenshot). |
| O-13 | FIXED | Matchup survives a reload. |
| O-14 | FIXED | Slim 24 px title in one row with the nav. No hero or subtitle. |
| O-15 | FIXED | Validation text is restrained. The result card is reserved for predictions. |
| O-16 | FIXED | Headers are 13 px and abbreviations 12 px, with improved contrast. |
| O-17 | FIXED | "2026 Week 9 may be incomplete" now names the season. |

## New issues

| ID | Severity | Issue / Evidence | Fix |
|---|---|---|---|
| O-18 | Medium | Table header is not sticky. With the table flowing on the page (32 rows, about 1450 px), column names disappear while reading lower rows on both desktop and mobile. | `thead th { position: sticky; top: 0; z-index: 2; background: var(--surface) }`. The Team header cell needs a higher z-index at the corner. Make sure no ancestor uses `overflow` in a way that breaks vertical stickiness. The usual approach is `overflow-x: auto` on the wrapper plus a sticky header in a separate cloned header row, or `overflow: clip` on the y axis. |
| O-19 | Low | The hidden `.status-message` (an aria-live region) keeps "Performing OLS regression..." with the class `--loading` after the calculation succeeds. The stale message also reuses `--loading`. Assistive tech or later reads can pick up stale loading text. | Clear the text and set a success or neutral state when finished. Use a separate `--stale` modifier. |
| O-20 | Low | When the start week passes the end week, the end week moves on its own (10→12), but the only message is the generic "Selection changed". | Add a short note, e.g. "End week moved to 12 to match start week." |
| O-21 | Low | "Data loaded successfully! 7,398 games available." stays as a full-width banner above the results after calculating (desktop screenshot). It adds noise and repeats the source details. | Hide it after the first calculation, or turn it into a muted line in the status bar. |
| O-22 | Low | On mobile, Rank scrolls out of view when the table is scrolled horizontally. Only Team is sticky, so the rank context is lost. The matchup table at 390 scrolls horizontally just to show a 2-row comparison. | Make Rank and Team sticky together (or put the rank inside the team cell on narrow screens). For the 2-team matchup, use a stacked or transposed layout on mobile. |
| O-23 | Low | Δ Rating and Δ Rank are the only metric headers without sort buttons, which is inconsistent. Both tables use the same region label "Team statistics, scroll for more columns", and that label is also used at 1280 where nothing overflows. | Make the Δ columns sortable. Give each table its own label and drop "scroll…" when there is no overflow. |

## Concrete next steps to reach 9+
1. Sticky table header (O-18). This is the biggest readability win left.
2. Clean up the status/live region states (O-19, O-21) so there is one current message at a time.
3. Mobile sticky Rank+Team and a non-scrolling matchup comparison (O-22).
4. Smaller consistency fixes (O-20, O-23).
