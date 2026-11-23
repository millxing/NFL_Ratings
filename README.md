# NFL Ratings

NFL team power ratings and matchup projections based on scoring margin and strength of schedule, or on play-by-play efficiency.

**Live app:** https://millxing.github.io/NFL_Ratings/

## Use locally

Open `NFLPowerRatings.html` in a browser, or serve the project:

```sh
python3 -m http.server 8765
```

Visit http://localhost:8765/. The root page opens `NFLPowerRatings.html`. Ratings calculate automatically after game data loads and whenever Season, Start Week, or End Week changes; valid saved results are restored on later visits. Week labels omit Complete; Partial appears only for the current season, and weeks with No results remain labelled and disabled. Compact scrubbers beneath Start Week and End Week let you drag either endpoint or use previous/next arrows. Keyboard arrows step the focused slider; weeks without results are skipped, and the endpoints cannot cross. Each scrubber stays in sync with its dropdown, where partial weeks remain labelled. Imported files without a verified full schedule show Completeness unknown. Data checked reports retrieval time, not when game results were published. Earlier versions remain in git history.

The ratings table and matchup comparisons show PF (points for) and PA (points against) as totals from completed games over the selected week range. DIFF is the average scoring margin per game over that range. Column tooltips explain each metric on hover or keyboard focus, including in the floating header. Press Escape to close a tooltip. Sorting defaults to Rating, highest first, whenever the app opens, reloads, or Refresh data is used; column headers still support sorting without arrow symbols.

Team names follow the selected season in ratings, matchup controls, and weekly predictions: St. Louis Rams through 2015, San Diego Chargers through 2016, Oakland Raiders through 2019, Washington Redskins through 2019, and Washington Football Team in 2020–2021. Later seasons use the current names. Compact displays use historical relocation abbreviations (STL, SD, OAK); internal franchise codes remain stable for calculations and saved selections. Saved results with names that do not match the season are recalculated.

The app loads completed game data from remote sources, supports CSV import, and stores preferences and cached results in browser storage. Source details are available in the app.

Below the matchup calculator, weekly schedule predictions show unplayed games only. Completed games are omitted; fully played weeks show “No unplayed games remaining.” It defaults to the first week with unplayed games (or the final scheduled week after the season), shows home/neutral venue and predicted margins, and lets you select a game to populate the calculator. Weekly predictions always use that season's results from Week 1 through the preceding week, excluding all selected-week results. The actual ratings cutoff is displayed. Selecting a game updates the calculator's rating range to match its prediction. Early weeks without enough history show predictions as unavailable; imported schedules may be incomplete.

## Rating methods

Use **Rating method** beside Season to select a method. The menu shows the full names, "Opponent-adjusted Point Differential" and "Opponent-adjusted Efficiency"; other text uses the short names. Both methods give points above or below an average team on a neutral field. A matchup spread is Team A's rating minus Team B's rating, plus home-field advantage for the home team.

- **Point Differential** (default): the existing scoring-margin model with strength of schedule, over any week range.
- **Efficiency**: opponent-adjusted scrimmage efficiency per play (Offense minus Defense), scaled each week to the spread of the Point Differential ratings for the same games. Each rating uses only that season's regular-season plays from Week 1 through the selected week. No earlier season is used. Special teams are not included.

Efficiency rules (the files and code still use the short name `pbp`):

- Switching methods keeps the season, the weeks and the sort, so you can compare the two methods directly. Efficiency changes only what it cannot show: Start Week becomes Week 1, and an End Week without Efficiency ratings moves to the nearest published week. Screen readers announce what changed. When you switch back, those forced changes are undone. If you changed End Week while in Efficiency, the new End Week stays.
- A sort on a column that the other method does not have (SOS, or Offense and Defense) uses Rating order in that method and returns when you switch back.
- End Week offers only published weeks.
- The first published week is the first week where the Point Differential fit (home-field advantage and the point scale) exists: Week 3 in most seasons, Week 2 in five. Ratings before Week 6 rest on few games; treat them as rough.
- The latest week can be partial, for example Sunday's games before Monday night. The End Week menu shows "Partial", the same label as Point Differential.
- The table shows Offense and Defense instead of SOS. Both are in points, positive is better, and Offense + Defense = Rating. The shown values add up exactly: when rounding would leave a 0.1 gap, the part with the larger rounding error takes it. Point to a value to see the success rate in percent. Record, PF, PA and DIFF use the same games.
- Home-field advantage comes from the Point Differential fit of the same games.
- A weekly prediction for Week N always uses the ratings through Week N−1, including a partial week. When ratings through Week N−1 are not published, the page says that the prediction is unavailable. Postseason predictions are not available in this method.
- Before it combines ratings with records, the page compares a digest of the loaded game results (season, week, teams, scores, venue) with the digest stored in the ratings file. If they differ (for example, an imported CSV with a different score), the page shows that Efficiency is unavailable. One exception: for a partial week, the loaded results can have more games of that week than the ratings file (games that finished after the play-by-play update). All other games must match. The ratings and records then use only the games in the file, and the page names the games not yet included.

