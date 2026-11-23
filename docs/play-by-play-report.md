# Play-by-Play Power Rating — implementation report

Date: November 22, 2026, with a follow-up on November 23 (see the last section). Assignment: [play-by-play-handoff.md](play-by-play-handoff.md). Not deployed and not committed.

The sections before "Follow-up" describe the first version (Week 6 start, complete weeks only, Offense/Defense in percent). Where they differ, the follow-up section applies.

## Status

Done: the season-only producer, the 2001–2026 data files, the website method selector, tests and the walk-forward evaluation. The Play-by-Play method is **not more accurate** than Point Differential in the evaluation (see below). It is about equal.

## Decisions

| Decision | Reason |
|---|---|
| New producer `ratings/site.py` in DVOA; research files unchanged | The handoff asks to keep the new mode separate from research outputs. |
| Each cutoff is rebuilt from raw rows through that week only | A later rebuild with the same source gives the same earlier values. The publish step checks this. |
| Population SD on both sides of k | Same convention on both sides, as specified. The ratio does not depend on the choice. |
| Data files are scripts (`registerPbpSeason(...)`), loaded on demand | Works on GitHub Pages and when the HTML file is opened from disk. Verified in headless Chromium from file://. |
| Slate digest = SHA-256 of `season,week,home,away,home score,away score,H/N` lines | Python and the page build the same text; the producer runs the page's own function in Node and requires equality. |
| Synchronous SHA-256 in the page | `crypto.subtle` is asynchronous and depends on a secure context. The page version is tested against Node's crypto. |
| Play-by-Play predictions only for regular-season weeks | Postseason cutoffs are not in the play-by-play model. |
| Saved results format version 3 (method and file build in the key) | Older saved results recalculate once. Old preferences get Point Differential. |

## Changed files

NFL_Ratings: `NFLPowerRatings.html`, `README.md`, `data/pbp/manifest.js`, `data/pbp/season-2001.js` … `season-2026.js` (1.7 MB total, about 66 KB per season), `tests/harness.cjs` (new, moved from startup.cjs), `tests/pbp-mode.cjs` (new), `tests/startup.cjs`, `tests/fixtures/games-2026.csv` (new), this report.

DVOA: `ratings/site.py`, `ratings/app_reference.cjs`, `tests/test_site.py`, `analysis/season_only/evaluate.py` and its outputs (`games.csv`, `by_season.csv`, `summary.json`), `README.md` (new section).

## Commands

```sh
cd /Users/robschoen/Dropbox/CC/DVOA
python3 -m ratings.site --season 2001-2025 --out ../NFL_Ratings/data/pbp    # 82 s
python3 /Users/robschoen/Dropbox/NFL_PBP/code/update_pbp.py
python3 -m ratings.site --season 2026 --out ../NFL_Ratings/data/pbp
python3 -m unittest discover -s tests                                         # 17 tests
python3 -m analysis.season_only.evaluate
python3 -m analysis.special_teams.check
cd ../NFL_Ratings
for t in ratings-model startup column-tooltips pbp-mode; do node tests/$t.cjs; done
```

## Verification results (verified)

- Point Differential reference, 2026 Weeks 1–10 (150 games): JAX +11.79, SF +7.54, SEA +3.72, BUF +9.16. These display as +11.8, +7.5, +3.7 and +9.2. The same values came from the play-by-play slate and from the live nflverse schedule.
- Cutoff test: 2026 Week 6 and 2013 Week 6 rebuilt from raw files with all later rows physically removed. Team values, k, home-field advantage and all spreads agree (tolerance 1e-5 points; actual differences are rounding only).
- Every cutoff: mean points 0, SD(points) = SD(Point Differential), same rank order as efficiency. 2001 has 31 teams.
- All 310 published snapshots match the slate digest of the live nflverse schedule (downloaded November 22, 2026). The primary source habitatring.com failed its TLS certificate check that day; the page used the fallback.
- Tests: website 4/4 files pass; DVOA 14 tests pass. Three deliberate code faults (no slate check, Week N instead of N−1, no late-load guard) each made `pbp-mode.cjs` fail.
- Browser (Chromium preview, live data, desktop 1536 px and phone 390 px): standings, matchups, mobile matchup table, Week 11 predictions and click-through, Week 12 unavailable, reload, two method switches with range restore, 2001 season, tooltips and floating header. No horizontal page scroll on the phone width.

