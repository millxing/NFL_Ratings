# Design Review — Round 3 (final) — Reviewer: opus

App: `NFLPowerRatings-v3.html` @ http://localhost:8765/NFLPowerRatings-v3.html?review=3final
Method: I looked at the four supplied screenshots (desktop 1280, mobile ratings, mobile matchup, and mobile ratings scrolled both ways). I also used my own preview tab, which I opened new and closed at the end. I tested at 1280×800 and 390×844, using real pointer clicks and Enter/Space key presses on the floating sort buttons, plus DOM measurements. Read-only: no CSV was imported and no app files were edited.

## Scores (1–10)

| Category | R1 | R2 | R3 |
|---|---|---|---|
| Visual hierarchy | 6.8 | 8.2 | 8.5 |
| Typography | 7.0 | 8.2 | 8.4 |
| Color and contrast | 7.0 | 8.1 | 8.5 |
| Layout and spacing | 6.5 | 8.0 | 8.3 |
| Table/data readability | 6.3 | 7.8 | 8.4 |
| Controls and interaction feedback | 5.8 | 8.0 | 8.7 |
| Navigation and workflow | 6.5 | 8.3 | 8.6 |
| Responsive design | 5.5 | 7.8 | 8.2 |
| Accessibility | 4.5 | 7.7 | 8.1 |
| Overall polish | 6.2 | 7.9 | 8.4 |

**Overall: 8.4 / 10.** Every Round-2 issue is fixed and verified, with no regressions. The app is solid and consistent. It is just under the 8.5 goal, and below the 9+ level, because of two smaller issues. On mobile, the sticky columns take up most of the width (O-24). The floating header also duplicates its controls for assistive technology (O-25). All categories are at 8 or above.

## Test results

| Task | Result |
|---|---|
| Calculate 2025 wk 1–18 | PASS. 32 rows, "272 games · 2025, W1–18". After success the status text is empty and has no modifier class. The "Data loaded" banner is gone. |
| Pointer sort (floating header) | PASS. At scrollY 900, clicking the floating Δ Rank button sorts descending (+2…−2). The page did not jump (scrollY stayed 900) and the floating label shows ▼. |
| Keyboard sort (floating header) | PASS. Enter on the floating Rating button sorts descending (SEA +12.8 first). Space then sorts ascending (−12.4 first). `aria-sort` on the real `th` updates and focus stays on the button. |
| Header alignment, desktop | PASS. All 10 floating column left edges match the real header to the pixel. The header is pinned at top 0. |
| Header alignment, 390 (after 800 px down / 250 px across) | PASS. All 10 edges match. Rank (17–89) and Team (89–265) stay sticky with no overlap and an opaque background. The document is 375 wide, so the page itself has no horizontal scroll. |
| Floating header hides | PASS. It is hidden at the top of the page (original header visible) and on the Matchup view, at both desktop and mobile widths. At the page bottom the table is still on screen, so it stays visible, which is correct. |
| Stale selection | PASS. Changing End to 10 hides the table and shows "Selection changed. Calculate to update ratings." with the `--stale` class. |
| Invalid week adjust | PASS. Start 12 moves End 10→12, and the status reads "End week moved to 12 to match start week. Selection changed…". End weeks 1–11 are disabled. |
| Reload | PASS. 2025/1/18, SEA/NE/neutral, 32 rows, 272 games, and the Rating-ascending sort are restored. No status text. |
| Matchup SEA/NE | PASS. Neutral 7.3, Seattle Seahawks home 9.4, New England Patriots home 5.1. |
| Same team | PASS. "Choose two different teams." and no comparison table is shown. |
| Mobile comparison | PASS. A 3-column Metric/SEA/NE table with `scope=col`/`scope=row` and scrollWidth 343 = container 343, so there is no horizontal scroll. |
| Import chooser cancel | PASS with caveat. The click on `#import-data` (accept `.csv`) worked. The harness did not show a native chooser to cancel. A dispatched `cancel` + empty `change` left the table (same content), the "Updated…" line and the status unchanged, with no error. |
| Contrast spot checks | PASS. Body 13.9:1, positive 7.5:1, negative 9.2:1, abbreviations and the ↕ icon 8.2:1 (icon is only 10 px). |

## Issue dispositions

| ID | Status | Evidence |
|---|---|---|
| O-01 | FIXED | Button sort headers, Enter/Space work again (now also on the floating header). |
| O-02 | FIXED | Stale state hides the table, with a dedicated `--stale` class. |
| O-03 | FIXED | Only the active column shows ▲/▼. |
| O-04 | FIXED | No regression. |
| O-05 | FIXED | Rating is visible at 390. |
| O-06 | FIXED | The floating header replaces the missing sticky header. Verified on desktop and mobile. |
| O-07 | FIXED | Scroll region is focusable and labelled. |
| O-08 | FIXED | Disabled earlier weeks plus a message naming the adjustment. |
| O-09 | FIXED | No regression. |
| O-10 | FIXED | Same-team state verified. |
| O-11 | FIXED | Venue option text uses team names. |
| O-12 | FIXED | No regression. |
| O-13 | FIXED | Matchup restored after reload. |
| O-14 | FIXED | Compact title bar, no hero or subtitle. |
| O-15 | FIXED | No regression. |
| O-16 | FIXED | Contrast measured as above. |
| O-17 | FIXED | No regression. |
| O-18 | FIXED | Floating header is aligned to 0 px and operable, and hides outside the table. |
| O-19 | FIXED | Success leaves `class="status-message"` with empty text. |
| O-20 | FIXED | "End week moved to 12 to match start week." |
| O-21 | FIXED | No "Data loaded…" banner after calculating or reloading. |
| O-22 | FIXED | Rank and Team are sticky. The mobile matchup is a semantic table with no overflow. |
| O-23 | FIXED | Δ Rating and Δ Rank sort correctly (Δ Rank +2…−2 verified). Region labels are specific. |

## New issues

| ID | Severity | Issue / Evidence | Fix |
|---|---|---|---|
| O-24 | Low–Medium | At 390 the sticky Rank+Team block covers about 248 of 343 px (72%). Only about 1.3 data columns show at a time. Partly scrolled columns show slivers next to the sticky edge: in the supplied scrolled screenshot you can see a stray "↕" fragment in the header and cut-off "0"/"1" digits beside Team. Comparing columns on mobile means a lot of panning. | Narrow the mobile Rank column (about 36 px), shorten team names (for example, use the abbreviation or the nickname only), or cap Team at about 120 px with ellipsis. Add a subtle shadow or fade on the sticky edge so clipped columns read as clipped. |
| O-25 | Low | The floating header is a second copy of the 10 sort buttons. Both copies are in the tab order (tabIndex 0) and in the accessibility tree (no `aria-hidden` or `inert`), so screen readers meet the column headers twice. | While the floating header is shown, mark it as the only live copy (make the original `inert`), or forward focus. Or keep the floating copy `aria-hidden` and send its clicks to the real buttons while keeping it keyboard-reachable through the real header. |

## Untested / limitations
- No native file chooser appeared in the harness, so the cancel was simulated with events (no data was replaced).
- Not tested: real CSV import, Refresh network failure, screen reader speech, 200% zoom or text spacing, light theme, and real touch momentum scrolling.
