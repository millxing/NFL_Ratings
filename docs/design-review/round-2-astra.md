# Round 2 independent review — Astra

Reviewed 2026-11-07. Application: `NFLPowerRatings-v3.html?review=2b`. Read-only application review; only this report written. No subagents. Read `round-1-astra.md` and `round-2-changes.md` before inspection. Implementation claims and parent checks were treated as candidates for verification, not independent evidence.

The interface is materially more usable and coherent. All ten prior Astra issues are fixed in the states tested. The compact title, restrained amber accent, readable table typography, and mobile control layout now support the actual work. One newly identified weakness prevents a higher data-readability score: column labels disappear while traversing the long ratings table. No large hero title or subtitle is needed or recommended.

## Scores

Same exact categories, 1–10, one decimal. A score of 9+ means professional developer level. Overall is a separate holistic judgment.

| Category | Score |
|---|---:|
| visual hierarchy | 8.8 |
| typography | 8.7 |
| color and contrast | 9.0 |
| layout and spacing | 8.7 |
| table/data readability | 8.3 |
| controls and interaction feedback | 9.0 |
| navigation and workflow | 8.6 |
| responsive design | 8.7 |
| accessibility | 8.5 |
| overall polish | 8.7 |

**Overall score: 8.7/10.**

Contrast and interaction feedback reach professional quality in the inspected states. The broader interface still has room to improve long-table orientation. Accessibility scoring reflects verified keyboard and DOM behavior, not a complete screen-reader or WCAG audit.

## Independent evidence and task checks

Opened all three supplied PNGs with `view_image`:

- Desktop: `/Users/robschoen/.t3/userdata/browser-artifacts/browser-screenshot-localhost-mw6j5zs3-4ded08fc.png`.
- Mobile: `/Users/robschoen/.t3/userdata/browser-artifacts/browser-screenshot-localhost-mw6j5zpz-7cadf89e.png`.
- Matchup: `/Users/robschoen/.t3/userdata/browser-artifacts/browser-screenshot-localhost-mw6j5e75-7651b531.png`.

Called `preview_status` first, then opened my own tab with `reuseExistingTab:false`. Used its returned tab ID throughout and closed it after testing. Inspected live screenshots as well as DOM state at desktop 1280×800 and mobile 390×844. Initial state already contained persisted 2025 results; no clean first-visit claim is made.

| Task | Independently observed result |
|---|---|
| Calculate 2025 weeks 1–18 | Clicked Calculate: exactly 32 rows, 272 games, home-field adjustment 2.16. Seattle +12.8 and Jets −12.4 are the extremes. Recalculated successfully again after changing the range. |
| Rank sorting | Actual Enter produced ascending, 1 first/32 last; actual Space produced descending, 32 first/1 last. |
| Team sorting | Actual Enter produced Washington→Arizona, descending; Space produced Arizona→Washington, ascending. New-column pointer activation initially chooses ascending, corroborated by the implementation. |
| Rating sorting | Enter produced −12.4→+12.8, ascending; Space produced +12.8→−12.4, descending. |
| Record sorting | Independently exercised Wins, Losses, and Ties, each with actual Enter and Space. Wins 3→14 / 14→3; losses 3→14 / 14→3; ties 0→1 / 1→0. Inspected first/last rows and direction after each action; did not separately assert every intermediate pair. |
| Sort semantics and focus | Every tested keyboard action retained focus on its native header button, matched `aria-sort` to ordering, and produced `:focus-visible` with a 2px amber outline. Actual Tab after Calculate reached the overflow region, then Rank. Other headers have native buttons; inactive indicators are neutral ↕ and active arrow matches direction. |
| Stale feedback | End week 18→17 hid results and displayed “Selection changed. Calculate to update ratings.” Subsequent filter change replaced the prior insufficient-data error with this current status. |
| Invalid range | With end 17, selecting start 18 adjusted end to 18 and showed “End week adjusted to Week 18. Choose a wider range if more games are needed.” End options 1–17 were disabled. Calculate then accurately reported only 16 games and asked for more weeks. Did not force disabled options through script. |
| SEA/NE neutral | Seattle by 7.3 points. |
| SEA/NE Seattle home | Seattle by 9.4 points. |
| SEA/NE New England home | Seattle by 5.1 points. Venue options name the actual teams. These rounded values are consistent with the displayed home adjustment. |
| Same team | SEA/SEA showed “Choose two different teams.” Comparison body contained zero rows. |
| Actual reload | Called `location.reload()` after setting SEA/NE/New England home. After load, SEA, NE, venue `b`, Seattle by 5.1, 32 rating rows, and Ties descending were restored. This establishes nondefault team and venue persistence. |
| Source details | Opened the actual source disclosure. It identifies nflverse/nfldata on GitHub fallback, 7,398 completed games, says 2026 Week 9 may be incomplete, and explains that Updated means app load time. Refresh and Import are available. Refresh was not invoked. |
| Import cancel | Confirmed an actual pending `.csv` chooser in `preview_status`, then canceled via upload with an empty path list. Body text, body height, and complete ratings tbody HTML were identical before/after cancellation. No network-error panel appeared. No file selected and no data overwritten. An earlier attempt did not open a chooser and is not counted as evidence. |
| Desktop scrolling | All ten columns fit at 1280px. Actual document scroll reached lower ranks. Table is now in page flow rather than a short vertical scroller. At scrollY 900 the header bottom was −513.5px, confirming the new orientation issue A-11. |
| Mobile controls | At 390px, Season occupies its own row, weeks remain a readable pair, Calculate is full width, and matchup team/venue selectors are stacked with full names visible. |
| Mobile primary data | Initial ratings view shows rank, full team name, and primary rating together. No document horizontal overflow: document width 375 within a 390px viewport with scrollbar. Table viewport 341px and content 790px. |
| Mobile horizontal scrolling | Successful actual locator-targeted scroll reached ratings scrollLeft 449. Team cell remained visible at x=17 with width about 183px, and rightmost Pt Diff/SOS were readable. Live screenshot confirmed this. Matchup horizontal scroll independently reached 434px. Earlier selector-targeted scroll attempts did not move the container; only successful locator-targeted actions count. |
| Zero formatting | Atlanta movement and SOS both display 0.0; Chicago movement displays 0.0. Shared formatter/source inspection supports consistent normalized zero in matchup too. |
| Typography/contrast | Live computed styles: mobile table labels 13px, body 14px. Secondary text is rgb(175,189,199) against row rgb(24,32,38), approximately 8.6:1; markedly better than the prior small-text contrast failure. Body/table use Source Sans 3, while compact app title retains Oswald. |

