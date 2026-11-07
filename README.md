# NFL Ratings

NFL team power ratings and matchup projections based on scoring margin and strength of schedule.

**Live app:** https://millxing.github.io/NFL_Ratings/

## Use locally

Open `NFLPowerRatings.html` in a browser, or serve the project:

```sh
python3 -m http.server 8765
```

Visit http://localhost:8765/. The root page opens `NFLPowerRatings.html`. Ratings calculate automatically after game data loads and whenever Season, Start Week, or End Week changes; valid saved results are restored on later visits. Week labels show Complete, Partial, or No results, and weeks with no results are disabled. The latest available week and its recorded/scheduled game counts appear beside the filters. Imported files without a verified full schedule show Completeness unknown. Data checked reports retrieval time, not when game results were published. Earlier versions remain in git history.

The app loads completed game data from remote sources, supports CSV import, and stores preferences and cached results in browser storage. Source details are available in the app.

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
