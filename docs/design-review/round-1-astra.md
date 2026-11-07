# Round 1 independent review — Astra

Reviewed 2026-11-07. Application: `NFLPowerRatings-v3.html`, served at `http://localhost:8765/NFLPowerRatings-v3.html`. Read-only evaluation; no application files changed. No subagents used. All issues below are **NEW**, with stable `A-` identifiers for subsequent rounds.

## Assessment

The desktop interface is coherent and usable for a practiced user, with a clear primary action, restrained panels, and readable team names. It falls short of professional-level completion because sorting excludes keyboard users, mobile filters truncate important selections, and several states communicate inaccurately or incompletely. The sports display type and bright accents establish character, but their use in small table labels reduces precision. Do not add large hero titles or subtitles; improve the existing working interface.

Scores use 1–10; 9+ requires professional website developer quality. Overall is a holistic judgment, not a claim of standards compliance.

| Category | Score |
|---|---:|
| visual hierarchy | 7.2 |
| typography | 6.6 |
| color and contrast | 7.0 |
| layout and spacing | 7.0 |
| table/data readability | 6.4 |
| controls and interaction feedback | 6.3 |
| navigation and workflow | 7.1 |
| responsive design | 5.3 |
| accessibility | 4.8 |
| overall polish | 6.4 |

**Overall score: 6.4/10.**

## Evidence and test results

Both supplied screenshots were opened using the image tool:

- Initial: `/Users/robschoen/.t3/userdata/browser-artifacts/browser-screenshot-localhost-mw6iv4wj-0fbb5d10.png`.
- Calculated: `/Users/robschoen/.t3/userdata/browser-artifacts/browser-screenshot-localhost-mw6ivay4-012f6ac1.png`.

These supplied images appear softened, so fine typography judgments rely primarily on live browser images. The initial screenshot shows a large empty area below the controls. The calculated screenshot shows the same visual structure, a bounded scrolling table, and prominent positive/negative colors.

Used `preview_status` first, opened an independent tab with `reuseExistingTab:false`, used only that tab, and closed it after testing. Live viewports: 1280×800 and 390×844. Browser DOM inspection supplemented actual select, click, Tab, scroll, and reload actions. Initial live state already contained persisted 2025 results; this was not treated as a clean first visit.