## Worked example — Cincinnati at Washington, 2026 Week 11

Source cutoff: 2026 Weeks 1–10, 150 games, file build `2026-11-23T03:55:33Z/fbc3cdfbb16e`.

| | Offense (%) | Defense (%) | Efficiency E = O − D | Play-by-Play points |
|---|---:|---:|---:|---:|
| CIN | +26.61 | +6.37 | +20.24 | +7.574 |
| WAS | −4.49 | +3.97 | −8.46 | −3.283 |

k = 6.0112 / SD(E) = 0.37835; mean E = 0.220. CIN points = 0.37835 × (20.238 − 0.220) = 7.574.
Neutral spread = 7.574 − (−3.283) = 10.857. Washington is home, so subtract H = −0.030: 10.857 − (−0.030) = 10.886.
Displayed: **Cincinnati Bengals by 10.9 points**. The Point Differential method gives Cincinnati by 14.2 for the same game.

## Walk-forward evaluation

Each game from Week 7 onward uses the snapshot through the previous week. Both spreads use the same games, venues and home-field advantage. Coverage: 100% of eligible games (4,210 in 2001–2025; 57 in 2026). Lower error is better.

| Period | Games | MAE Point Differential | MAE Play-by-Play | Paired difference (PBP − PD) |
|---|---:|---:|---:|---:|
| 2001–2025 | 4,210 | 11.105 | 11.131 | +0.026 (95% season bootstrap −0.064 to +0.125) |
| 2026 to date | 57 | 10.415 | 10.874 | +0.459 (SE 0.612) |

Play-by-Play had lower error in 13 of 25 historical seasons. There is no evidence that it is better. By season: `DVOA/analysis/season_only/by_season.csv`. The Point Differential spreads match the page's own weekly forecasts (2001 and 2026, maximum gap 1e-6).

## Open risks and unverified items

- **Assumption:** present-day corrected play-by-play files reconstruct past cutoffs. They are not the files that were available at the time.
- 2025 and 2026 week completeness uses the updater's verification record (game counts and scores checked on November 22), because the local `games.csv` (December 2025) has no 2026 schedule. The live-schedule digest check above passed.
- PBP mode was not exercised end to end from file:// in a browser; the file:// script loading of the real data files was verified separately, and the page itself loaded live data from file://.
- Safari and Firefox were not tested.
- The Point Differential scale k depends on that week's Point Differential spread; early-season scale is noisy.
- Fixed on November 23: the updater now adds completed 2026 games, including a partial week.

## Next steps

1. Review the page locally (`python3 -m http.server 8765`), then commit and push to deploy.
2. When the updater covers later weeks, run the 2026 refresh command and the tests, then commit `data/pbp`.

## Follow-up — November 23, 2026

### Requests and status

1. **Offense and Defense add up to the rating.** Done. Offense points = k × (O − mean O), Defense points = −k × (D − mean D). Positive is better for both, and Offense + Defense = Rating exactly. The table, matchup table and phone table show points. The success rate in percent appears when you point to a value. Rounded values add up exactly: when rounding leaves a 0.1 gap, the part with the larger rounding error takes it, so a shown part can differ from its exact value by up to 0.1.
2. **Weeks before Week 6.** Done, with a limit. Ratings are published from the first week where the website's Point Differential fit exists. That is Week 3 in 20 seasons and Week 2 in five (2004, 2005, 2016, 2018, 2019). Weeks 1 and 2 show "Not available" because the Point Differential method also has no ratings there. The Play-by-Play point scale (k) and home-field advantage come from that fit. Weeks before Week 6 show a caution.
3. **Partial weeks.** Done. 2026 Week 11 is published with 12 of 13 games (Monday night not yet played). If the scores on the page include a game that finished after the play-by-play update, the page still shows the ratings, names the missing game, and uses only the file's games for records. All other games must match exactly.

### Decisions

