# Coding handoff — Play-by-Play Power Rating

## Assignment

Build a second rating method into the existing NFL Power Ratings website. Put a **Rating method** control beside the season/week controls with two choices: **Point Differential** (the existing default) and **Play-by-Play**. Use the selected method throughout the standings, matchup calculator, and weekly predictions.

Both methods must answer the same question: “By how many points would this team be favored against an average team on a neutral field?” Subtract the teams’ point ratings to make a neutral-field spread. Rob wants the uncalibrated version, based entirely on the selected season through the displayed cutoff. Publish the first PBP standings after six completed regular-season weeks. The earliest forecast is for Week 7.

**Status at handoff.** The existing point-differential website works. The sibling research project has a tested play classifier, success-point model, and opponent solver. It does **not** yet have the requested entirely season-only production rating. Implement that producer as well as the website integration. This handoff is the only change made for this assignment so far.

## Locate the existing work

| Location on Rob’s Mac | What to use |
|---|---|
| `/Users/robschoen/Dropbox/CC/NFL_Ratings` | Target GitHub Pages repository. Inspected at commit `44fa6ff`. Read its README, then `NFLPowerRatings.html`. Follow `calculateRatings`, `renderResultsTable`, `weeklyForecast`, `schedulePrediction`, `matchupMargin`, `updateMatchup`, and saved-result restoration. The project already supports historical franchise names, neutral venues, CSV imports, and direct opening of the HTML file. |
| `/Users/robschoen/Dropbox/CC/DVOA` | Local Python producer. Start with `ratings/events.py` for classification and valuation, `ratings/model.py` for expectations and opponent adjustment, `ratings/build.py` for input checks, and `tests/test_ratings.py` for regression fixtures. Keep the new mode separate from historical research outputs. |
| `/Users/robschoen/Dropbox/NFL_PBP` | Read-only nflverse source. Read `DATA_README.md` and the update manifest. Use one canonical season Parquet per season, from 2001 onward. The verified 2026 source currently ends at Week 10 (150 regular-season games). The current upstream updater has a Week 10 cap. |

**Important trap.** The research build uses up to three earlier seasons for situational baselines and accumulates fumble recovery counts across seasons. The forecasts in `analysis/neutral_points/export.py` also fit coefficients on earlier seasons. Even `analysis/neutral_points/uncalibrated_week10.csv` uses historical information underneath its season-only point conversion. None of these exports is a valid production feed. Published forecast gains for those variants do not establish the accuracy of this one.

## 1. Build a season-only weekly snapshot

The following are implementation defaults for v1. They resolve details the research prototype leaves open. Keep fixed scoring and smoothing constants versioned. They are model rules; do not tune them against other seasons during a build.

1. For season S and completed regular-season cutoff W, select **all completed games from Week 1 through W**. Verify the expected game IDs and scores against the schedule, account for byes and cancellations, and stop publication at the last verified complete week. Use the same game set for PBP, the reference point ratings, and home-field advantage. Include Week 1 plays in the first published snapshot. A six-week league cutoff can contain teams with five games.
2. Reuse the existing event classifier, success-point curve, offense/defense eligibility, and blowout weights. Scrambles and sacks count as pass plays. Aborted scrimmage plays and the designated pre-snap penalties count on offense only. Keep special teams outside the rating. Use core play outcomes as model inputs; the supplied EPA and win probabilities are unnecessary.
3. Reset **all** estimates when the season changes. For fumbles, do a first classification pass with a fixed 0.5 recovery-loss probability. From eligible offensive fumbles in S through W, estimate the league loss rate with symmetric smoothing and pool each event class toward it using the existing 50-fumble weight. Apply this schedule to every eligible fumble regardless of its actual recovery. Use the league estimate for an unseen class and 0.5 if there are no observations. The second pass scores the snapshot. The actual recovery supplies evidence for league rates only.
4. Fit separate offensive and defensive situation baselines on the selected plays using the existing hierarchical weighted-cell smoothing. For this v1, fit the baselines on the entire closed window and score that window against them. This yields a descriptive as-of-W rating and uses Week 1 without a prior-season seed. Use the shared defensive-eligible baseline for the shared-event opponent fit as in the current implementation. Reuse `sufficient` and `snapshot` for the simultaneous opponent effects, side-specific weights, league centering and percentage units. The fixed ridge penalty of 150 stabilizes opponent estimates. Omit the research forecast’s separate team-strength shrinkage, week discount and historical margin coefficient.
5. Record team offensive efficiency O and defensive efficiency allowed D. Better offense is positive; better defense is negative. Define team scrimmage efficiency **E = O − D**, in percentage points. A snapshot at W can use games through W. A forecast of week N must read the snapshot through N−1. A rebuild at a later cutoff refits the season to that date but preserves the earlier cutoff’s values for the same source vintage.

**Completion check:** build 2026 through Week 6 with only the 2026 source and corresponding schedule/verification metadata accessible. Repeat after physically removing all subsequent games and plays. The Week 6 team values, scale, and matchup spreads must agree to numerical tolerance. Repeat on a historical season. This test must exercise raw inputs, not just filter the final ratings table.

## 2. Express PBP strength in neutral-field points

At the same cutoff obtain A, the app’s **original unrounded Point Differential ratings**, and H, its fitted home-field advantage. Reuse the website’s existing two-stage solver or call it from Node. Its first stage estimates H on non-neutral games. Its second stage includes all games with H fixed. The sibling research project already calls the app from Node in `analysis/disagreement/app_features.cjs`. Use reference values from memory or a full-precision interchange file; the one-decimal displayed standings lose precision.