Numerical model tests were reported passing by the parent and were not rerun. This review checked visible counts, sorting endpoints, state transitions, and matchup consistency, not an independently implemented rating model. CSV parsing/replacement, remote refresh, full screen-reader operation, all possible team pairs, zoom, other browsers, and physical touch devices remain untested. No data source files or application code were modified.

## Retained issue register

All old Astra IDs are retained. FIXED applies to the original reported defect, not a claim that every adjacent interaction has been exhaustively audited.

| ID | Disposition | Evidence |
|---|---|---|
| A-01 — Sorting is unavailable through keyboard controls | **FIXED** | Native buttons receive actual Tab focus; Enter and Space sorted Rank, Team, Rating, Wins, Losses, and Ties both ways. Matching aria-sort and visible 2px focus outline verified after each action. |
| A-02 — Mobile filters conceal selected values | **FIXED** | Supplied and live 390px views show full Season/week selections; matchup controls stack and display full Seattle/New England names and venue. |
| A-03 — Import action incorrectly declares a network failure | **FIXED** | Confirmed actual CSV chooser and cancellation, with identical text/layout height/ratings HTML and no erroneous failure panel. |
| A-04 — Mobile table loses team identity while accessing ratings | **FIXED** | Primary Rating is third and initially visible. At maximum ratings horizontal offset 449, Seattle's full team cell stays at x=17 while rightmost metrics are visible. Body is now 14px. |
| A-05 — Invalid week selections are changed silently | **FIXED** | Start 18 adjusts end 17→18 with explicit explanation. End weeks 1–17 are disabled. Insufficient-game feedback gives a concrete next action. |
| A-06 — Clearing stale results leaves an unexplained blank workspace | **FIXED** | Range changes replace stale/error status with “Selection changed. Calculate to update ratings.” Compact initial instruction exists; no hero added. Fresh-storage first visit was not independently tested. |
| A-07 — Matchup context resets on reload | **FIXED** | Actual reload restored nondefault SEA/NE/New England home and the same 5.1-point output, plus 32 ratings and prior sort. |
| A-08 — Secondary text and display typography reduce data readability | **FIXED** | Muted row text is approximately 8.6:1; readable Source Sans 3 labels at 13px and body at 14px replace the prior 10px mobile labels. Compact display type is confined to branding. |
| A-09 — Sort affordances overstate interactivity and direction | **FIXED** | Only active column has directional arrow, inactive sortable columns use ↕, and delta headers lack sorting buttons/pointer styling. Rank direction and alphabetical initial team sort are corrected. |
| A-10 — Numeric formatting exposes negative zero | **FIXED** | Atlanta movement/SOS and Chicago movement now read 0.0. Source uses normalized signed formatting in ratings and matchup. |

**Prior issue totals: 10 FIXED, 0 STILL OPEN.**

## New issue

### A-11 — Column headings disappear during vertical table traversal

- **Status:** NEW
- **Severity:** Medium
- **Evidence:** At desktop 1280×800, scrolling the document to scrollY 900 shows roughly ranks 13–30 without any visible column labels. The header bottom is −513.5px. Live screenshot shows several similarly formatted numeric columns (rating, movement, point differential, SOS) with no persistent labels. The table is about 1456px high. The same full-height structure exists on mobile, where combining vertical and horizontal scrolling makes orientation more important.
- **Why this is new:** This round replaced the short internal vertical table viewport with page-flow rows. The newly tested long document traversal exposes a distinct vertical-label problem. A-04 remains fixed: horizontal team identity is successfully retained.
- **Concrete fix:** Keep a compact column-header row visible while the ratings table crosses the viewport. Account for the horizontal overflow ancestor: simply applying sticky top to the existing header may stick relative to that container rather than the document. Use a properly synchronized sticky header or restructure scrolling so sticky headers actually track page scrolling. Maintain column alignment, horizontal offset, keyboard buttons, and the sticky Team intersection.
- **Acceptance check:** At both 1280px and 390px, scroll to ranks 16 and 32; metric names should remain visible and align with values. Scroll horizontally while midway down the table; labels and team identity must remain readable without obscuring data or keyboard focus.

Address A-11 while preserving the compact layout. No other new functional regression was established in the tested flows.