| Task | Actual result |
|---|---|
| Calculate 2025 weeks 1–18 | Passed: clicked Calculate; ratings table contained exactly 32 teams and reported 272 games. Seattle +12.8 ranked first; Jets −12.4 ranked last. Home-field advantage displayed 2.16 points. Numerical model accuracy against an independent implementation was outside scope. |
| Rating sort, both directions | Passed: descending +12.8 through −12.4; ascending reversed the order. |
| Team sort, both directions | Passed: first click Washington through Arizona; second click Arizona through Washington. Full ordered row output inspected. |
| Record columns, both directions | Passed for Wins, Losses, and Ties individually: wins 14→3 / 3→14; losses 14→3 / 3→14; ties 1→0 / 0→1. |
| Week changes / stale ratings | Passed: changing end week 18→17 removed displayed ratings. Matchup then said “Calculate power ratings to use the matchup calculator.” Old predictions were not presented as current. No explanatory recalculation message appears in the ratings blank area. |
| Invalid range | Prevented by silent normalization: setting start to 18 while end was 17 changed end to 18. Attempting end 5 with start 18 reverted end to 18. Calculating this resulting single-week range displayed “Not enough games found (16). Need at least 32 games for analysis.” No invalid-range dialog occurred. |
| Matchup: Arizona vs Atlanta | Passed: neutral Atlanta by 1.5; Arizona home Arizona by 0.6; Atlanta home Atlanta by 3.7. Values are consistent with the displayed 2.16-point home adjustment and rounding. |
| Identical teams | Validation passed: Arizona vs Arizona showed “Choose two different teams.” Two identical stats rows remained underneath. |
| Return to ratings | Passed: navigation returned to existing results and preserved the selected sort during the session. Active navigation used `aria-current="page"`. |
| Actual document reload | After `location.reload()` and data load completion, 2025 / weeks 1–18, Ties ascending, and 32 results restored. Matchup venue previously set to Team A home reset to Neutral. Team selections were defaults already, so persistence of nondefault team selections was not established. Same-URL navigation earlier was not relied on as reload evidence. |
| Source details | Passed disclosure: identified nflverse/nfldata on GitHub fallback, 7,398 completed games, incomplete-week caveat, and clarification that update time means application load time. Refresh and Import CSV appeared inside the disclosure. Refresh was not invoked. |
| Import affordance | Opened actual file chooser accepting `.csv`, then canceled without selecting a file. Import also exposed a persistent “Remote data loading failed. Upload a CSV file manually” panel despite functioning loaded data. No data overwritten. CSV parsing, malformed files, and replacement behavior were deliberately not tested. |
| Desktop layout | All ten table columns fit at 1280px; results use an internal vertical scroller with about six full rows in the original desktop view. Matchup table fits its panel. |
| Mobile horizontal access | Actual horizontal scroll succeeded: ratings viewport 341px, content 760px, scrollLeft reached 419px. Page itself did not overflow horizontally. Team names scroll away with the rest of the table. Matchup also exposes a horizontal scrollbar; its complete rightward traversal was not separately exercised. |
| Mobile controls | Season and week values truncate at 390px; matchup team names similarly truncate because three controls remain in one row. Table header text measured 10px, team/record text 12px. |
| Keyboard and semantics | Tab exercised native controls, navigation, and Source details. In a completed-results state, Tab after Calculate reached the scroll container and then Source details, bypassing every sortable header. Headers are plain `th` elements with `tabIndex=-1`, no buttons, and no `aria-sort`. Status and matchup output do have polite live regions. Full screen-reader operation and all browser/device combinations were not tested. |

## Issue register

### A-01 — Sorting is unavailable through keyboard controls

- **Severity:** High
- **Status:** NEW
- **Evidence:** All eight sortable headers are plain `th[data-sort]`, have no focusable child or `aria-sort`, and are skipped by Tab. Pointer sorting works, so keyboard users lose a core capability.
- **Recommended fix:** Put a native button inside each sortable header; support Enter/Space through native behavior, show a visible focus indicator, and update `aria-sort` on the active header. Announce the column and direction without reading decorative arrow characters. Verify both directions using keyboard alone.

### A-02 — Mobile filters conceal selected values

- **Severity:** High
- **Status:** NEW
- **Evidence:** At 390px, Season / Start Week / End Week remain three equal narrow fields. “2025 Season” and “Week 18” visibly truncate. Matchup fields reduce Arizona Cardinals and Atlanta Falcons to short fragments. Choosing among similarly named teams becomes unnecessarily ambiguous.
- **Recommended fix:** At narrow widths, give Season its own row and pair the two week fields; stack the two team selectors with full-width values, with Venue on its own row. Preserve compact desktop controls. Do not reduce type further or introduce a hero.

### A-03 — Import action incorrectly declares a network failure

- **Severity:** Medium
- **Status:** NEW
- **Evidence:** Clicking Import CSV opens the chooser and exposes the panel “Remote data loading failed. Upload a CSV file manually.” Canceling leaves that panel visible above functioning results. Source details still reports loaded fallback data. Source inspection confirms the import handler unconditionally shows the same upload section used for failures.
- **Recommended fix:** Separate intentional import copy from actual fetch-error copy. On user import, label the panel “Import CSV,” explain expected format/replacement behavior concisely, and allow dismissal. Canceling should retain the prior layout and data without displaying an error.

### A-04 — Mobile table loses team identity while accessing ratings