Match the active franchises exactly. Convert the PBP Rams code LA to the app’s LAR and use the app’s historical display helpers. Use one equally weighted observation per team for the following statistics:

    k = standard_deviation(A) / standard_deviation(E)
    team_points[t] = k × (E[t] − mean(E))
    neutral_margin_for_A = team_points[A] − team_points[B]

Use the same standard-deviation convention on both sides. This choice puts PBP on the spread of strengths in Rob’s app; it does not fit a prediction coefficient to final margins. The app supplies the league scale, not a team-by-team blend. Recompute k each cutoff. If the reference fit fails, teams differ, a denominator is effectively zero, or values are non-finite, mark that snapshot unavailable and report the reason. Never substitute another season’s scale.

For a non-neutral matchup use the app’s H **from that snapshot**. Add H to Team A’s margin when A is home; subtract H when B is home. Reuse `matchupMargin` and check the existing schedule display’s away-team sign convention. Retain calculation precision internally and display signed points to one decimal.

**Reference check.** For the current 2026 Weeks 1–10 sources, the Point Differential column should reproduce JAX +11.8, SF +7.5, SEA +3.7 and BUF +9.2. The earlier **0.372** multiplier and **SF +14.38** PBP example came from the mixed-history prototype. The new PBP values must be derived and independently checked. At every cutoff, verify mean PBP points ≈ 0, SD(PBP points) ≈ SD(A), and identical rank order for E and PBP points when the reference scale is positive.

## 3. Publish small static assets and switch the site

Build the snapshots locally in Python with the installed dependencies. Publish only compact team summaries to the website repo. Deliver one documented rebuild command accepting source, season, last eligible week, and output directory. Allow historical backfill from 2001 and a single-season refresh. Keep raw PBP, source paths, intermediate Parquets and the Python environment off the website.

**Suggested asset contract:** a small manifest with schema/model version, season coverage, latest complete cutoff and build vintage; one versioned asset per season keyed by through-week. Each snapshot carries season, cutoff, completed-game count, a digest of the matched game slate, k, H and team rows with canonical ID, eligible games, O, D and neutral-field points. Derive rank from full precision. Use relative asset URLs compatible with the repository subpath on Pages. Preserve direct-open support advertised in the README; a per-season data script loaded on demand is one option that also works under `file://`. Publish assets before changing the manifest that references them. Document the current source cap and the refresh procedure.

| Site surface | Required behavior |
|---|---|
| Ratings controls and table | Keep **Point Differential** as the initial default. In PBP v1 use a season-to-date range. Fix the start at Week 1, including its scrubber, and explain the constraint briefly. Let the end week select any available **completed** PBP cutoff from Week 6. Restore the user’s prior valid range on switching back. Keep **Power Rating** in points. In PBP mode show **Offense (%)** and **Defense (%)** with sign tooltips. Show record, PF, PA and DIFF for the same game set. Hide the current SOS decomposition in PBP mode: subtracting DIFF from PBP points would mix two valuation methods. |
| Matchup calculator | Use the same snapshot, method, cutoff and H as the standings. Apply the selected method to both team rows and the mobile layout. Keep team aliases, historical names and venue choices working. |
| Weekly predictions | For target regular-season week N, use the selected method through N−1 regardless of the manually selected standings week. Clicking a game must synchronize the calculator. Week 6 standings can forecast Week 7; Week 10 standings can forecast Week 11 if the schedule has it. A missing Week 11 snapshot cannot produce a Week 12 projection under this rule. Preserve the existing handling of games already played. |
| Coverage and imports | Handle partial weeks, historical gaps, unsupported postseason cutoffs, failed loads and stale assets explicitly. Show the latest available PBP cutoff. Keep Point Differential available on its existing ranges. Compare the snapshot’s game slate with the active scores through its cutoff before combining records and projections. Use a canonical digest over season, week, normalized teams, scores and venue; exclude later schedule entries. A conflicting import or an unverifiable slate needs a clear PBP-unavailable state. |
| Preferences and caches | Include rating method, season, range, score-data identity and PBP asset version in the relevant result and forecast cache keys. Migrate old preferences to Point Differential. Guard asynchronous season loads so a late response cannot overwrite a newer selection. Update help text, column sorting, floating headers and accessible labels for the active method. |

## 4. Verify and report

- Run the website’s existing Node tests for the ratings model, startup, and column tooltips, and the producer’s existing Python tests. Add fixtures for the two publication boundaries, identical-team neutral margin, reversed teams and venues, 2001’s 31 teams, and franchise aliases.
- Exercise standings, calculator, weekly prediction click-through, reload, and switching methods twice on desktop and mobile. Test old local storage, a scoreboard ahead of PBP, a missing asset, a mismatched imported slate, and a season switch during loading. Verify that an unavailable forecast is never labelled as a prediction from the selected method.
- Walk forward through completed seasons: for each eligible regular-season game from Week 7 onward, compare the new PBP spread with the uncalibrated app spread on identical games and venues. Use prior-week snapshots exclusively. Report coverage, mean absolute margin error and paired differences by season, with 2026 to date separate. This evaluates the chosen units; historical outcomes are for evaluation only. Treat corrected present-day PBP as a reconstruction of past cutoffs. Make no claim of superiority without this evidence.
- Give Rob the changed files in each project, the generation and test commands, active coverage, and one worked example with source cutoff, both team ratings, neutral subtraction, venue adjustment and displayed spread. Report exceptions and a list of anything still unverified. No deployment was requested in the handoff conversation.

**First concrete task:** reproduce the existing Week 10 point-differential values and run a season-only vertical slice for 2026 Weeks 6 and 10. Prove the cutoff and scale checks before wiring the selector or generating all historical assets.
