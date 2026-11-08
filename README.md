# NFL Ratings

NFL team power ratings and matchup projections based on scoring margin and strength of schedule.

**Live app:** https://millxing.github.io/NFL_Ratings/

## Use locally

Open `NFLPowerRatings.html` in a browser, or serve the project:

```sh
python3 -m http.server 8765
```

Visit http://localhost:8765/. The root page opens `NFLPowerRatings.html`. Ratings calculate automatically after game data loads and whenever Season, Start Week, or End Week changes; valid saved results are restored on later visits. Week labels omit Complete; Partial appears only for the current season, and weeks with No results remain labelled and disabled. Compact scrubbers beneath Start Week and End Week let you drag either endpoint or use previous/next arrows. Keyboard arrows step the focused slider; weeks without results are skipped, and the endpoints cannot cross. Each scrubber stays in sync with its dropdown, where partial weeks remain labelled. Imported files without a verified full schedule show Completeness unknown. Data checked reports retrieval time, not when game results were published. Earlier versions remain in git history.

The app loads completed game data from remote sources, supports CSV import, and stores preferences and cached results in browser storage. Source details are available in the app.

Below the matchup calculator, weekly schedule predictions show unplayed games only. Completed games are omitted; fully played weeks show “No unplayed games remaining.” It defaults to the first week with unplayed games (or the final scheduled week after the season), shows home/neutral venue and predicted margins, and lets you select a game to populate the calculator. Weekly predictions always use that season's results from Week 1 through the preceding week, excluding all selected-week results. The actual ratings cutoff is displayed. Selecting a game updates the calculator's rating range to match its prediction. Early weeks without enough history show predictions as unavailable; imported schedules may be incomplete.

## Verification

```sh
node tests/ratings-model.cjs
node tests/startup.cjs
```

Design assessments and the remaining issue register are in [docs/design-review/SUMMARY.md](docs/design-review/SUMMARY.md).

## Deployment

GitHub Pages publishes the repository root from the `main` branch. Push changes to `main` to update the site. No build step is required; `.nojekyll` enables plain static hosting.

## Attribution and licensing

Page content is licensed under [Creative Commons Attribution 4.0 International](https://creativecommons.org/licenses/by/4.0/). The existing source-code headers specify MIT. Third-party data retains its own licensing; see [nflverse/nfldata](https://github.com/nflverse/nfldata).

[entangledparticles.xyz](https://entangledparticles.xyz/)