- **Severity:** Medium
- **Status:** NEW
- **Evidence:** At 390px, the 760px-wide table initially shows rank, team, and record; Rating and SOS require horizontal scrolling. Team names move offscreen during the successful 419px scroll. Header type is 10px and body names/records 12px.
- **Recommended fix:** Keep the team column sticky during horizontal scrolling and prioritize Rating adjacent to Team for narrow screens. Use readable table text rather than shrinking it to fit; preserve horizontal overflow for secondary metrics. Ensure sticky cells do not obscure values or headers.

### A-05 — Invalid week selections are changed silently

- **Severity:** Medium
- **Status:** NEW
- **Evidence:** Start 18 automatically changes end 17 to 18; trying end 5 silently returns it to 18. Subsequent calculation reports too few games, not that the user's range selection was normalized.
- **Recommended fix:** Disable end options preceding Start Week, or show a concise inline explanation when adjusting the other field. Keep the effective range visible and announce automatic changes. Retain the valid insufficient-data message for genuinely small ranges.

### A-06 — Clearing stale results leaves an unexplained blank workspace

- **Severity:** Low
- **Status:** NEW
- **Evidence:** Changing end week removes the results section entirely; the ratings view gives no inline reason or next-step message. Matchup handles this more clearly with a calculate-first message. The supplied initial screenshot likewise has substantial uninformative blank space.
- **Recommended fix:** Add a small contextual status near Calculate or in the former result area: “Week range changed. Calculate to update ratings.” For a fresh state, use a single compact instruction. No large empty-state hero or subtitle.

### A-07 — Matchup context resets on reload

- **Severity:** Low
- **Status:** NEW
- **Evidence:** Actual reload restored rating preferences and results but changed Team A home to Neutral. This can change the projected winner (Arizona by 0.6 before versus Atlanta by 1.5 after).
- **Recommended fix:** Persist team selections and venue alongside rating preferences, then restore after team options and ratings initialize. This is a continuity improvement; no explicit persistence promise was visible. Nondefault team persistence was not directly tested.

### A-08 — Secondary text and display typography reduce data readability

- **Severity:** Medium
- **Status:** NEW
- **Evidence:** Desktop ranks and team abbreviations are visibly subdued; rank color is rgb(107,125,143) on rgb(22,32,41), approximately 3.9:1 contrast, below 4.5:1 for ordinary small text. Small condensed all-caps table labels and mobile 10px headers are harder to scan than team names. This is a targeted observation, not a full contrast audit.
- **Recommended fix:** Increase rank/abbreviation contrast and use a neutral, readable table font with tabular numerals. Reserve the condensed display face for the existing compact title and selected headings. Raise mobile label size rather than compressing it further.

### A-09 — Sort affordances overstate interactivity and direction

- **Severity:** Low
- **Status:** NEW
- **Evidence:** Every sortable column shows a downward arrow even when inactive, creating multiple apparent sort states. Delta headers present a pointer cursor despite having no sorting action. The default Rank arrow points down while rows run 1→32. Team's first activation sorts Z→A, requiring another click for typical alphabetical lookup.
- **Recommended fix:** Show a directional arrow only on the active sort, a neutral affordance on other sortable headers, and a normal cursor on informational headers. Define sensible per-column initial directions: rank ascending, team A→Z, rating descending. Align visual and announced direction with actual order.

### A-10 — Numeric formatting exposes negative zero

- **Severity:** Low
- **Status:** NEW
- **Evidence:** Atlanta displays −0.0 for movement and SOS; Chicago movement also displays −0.0. Matchup repeats those values. A sign without visible magnitude implies a distinction the displayed precision cannot support.
- **Recommended fix:** Normalize rounded zero to “0.0” across rating, movement, differential, and SOS formatting; retain actual precision in calculations.

## Recommended order

Address A-01 and A-02 first, then A-03/A-04/A-05/A-08. Finish state continuity and formatting afterward. Preserve the compact operational layout and existing navigation. Do not add large hero titles or subtitles. In subsequent rounds retain these IDs and mark each FIXED or STILL OPEN; allocate new IDs only to newly discovered issues.
