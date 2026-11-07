# Round 3 final independent review — Astra

Reviewed 2026-11-07. Application: `NFLPowerRatings-v3.html?review=3final`. Read `round-1-astra.md`, `round-2-astra.md`, and `round-3-changes.md`. Implementation notes were treated as claims to check. Only this report was written; no app edits, data imports/replacement, or subagents.

The remaining Astra issue is fixed. Persistent labels now support traversal of the ratings table, with synchronized horizontal positioning and operable sorting. Mobile matchup comparison is substantially easier to read as a metric-by-team table. The interface is compact, coherent, and suitable for repeated use. No hero title or subtitle is needed. No new defect was confirmed in the tested flows.

## Scores

Same categories, 1–10, one decimal; 9+ denotes professional developer level in that category. Overall is a separate holistic assessment, not a compliance certification or a score chosen to meet the requested threshold.

| Category | Score |
|---|---:|
| visual hierarchy | 8.8 |
| typography | 8.7 |
| color and contrast | 9.0 |
| layout and spacing | 8.7 |
| table/data readability | 8.9 |
| controls and interaction feedback | 9.0 |
| navigation and workflow | 8.8 |
| responsive design | 8.9 |
| accessibility | 8.6 |
| overall polish | 8.9 |

**Overall: 8.9/10.**

The long-table orientation problem is resolved. Strong contrast, restrained emphasis, explicit feedback, and readable mobile comparisons support the higher assessment. Narrow-screen ratings still require deliberate horizontal traversal through secondary metrics; at arbitrary offsets a neighboring column is partly clipped. That is an overflow tradeoff, not evidence that the fixed team-identity issue has returned. Accessibility remains below 9 because verified keyboard/DOM behavior is narrower evidence than a full assistive-technology evaluation.

## Inspection and task results

Opened all four supplied PNGs with the image tool:

- Desktop: `/Users/robschoen/.t3/userdata/browser-artifacts/browser-screenshot-localhost-mw6je08p-1f2c7cf7.png`.
- Mobile ratings: `/Users/robschoen/.t3/userdata/browser-artifacts/browser-screenshot-localhost-mw6jdqsq-5649131d.png`.
- Mobile matchup: `/Users/robschoen/.t3/userdata/browser-artifacts/browser-screenshot-localhost-mw6jdqdy-9ce71e6b.png`.
- Mobile vertical/horizontal traversal: `/Users/robschoen/.t3/userdata/browser-artifacts/browser-screenshot-localhost-mw6je02h-8539edda.png`.

Called `preview_status` first, opened a separate tab with `reuseExistingTab:false`, used only its returned tab ID, and closed it after testing. Live testing used 1280×800 and 390×844, plus a temporary 1280×300 viewport to make the footer reachable with the entire table above the viewport. Live image inspection supplemented DOM measurements and actual click, select, keyboard, scroll, chooser, and reload actions. Data was loaded and results restored before the first calculation. This was not a clean-storage first visit.

| Task | Independent result |
|---|---|
| Calculate 2025 weeks 1–18 | Actual Calculate produced 32 rows, 272 games, and home-field adjustment 2.16. Seattle +12.8 was first and Jets −12.4 last under ascending rank. Recalculation after range changes succeeded. |
| Pointer and keyboard sorting | Pointer-activated each of all ten original header buttons, then used actual Enter and Space. Read the entire displayed column sequence after both keyboard actions. Rank, Team, Rating, Wins, Losses, Ties, Δ Rating, Δ Rank, Pt Diff, and SOS were ordered correctly in both directions. |
| Movement sorting | Δ Rating asc −1.0→+1.0 and desc +1.0→−1.0; Δ Rank asc −2→+2 and desc +2→−2. All intermediate displayed values were monotonic. Missing-movement placement was not tested with a separate dataset. |
| Sort semantics and focus | Each original keyboard test retained focus on its button and `:focus-visible`, with matching `aria-sort`. Tab from the focused Calculate control reached the ratings region and then Rank. The focused button had a 2px amber outline. Only the active header had a directional indicator; inactive headers used neutral arrows. Movement arrows now correspond to real actions. |
| Floating header sorting | At desktop scrollY 850, clicked floating Δ Rating, then Enter and Space. Enter sorted ascending (Philadelphia −1.0 first, Washington +1.0 last); Space reversed it. Focus stayed on the floating button and both original/floating `aria-sort` states matched. |
| Desktop header alignment | At scrollY 850, all ten floating header x coordinates and widths matched the original columns exactly: 0px differences. Live image showed readable labels over ranks 14–30. At the bottom with disclosure content expanded, alignment remained exact and lower ranks were reachable. All columns fit at 1280px, so there was no desktop horizontal overflow to traverse. |
| Mobile vertical plus horizontal scrolling | At 390px and scrollY 850, actual region-targeted horizontal scroll reached 250px. All ten header position/width differences were 0px. Rank remained x=17–89 and Team x=89–264.59, with no overlap. Live image showed rank, full team names, and Δ Rating labels/values while midway down the table. |
| Mobile lower rows and maximum horizontal offset | Actual horizontal offset reached 457px, followed by document scroll to y=1273. Labels still aligned exactly; the screenshot showed ranks 20–32, sticky team identity, and readable SOS. Rank 32 was visible with the header still present. A partial neighboring Pt Diff column was clipped at this offset, as expected for horizontal overflow. |
| Header disappearance | Returning to document top hid the floating header. Matchup navigation hid it. With disclosure sections expanded and viewport 1280×300, scrolling below the table placed its bottom at −60.5px and the floating header became hidden. An immediate read during scrolling briefly preceded the scroll handler; the settled snapshot/read confirmed disappearance. |
| Stale feedback | End 18→10 showed “Selection changed. Calculate to update ratings.” Range changes removed the visible results. Rows remain in the DOM but the results section uses `display:none`; they are not presented as current results. |
| Invalid range adjustment | Selecting start 12 with end 10 changed end to 12 and said “End week moved to 12 to match start week. Selection changed. Calculate to update ratings.” End options 1–11 were disabled. No forced selection of disabled options. |
| Error replacement and successful clearing | Calculating week 18 alone reported only 16 completed games and requested at least 32. Changing start to 1 replaced the error with stale feedback. Once recalculation finished, status text was empty and its class was exactly `status-message`, with no loading/error/success/stale modifier. |
| SEA/NE neutral and home venues | Seattle by 7.3 neutral, 9.4 with Seattle home, 5.1 with New England home. Outputs are consistent with the 2.16 adjustment and rounding. Venue labels name the teams. |
| Same-team state | SEA/SEA said “Choose two different teams.” Desktop comparison had zero rows and mobile comparison was hidden. |
| Mobile comparison | All seven metrics and both team columns were present in the semantic three-column table. Document client/scroll widths were both 375px; comparison client/scroll widths were both 343px. No horizontal scrolling was needed. Full team selectors and venue remained readable. |
| Actual reload | Called `location.reload()` after SEA/NE/New England home. After loading finished, 2025, start 1, end 18, SEA, NE, venue `b`, 32 ratings, and Seattle by 5.1 were restored. Status remained empty, without restored initial loading feedback. |
| Import chooser cancel | Opened Source details and clicked Import CSV. `preview_status` confirmed an actual pending `.csv` chooser. Canceled using upload with `paths:[]`. Body text, body height, and complete ratings tbody HTML were identical before/after. No error appeared; no file selected or data replaced. |
| Source disclosure | Identified nflverse/nfldata GitHub fallback, 7,398 completed games, the incomplete 2026 Week 9 caveat, and the meaning of Updated time. Refresh was not invoked. |
| Readability and contrast | Current computed rank text is rgb(175,189,199) on rgb(24,32,38), approximately 8.6:1; body cells are 14px. Supplied and live images show clear table labels, restrained amber emphasis, signed positive/negative figures, and readable selected control values. No negative zero appeared in the complete numeric sort sequences; Atlanta movement/SOS and Chicago movement read 0.0. |