### Efficiency rating files

`data/pbp/manifest.js` lists the published seasons and weeks. `data/pbp/season-YYYY.js` holds one season's weekly team summaries: rank, games, Offense and Defense in percent and in points, efficiency, points, the reference Point Differential rating, k (the scale factor), home-field advantage and the game-slate digest. A partial-week snapshot also stores the digest of the earlier weeks and one line per included game of that week. The files are scripts, so they also load when you open the HTML file directly. The page loads a season file only when it is needed.

Current coverage: 2001–2025 regular seasons from Week 2 or 3, and 2026 Weeks 3–11 (Week 11 partial: 12 of 13 games, built November 23, 2026).

The files are built in the sibling DVOA project (`/Users/robschoen/Dropbox/CC/DVOA`). Raw play-by-play data, intermediate files and the Python environment stay out of this repository. To refresh 2026 (for example on Monday morning and again after Monday night):

```sh
python3 /Users/robschoen/Dropbox/NFL_PBP/code/update_pbp.py      # download and verify the latest play-by-play
cd ../DVOA
python3 -m ratings.site --season 2026 --out ../NFL_Ratings/data/pbp
```

The updater keeps every complete 2026 week plus the completed games of the next week. `--through` is the last week to publish; omit it to use the last verified week, partial or complete. For a historical backfill, use `--season 2001-2025`. The command writes each season file before the manifest. It stops with an error if a week is incomplete or a score differs from the schedule. If the source file is unchanged, earlier weeks must reproduce their published values. Then run the tests below and commit the changed `data/pbp` files.

## Verification

The app includes seasons from 2001 onward, including imported and cached data. Playoff rounds use consistent labels across seasons: Wild Card, Divisional, Conference, and Super Bowl.

Historical regression tests use completed 2001 games from [nflverse/nfldata](https://github.com/nflverse/nfldata/blob/master/data/games.csv), stored in `tests/fixtures/games-2001.csv`. They verify 248 regular-season games, 11 playoff games, all 31 teams' records and point totals against [independent standings](https://www.profootballarchives.com/2001nfl.html), and playoff-round mapping. The model fits and mean-centers only teams present in the selected games, so 2001 produces 31 ratings and excludes Houston.

```sh
node tests/ratings-model.cjs
node tests/startup.cjs
node tests/column-tooltips.cjs
node tests/pbp-mode.cjs
```

`tests/pbp-mode.cjs` uses the published `data/pbp` files and `tests/fixtures/games-2026.csv` (nflverse schedule, Weeks 1–10 complete; Week 11 has 12 of 13 games played). It checks that shown Offense + Defense equals the shown rating for every published team row, the Week 3 and Week 4 boundaries, the partial Week 11 (with loaded scores ahead of and behind the ratings file), matchups and venues, weekly predictions, method switching, reload, old saved settings, missing or stale files, mismatched imports, a season change during loading, and 2001's 31 teams. `tests/harness.cjs` is the shared test page harness.

Design assessments and the remaining issue register are in [docs/design-review/SUMMARY.md](docs/design-review/SUMMARY.md).

## Deployment

GitHub Pages publishes the repository root from the `main` branch. Push changes to `main` to update the site. No build step is required; `.nojekyll` enables plain static hosting.

## Attribution and licensing

Page content is licensed under [Creative Commons Attribution 4.0 International](https://creativecommons.org/licenses/by/4.0/). The existing source-code headers specify MIT. Third-party data retains its own licensing; see [nflverse/nfldata](https://github.com/nflverse/nfldata).

[entangledparticles.xyz](https://entangledparticles.xyz/)