| Decision | Reason |
|---|---|
| No fixed point scale for Weeks 1–2 | A fixed k (for example a historical average) is possible, but home-field advantage would also be missing, and the Point Differential method shows nothing for those weeks either. Can be added if wanted. |
| File schema 2; model rules unchanged | New fields (points split, partial-week data) and new first week. The rating rules (classifier, ridge 150, fumble weight 50, scale) did not change. Week 10 values are the same as before (SF +14.495697). |
| Partial-week tolerance only for extra games of that week | Scores are refreshed from the live schedule more often than the play-by-play files. Any other difference still blocks the method. |
| Updater keeps complete weeks plus the next week's completed games | Later games wait until the partial week is complete, so a gap cannot appear in the middle of the season. |

### Changed files (follow-up)

- NFL_PBP: `code/update_pbp.py` (all completed 2026 games, per-week scheduled counts), `DATA_README.md`. Updated data: `play_by_play_2026.parquet` (162 games); backup in `backups/before_pbp_update_20261123T160410Z`.
- DVOA: `ratings/site.py`, `ratings/app_reference.cjs`, `tests/test_site.py`, `analysis/season_only/evaluate.py` (+ `early_weeks.csv`), new `analysis/special_teams/check.py` and `summary.json`, `README.md`.
- NFL_Ratings: `NFLPowerRatings.html`, `data/pbp/*` (rebuilt, 2.7 MB), `tests/pbp-mode.cjs`, `tests/fixtures/games-2026.csv` (Sunday night score added), `README.md`, this report.

### Verification (verified)

- DVOA tests: 17 pass. New: points split adds up; Week 3 cutoff test on truncated raw data; partial Week 11 snapshot (12 games, 13 scheduled, earlier-weeks digest equals the Week 10 digest).
- Website tests: 4 of 4 files pass. Shown Offense + Defense = shown rating for all 12,000+ published team rows. Four deliberate faults (no earlier-week check, no rounding fix, no included-game check, records with the pending game) each make `pbp-mode.cjs` fail.
- Headless Chromium on the real page with live data: 2026 Week 11 partial shows 162 games, SF +14.9 = +11.9 + 3.0; every row adds up; Week 4 shows the caution; Week 12 predictions use Week 11; phone width has no horizontal scroll.

### Special teams (verified analysis, 2001–2025)

Special teams are nflverse EPA on kickoffs, punts, field goals and extra points, net per game.

| Measure | Special teams | Scrimmage plays |
|---|---:|---:|
| SD across teams, points per game | 1.6 | 7.3 |
| Share of team variance | about 5% | about 95% |
| First-half vs second-half correlation | 0.24 | 0.51 |

Adding season-to-date special-teams EPA to the Play-by-Play spread (weight 0.66, fitted with each season left out) lowers the error from Week 7 on from 11.131 to 11.033 points: −0.097 (95% season bootstrap −0.149 to −0.044), better in 19 of 25 seasons. That would put Play-by-Play slightly ahead of Point Differential (11.105). **Not built into the rating.** It is one test, chosen after the first results were seen, so treat the gain as likely but not certain.

### Early-week evaluation (2001–2025, previous-week snapshot)

| Target week | Games | MAE Point Differential | MAE Play-by-Play | Paired (PBP − PD) |
|---:|---:|---:|---:|---:|
| 3 | 76 | 35.2 | 32.4 | −2.8 (SE 5.1) |
| 4 | 370 | 16.4 | 15.2 | −1.18 (SE 0.55) |
| 5 | 356 | 12.4 | 12.2 | −0.26 (SE 0.36) |
| 6 | 352 | 12.0 | 12.4 | +0.36 (SE 0.31) |

Play-by-Play is better than Point Differential in Week 4, but both are poor before Week 5. 2026 from Week 7 (now 69 games): Point Differential 10.40, Play-by-Play 10.60.

### Open risks and next steps

- The play-by-play data and the ratings files are refreshed only when you run the two commands. Nothing runs automatically.
- Each updater run keeps a backup (about 25–55 MB).
- Options: (a) add special teams as a third column (Offense + Defense + Special teams = Rating), then re-run the evaluation; (b) a fixed scale for Weeks 1–2; (c) a scheduled refresh.
- Commit and push to deploy, after review.