## Retained issue register

Every previous Astra issue ID is retained. FIXED describes the original defect in the tested states; it does not imply exhaustive coverage of adjacent behavior.

| ID | Disposition | Evidence |
|---|---|---|
| A-01 — Sorting is unavailable through keyboard controls | **FIXED** | All ten original columns sorted both ways with actual Enter/Space. Native buttons, visible focus, matching aria-sort, and Tab access verified. Floating Δ Rating also passed pointer/Enter/Space. |
| A-02 — Mobile filters conceal selected values | **FIXED** | 390px screenshots and live controls show a full-width Season field, paired weeks, and stacked matchup selectors with full team/venue values. |
| A-03 — Import action incorrectly declares a network failure | **FIXED** | Confirmed actual CSV chooser and canceled it. Identical page text, layout height, and ratings HTML; no false failure message. |
| A-04 — Mobile table loses team identity while accessing ratings | **FIXED** | Primary Rating remains near Team initially. At horizontal offsets 250 and 457, Rank/Team remain fixed and legible while secondary metrics scroll. Team starts exactly at Rank's right edge. |
| A-05 — Invalid week selections are changed silently | **FIXED** | Start 12 with end 10 explicitly announced the end-week move to 12; earlier end options disabled. |
| A-06 — Clearing stale results leaves an unexplained blank workspace | **FIXED** | Range changes hide visible results and provide a direct calculate-to-update message. This also replaces an insufficient-games error. Successful completion clears it. |
| A-07 — Matchup context resets on reload | **FIXED** | Actual reload restored SEA/NE/New England home and the same 5.1-point result. |
| A-08 — Secondary text and display typography reduce data readability | **FIXED** | Current muted text/background retain approximately 8.6:1 contrast, readable table typography, and 14px body data. No regression to tiny condensed mobile labels observed. |
| A-09 — Sort affordances overstate interactivity and direction | **FIXED** | Active direction matches ordered data and aria-sort; inactive arrows are neutral. Movement controls now sort, so their affordances are truthful. New Team activation starts ascending. |
| A-10 — Numeric formatting exposes negative zero | **FIXED** | Full displayed numeric sequences contained no negative zero; previously affected Atlanta and Chicago values read 0.0. |
| A-11 — Column headings disappear during vertical table traversal | **FIXED** | Live desktop/mobile scrolling retains readable floating labels. All ten columns measured 0px x/width mismatch, including mobile horizontal scrolling at 250 and 457px. Header hides above/below the table and in matchup navigation. |

**Disposition totals: 11 FIXED, 0 STILL OPEN. No new Astra IDs.**

## Limitations

This review verifies UI behavior, displayed counts, complete displayed sort sequences, and matchup consistency. It does not independently reconstruct the statistical model or rerun the parent's reported numerical test suite. CSV parsing/replacement, remote refresh, fresh-storage initialization, missing-movement sorting with another range, full screen-reader operation, zoom, other browsers, physical touch input, and all team pairs were not tested. Only one floating sort column was exercised through pointer plus both keyboard keys; all ten original sort columns were exercised. A temporary short viewport was used for the below-table disappearance check because the normal-height viewport cannot scroll the entire table above the screen with the available footer content.

No app/source data was overwritten. Browser interactions updated ordinary saved preferences/results through the existing application workflow. Final calculation was restored to 2025 weeks 1–18, with ascending Rank and SEA/NE/New England home retained.
