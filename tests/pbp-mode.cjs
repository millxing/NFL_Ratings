// Efficiency rating method: published assets, standings, matchups, weekly
// predictions, method switching, storage, and unavailable states.
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {harness, realPbpAssets} = require('./harness.cjs');

const csv2026 = fs.readFileSync(path.join(__dirname, 'fixtures/games-2026.csv'), 'utf8');
const csv2001 = fs.readFileSync(path.join(__dirname, 'fixtures/games-2001.csv'), 'utf8');
const header = csv2026.split('\n')[0];
// Same columns as the 2026 file: game_id,season,game_type,week,gameday,home,away,scores,location.
const csvBoth = `${csv2026.trim()}\n${csv2001.trim().split('\n').slice(1).map((line, i) => {
    const [season, type, week, day, home, away, homeScore, awayScore, location] = line.split(',');
    return [`2001_${i}`, season, type, week, day, home, away, homeScore, awayScore, location].join(',');
}).join('\n')}`;
const now = '2026-11-23T12:00:00Z';
const publishedAssets = realPbpAssets();
// The score fixture and the partial-week UI scenarios describe Monday before kickoff.
const assets = {...publishedAssets};
for (const name of ['manifest', 'season-2026']) {
    assets[`data/pbp/${name}.js`] = fs.readFileSync(path.join(__dirname, `fixtures/${name}-before-monday.js`), 'utf8');
}
const seasonFile = (year, files = assets) => {
    let data;
    vm.runInNewContext(files[`data/pbp/season-${year}.js`], {registerPbpSeason: payload => { data = payload; }});
    return data;
};
const s2026 = seasonFile(2026);
const s2001 = seasonFile(2001);
const snapshot = (data, week) => data.snapshots.find(item => item.week === week);
const points = (snap, team) => snap.teams.find(row => row.team === team).points;
const close = (a, b, message, tolerance = 1e-9) => assert.ok(Math.abs(a - b) < tolerance, `${message}: ${a} != ${b}`);
// Expected forecast, computed independently of the page: each rating times its share
// beta*n/(n+n0) for the team's games, plus the 10-season home-field advantage at a home site.
const share = (data, games) => data.calibration.shrink.pbp.beta * games / (games + data.calibration.shrink.pbp.n0);
const forecastOf = (data, snap, first, second, venue) => {
    const a = snap.teams.find(row => row.team === first);
    const b = snap.teams.find(row => row.team === second);
    const hfa = venue === 'a' ? data.calibration.forecastHfa : venue === 'b' ? -data.calibration.forecastHfa : 0;
    return share(data, a.games) * a.points - share(data, b.games) * b.points + hfa;
};
const make = (options = {}) => harness({csvText: csv2026, now, pbpAssets: assets, ...options});
const lastRender = h => h.context.renders.at(-1);

function assertSnapshotResults(h, snap, season) {
    const render = lastRender(h);
    assert.equal(render.results.method, 'pbp');
    assert.equal(render.season, String(season));
    assert.equal(render.start, '1');
    assert.equal(render.end, String(snap.week));
    assert.equal(render.gamesCount, snap.games);
    close(render.results.homeFieldAdvantage, snap.hfa, 'Snapshot HFA');
    assert.equal(render.results.ratings.length, snap.teams.length);
    assert.deepEqual(Array.from(render.results.ratings, t => t.team), Array.from(snap.teams, t => t.team), 'Rank order follows the snapshot');
    for (const row of snap.teams) {
        const team = render.results.ratings.find(t => t.team === row.team);
        close(team.rating, row.points, `${row.team} points`);
        close(team.offense, row.offense, `${row.team} offense points`);
        close(team.defense, row.defense, `${row.team} defense points`);
        close(team.specialTeams, row.specialTeams, `${row.team} special-teams points`);
        close(team.offense + team.defense + team.specialTeams, team.rating, `${row.team} offense + defense + special teams = rating`, 1e-5);
        close(team.offensePct, row.offensePct, `${row.team} offense percent`);
        assert.equal(team.rank, row.rank);
        assert.equal(team.sos, null, 'No SOS decomposition in Efficiency mode');
        assert.equal(team.wins + team.losses + team.ties, row.games, `${row.team} record uses the same games`);
    }
    const wins = render.results.ratings.reduce((sum, t) => sum + t.wins + t.ties / 2, 0);
    assert.equal(wins, snap.games);
}

(async () => {
    // Slate identity: the page's digest equals the Python producer's for every published cutoff.
    const h = make();
    await h.context.initializeV2();
    assert.equal(h.context.sha256Hex('abc'), crypto.createHash('sha256').update('abc').digest('hex'));
    // Shown Offense, Defense and Special teams add up to the shown rating in every published snapshot.
    let checked = 0;
    for (const file of Object.keys(publishedAssets).filter(name => /season-\d+\.js$/.test(name))) {
        for (const snap of seasonFile(Number(file.match(/\d{4}/)[0]), publishedAssets).snapshots.filter(item => item.available)) {
            for (const row of snap.teams) {
                const team = {rating: row.points, offense: row.offense, defense: row.defense, specialTeams: row.specialTeams};
                const shown = h.context.pbpShownParts(team);
                assert.equal(Math.round((shown.offense + shown.defense + shown.specialTeams) * 10) + 0, Math.round(Number(row.points.toFixed(1)) * 10) + 0, `${file} W${snap.week} ${row.team} sum`);
                for (const key of ['offense', 'defense', 'specialTeams']) assert.ok(Math.abs(shown[key] - row[key]) < 0.1 + 1e-9, `${file} W${snap.week} ${row.team} ${key}`);
                checked++;
            }
        }
    }
    assert.ok(checked > 12000, `Checked ${checked} team rows`);
    const sf10 = h.context.pbpShownParts({rating: 13.722996, offense: 11.679845, defense: 3.607442, specialTeams: -1.564291});
    assert.deepEqual({...sf10}, {offense: 11.7, defense: 3.6, specialTeams: -1.6}, 'SF Week 10: 11.7 + 3.6 - 1.6 = 13.7');
    // Two tenths of rounding difference: both go to different parts, each part stays within 0.1.
    const twoTenths = h.context.pbpShownParts({rating: 0.38, offense: 0.14, defense: 0.14, specialTeams: 0.1});
    assert.deepEqual({...twoTenths}, {offense: 0.2, defense: 0.1, specialTeams: 0.1});
    for (const snap of s2026.snapshots.filter(item => item.available)) {
        assert.equal(h.context.pbpSlateDigest(h.run('appState.gamesData'), 2026, snap.week), snap.slateDigest, `Week ${snap.week} slate`);
    }

    // Verify the published Week 11 snapshot against the final Monday score.
    const finalScores = csv2026.replace('2026-11-23,WAS,CIN,,,Home', '2026-11-23,WAS,CIN,22,20,Home');
    const full = make({csvText: finalScores, pbpAssets: publishedAssets, now: '2026-11-24T13:00:00Z'});
    await full.context.initializeV2();
    await full.node('method-select').change('pbp');
    await full.node('end-week-select').change('11');
    const completed = snapshot(seasonFile(2026, publishedAssets), 11);
    assert.equal(completed.slateDigest, full.context.pbpSlateDigest(full.run('appState.gamesData'), 2026, 11));
    assert.equal(completed.games, 163);
    assert.equal(full.node('end-week-select').options.find(option => option.value === '11').textContent, 'Week 11');
    assertSnapshotResults(full, completed, 2026);
    assert.equal(lastRender(full).results.note, '');

    // Point Differential stays the initial default, with the scoreboard ahead of play-by-play.
    assert.equal(h.node('method-select').value, 'pd');
    assert.deepEqual(h.node('method-select').options.map(o => [o.value, o.textContent]), [['pd', 'Opponent-adjusted Point Differential'], ['pbp', 'Opponent-adjusted Efficiency']]);
    assert.equal(h.node('end-week-select').value, '11');
    assert.equal(lastRender(h).results.method, 'pd');
    await h.node('start-week-select').change('2');
    await h.node('end-week-select').change('8');
    h.run("appState.sortColumn = 'sos'; appState.sortDirection = 'asc'");

    // Switch to Efficiency: Start Week fixed at 1; End Week limited to published cutoffs.
    await h.node('method-select').change('pbp');
    assert.equal(h.run('appState.method'), 'pbp');
    assert.deepEqual([h.run('appState.sortColumn'), h.run('appState.sortDirection')], ['rating', 'desc'], 'A method change sorts by Rating');
    assert.match(h.node('range-adjustment').textContent, /Start Week changed from Week 2 to Week 1 for Efficiency\. Point Differential returns to Week 2–Week 8 if you switch back without changing End Week\.$/);
    assert.equal(h.node('start-week-select').value, '1');
    assert.equal(h.node('start-week-select').disabled, true);
    assert.equal(h.node('start-week-scrubber').disabled, true);
    assert.equal(h.node('previous-start-week').disabled, true);
    assert.equal(h.node('next-start-week').disabled, true);
    assert.equal(h.node('end-week-select').value, '8');
    assertSnapshotResults(h, snapshot(s2026, 8), 2026);
    const enabled = h.node('end-week-select').options.filter(o => !o.disabled).map(o => o.value);
    assert.deepEqual(enabled, ['3', '4', '5', '6', '7', '8', '9', '10', '11']);
    assert.equal(h.node('end-week-select').options.find(o => o.value === '2').textContent, 'Week 2 — Not available', 'No point scale before Week 3');
    assert.equal(h.node('end-week-select').options.find(o => o.value === '11').textContent, 'Week 11 — Partial');
    assert.equal(h.node('end-week-select').options.find(o => o.value === '12').textContent, 'Week 12 — No results');
    assert.match(h.node('pbp-source').textContent, /Latest cutoff 2026 Week 11/);
    await h.node('end-week-select').change('11');
    const w11 = snapshot(s2026, 11);
    assertSnapshotResults(h, w11, 2026);
    assert.equal(w11.games, 162);
    assert.equal(lastRender(h).results.note, 'Week 11 is partial: 12 of 13 games.');
    await h.node('end-week-select').change('10');
    assertSnapshotResults(h, snapshot(s2026, 10), 2026);
    assert.equal(lastRender(h).results.note, '');
    // First publication boundary: Week 3 standings, with the early-season caution.
    await h.node('previous-week').dispatch('click');
    assert.equal(h.node('end-week-select').value, '9');
    await h.node('end-week-select').change('3');
    assertSnapshotResults(h, snapshot(s2026, 3), 2026);
    assert.equal(h.node('previous-week').disabled, true);
    await h.node('end-week-select').change('6');
    assertSnapshotResults(h, snapshot(s2026, 6), 2026);
    assert.ok(snapshot(s2026, 6).teams.some(row => row.games === 5), 'Week 6 contains teams with five games');
    await h.node('end-week-select').change('10');

    // Sorting by the part columns; all are points where higher is better.
    const sortBy = column => h.context.handleSortClick({target: {closest: () => ({getAttribute: () => column})}});
    sortBy('defense');
    assert.equal(h.run('appState.sortDirection'), 'desc');
    const byDefense = h.run('sortRatings(appState.currentRatings)');
    assert.ok(byDefense.every((t, i) => i === 0 || byDefense[i - 1].defense >= t.defense));
    sortBy('offense');
    assert.equal(h.run('appState.sortDirection'), 'desc');
    sortBy('specialTeams');
    assert.equal(h.run('appState.sortDirection'), 'desc');
    const bySpecialTeams = h.run('sortRatings(appState.currentRatings)');
    assert.ok(bySpecialTeams.every((t, i) => i === 0 || bySpecialTeams[i - 1].specialTeams >= t.specialTeams));

    // Matchup calculator: neutral subtraction, venue adjustment, identical and reversed teams.
    const w10 = snapshot(s2026, 10);
    await h.node('matchup-a').change('SF');
    await h.node('matchup-b').change('SEA');
    await h.node('matchup-venue').change('neutral');
    const neutral = forecastOf(s2026, w10, 'SF', 'SEA', 'neutral');
    assert.ok(Math.abs(neutral) < Math.abs(points(w10, 'SF') - points(w10, 'SEA')), 'The forecast counts only part of the rating gap');
    assert.equal(h.node('matchup-result').textContent, `San Francisco 49ers by ${neutral.toFixed(1)} points`);
    assert.match(h.node('matchup-detail').textContent, /^Rating gap: SF \+\d+\.\d\. The forecast counts \d+% of /);
    for (const venue of ['a', 'b']) {
        await h.node('matchup-venue').change(venue);
        const expected = forecastOf(s2026, w10, 'SF', 'SEA', venue);
        assert.equal(h.node('matchup-result').textContent, `${expected > 0 ? 'San Francisco 49ers' : 'Seattle Seahawks'} by ${Math.abs(expected).toFixed(1)} points`);
        assert.match(h.node('matchup-detail').textContent, new RegExp(`plus ${s2026.calibration.forecastHfa.toFixed(1)} points home field for ${venue === 'a' ? 'SF' : 'SEA'}\\.$`));
    }
    await h.node('matchup-venue').change('neutral');
    assert.doesNotMatch(h.node('matchup-detail').textContent, /home field/);
    const shrunk = (a, b, venue) => h.run(`forecastMargin(appState.currentRatings.find(t => t.team === '${a}'), appState.currentRatings.find(t => t.team === '${b}'), '${venue}', 'pbp', 2026).margin`);
    close(shrunk('SEA', 'SF', 'neutral'), -shrunk('SF', 'SEA', 'neutral'), 'Reversed teams forecast');
    close(shrunk('SEA', 'SF', 'b'), -shrunk('SF', 'SEA', 'a'), 'Reversed teams and venue forecast');
    close(shrunk('SF', 'SF', 'neutral'), 0, 'Identical teams forecast');
    close(h.run('forecastSettings(2026).forecastHfa'), s2026.calibration.forecastHfa, 'Manifest and season file agree');
    const margin = (a, b, venue) => h.run(`matchupMargin(appState.currentRatings.find(t => t.team === '${a}').rating, appState.currentRatings.find(t => t.team === '${b}').rating, '${venue}', appState.currentHFA)`);
    // matchupMargin itself: plain rating difference plus or minus the given home-field value.
    const gap = points(w10, 'SF') - points(w10, 'SEA');
    close(margin('SF', 'SEA', 'neutral'), gap, 'Neutral margin');
    close(margin('SF', 'SEA', 'a'), gap + w10.hfa, 'Team A home');
    close(margin('SF', 'SEA', 'b'), gap - w10.hfa, 'Team B home');
    close(margin('SEA', 'SF', 'neutral'), -gap, 'Reversed teams');
    close(margin('SEA', 'SF', 'b'), -margin('SF', 'SEA', 'a'), 'Reversed teams and venue');
    close(margin('SF', 'SF', 'neutral'), 0, 'Identical teams');
    const statsRow = h.node('matchup-stats').children[0].children;
    assert.equal(statsRow.length, 13);
    assert.equal(statsRow[3].textContent, '+11.7');
    assert.equal(statsRow[4].textContent, '+3.6');
    assert.equal(statsRow[5].textContent, '-1.6');
    assert.equal(statsRow[2].textContent, '+13.7');
    assert.equal(statsRow[5].className, 'pbp-only');
    assert.equal(statsRow[12].textContent, '', 'SOS cell is empty and hidden');
    const mobileLabels = h.node('mobile-matchup').children[0].children[1].children.map(row => row.children[0].textContent);
    assert.deepEqual(mobileLabels, ['Rank', 'Rating', 'Offense', 'Defense', 'Special teams', 'Record (W–L–T)', 'PF', 'PA', 'DIFF']);
    await h.node('matchup-b').change('SF');
    assert.equal(h.node('matchup-result').textContent, 'Choose two different teams.');
    await h.node('matchup-b').change('SEA');

    // Weekly predictions use the snapshot through N-1 regardless of the standings week.
    await h.node('end-week-select').change('8');
    h.run("location.hash = '#matchup'; showView()");
    assert.equal(h.node('schedule-week').value, '11');
    assert.match(h.node('schedule-context').textContent, /^Using 2026 Efficiency ratings through Week 10, starting at Week 1/);
    const buttons = h.node('weekly-games').children;
    assert.equal(buttons.length, 1, 'Only the unplayed Week 11 game is shown');
    const forecast11 = h.context.weeklyForecast(2026, 11);
    assert.equal(forecast11.throughWeek, 10);
    const upcoming = h.run("appState.schedule.filter(g => g.season === 2026 && g.week === 11 && g.home_score === null).sort((a, b) => a.gameday.localeCompare(b.gameday))");
    upcoming.forEach((game, i) => {
        const prediction = h.context.schedulePrediction(game, forecast11);
        const away = h.context.normalizeTeamAbbr(game.away_team);
        const home = h.context.normalizeTeamAbbr(game.home_team);
        const expected = forecastOf(s2026, w10, away, home, game.location === 'Neutral' ? 'neutral' : 'b');
        close(prediction.margin, expected, `${away} at ${home}`);
        assert.equal(buttons[i].children[2].textContent, prediction.text);
        assert.equal(buttons[i].title, prediction.detail);
    });
    const neutralGame = h.context.schedulePrediction({away_team: 'MIN', home_team: 'SF', location: 'Neutral'}, forecast11);
    close(neutralGame.margin, forecastOf(s2026, w10, 'MIN', 'SF', 'neutral'), 'Neutral-site prediction has no home advantage');
    // Second publication boundary: Week 4 is the first forecast; Week 3 has none.
    const forecast4 = h.context.weeklyForecast(2026, 4);
    assert.equal(forecast4.throughWeek, 3);
    close(forecast4.results.ratings.find(t => t.team === 'SF').rating, points(snapshot(s2026, 3), 'SF'), 'Week 4 forecast uses Week 3');
    assert.match(h.context.weeklyForecast(2026, 3).error, /start in Week 4, after ratings through Week 3/);
    assert.match(h.context.weeklyForecast(2026, 19).error, /regular-season weeks only/);
    // Week 12 uses the partial Week 11 snapshot.
    await h.node('schedule-week').change('12');
    assert.match(h.node('schedule-context').textContent, /^Using 2026 Efficiency ratings through Week 11, starting at Week 1/);
    const forecast12 = h.context.weeklyForecast(2026, 12);
    const game12 = h.run("appState.schedule.find(g => g.season === 2026 && g.week === 12 && g.location === 'Home')");
    const home12 = h.context.normalizeTeamAbbr(game12.home_team);
    const away12 = h.context.normalizeTeamAbbr(game12.away_team);
    close(h.context.schedulePrediction(game12, forecast12).margin, forecastOf(s2026, w11, away12, home12, 'b'), 'Week 12 uses Week 11');
    // No Week 12 snapshot: Week 13 has no projection.
    await h.node('schedule-week').change('13');
    assert.match(h.node('schedule-context').textContent, /^Efficiency predictions unavailable: Week 13 needs ratings through Week 12, but Efficiency data currently ends at Week 11\./);
    assert.ok(h.node('weekly-games').children.length > 0);
    assert.ok(h.node('weekly-games').children.every(b => b.disabled && b.children[2].textContent === 'Prediction unavailable'));
    // Clicking a prediction synchronizes the calculator with the same snapshot.
    await h.node('schedule-week').change('11');
    const target = h.node('weekly-games').children.find(b => /Cincinnati/.test(b.children[1].textContent));
    await target.dispatch('click');
    assert.equal(h.node('matchup-a').value, 'CIN');
    assert.equal(h.node('matchup-b').value, 'WAS');
    assert.equal(h.node('matchup-venue').value, 'b');
    assert.equal(h.node('end-week-select').value, '10');
    assertSnapshotResults(h, w10, 2026);
    h.run('updateMatchup()'); // The real renderResultsTable does this; the harness replaces rendering.
    assert.equal(h.node('matchup-result').textContent, target.children[2].textContent);
    h.run("location.hash = ''; showView()");

    // Switch back: End Week stays where the user put it (Week 10); the forced Start Week returns to Week 2.
    await h.node('method-select').change('pd');
    assert.equal(h.node('start-week-select').value, '2');
    assert.equal(h.node('end-week-select').value, '10');
    assert.equal(h.node('start-week-select').disabled, false);
    assert.equal(lastRender(h).results.method, 'pd');
    assert.equal(lastRender(h).gamesCount, 134);
    assert.equal(h.node('range-adjustment').textContent, '');
    assert.equal(h.run('appState.sortColumn'), 'rating', 'A method change sorts by Rating');
    await h.node('method-select').change('pbp');
    assertSnapshotResults(h, snapshot(s2026, 10), 2026);
    assert.equal(h.run('appState.sortColumn'), 'rating', 'A method change sorts by Rating');
    await h.node('method-select').change('pd');
    assert.deepEqual([h.node('start-week-select').value, h.node('end-week-select').value], ['2', '10']);
    await h.node('method-select').change('pbp');
    assert.equal(h.node('end-week-select').value, '10');

    // A returning Efficiency user gets the latest scored week, even ahead of the Efficiency data.
    await h.node('end-week-select').change('7');
    const nextWeek = finalScores.replace('2026-11-25,LA,GB,,,Home', '2026-11-25,LA,GB,24,21,Home');
    const reopened = make({csvText: nextWeek, now: '2026-11-27T12:00:00Z', storage: new Map(h.storage)});
    await reopened.context.initializeV2();
    assert.deepEqual([reopened.node('method-select').value, reopened.node('season-select').value, reopened.node('start-week-select').value, reopened.node('end-week-select').value], ['pd', '2026', '1', '12']);
    assert.equal(lastRender(reopened).results.method, 'pd');
    assert.equal(lastRender(reopened).gamesCount, 164);

    // A saved Efficiency table for the exact same range must also reopen as Point Differential.
    await h.node('end-week-select').change('11');
    const reloaded = make({storage: new Map(h.storage)});
    await reloaded.context.initializeV2();
    assert.equal(lastRender(reloaded).results.method, 'pd');
    assert.equal(lastRender(reloaded).end, '11');
    // A Point Differential visit with another season and range also reopens on 2026 Weeks 1-11.
    const pdVisit = make({csvText: csvBoth, storage: new Map([['nfl-ratings-v3-preferences', JSON.stringify({season: '2001', method: 'pd', start: '3', end: '8', teamA: 'SF', teamB: 'SEA', venue: 'neutral'})]])});
    await pdVisit.context.initializeV2();
    assert.deepEqual([pdVisit.node('method-select').value, pdVisit.node('season-select').value, pdVisit.node('start-week-select').value, pdVisit.node('end-week-select').value], ['pd', '2026', '1', '11']);
    assert.equal(lastRender(pdVisit).gamesCount, 162);
    assert.deepEqual([pdVisit.node('matchup-a').value, pdVisit.node('matchup-b').value], ['SF', 'SEA'], 'Matchup teams are remembered');

    // Same season and weeks across methods; only forced changes are undone. The sort resets to Rating.
    const keep = make();
    await keep.context.initializeV2();
    const sortKeep = column => keep.context.handleSortClick({target: {closest: () => ({getAttribute: () => column})}});
    sortKeep('wins');
    sortKeep('wins');
    assert.deepEqual([keep.run('appState.sortColumn'), keep.run('appState.sortDirection')], ['wins', 'asc']);
    await keep.node('end-week-select').change('9');
    await keep.node('method-select').change('pbp');
    assert.deepEqual([keep.node('season-select').value, keep.node('start-week-select').value, keep.node('end-week-select').value], ['2026', '1', '9']);
    assert.deepEqual([keep.run('appState.sortColumn'), keep.run('appState.sortDirection')], ['rating', 'desc'], 'A method change sorts by Rating');
    assert.equal(keep.node('range-adjustment').textContent, '', 'Nothing was forced, so no note');
    await keep.node('method-select').change('pd');
    assert.deepEqual([keep.node('start-week-select').value, keep.node('end-week-select').value], ['1', '9']);
    assert.deepEqual([keep.run('appState.sortColumn'), keep.run('appState.sortDirection')], ['rating', 'desc']);
    // An End Week without Efficiency ratings moves, says so, and comes back.
    sortKeep('sos');
    await keep.node('end-week-select').change('2');
    await keep.node('method-select').change('pbp');
    assert.equal(keep.node('end-week-select').value, '3');
    assertSnapshotResults(keep, snapshot(s2026, 3), 2026);
    assert.match(keep.node('range-adjustment').textContent, /End Week changed from Week 2 to Week 3: Week 2 has no Efficiency ratings\. Point Differential returns to Week 1–Week 2/);
    await keep.node('method-select').change('pd');
    assert.deepEqual([keep.node('start-week-select').value, keep.node('end-week-select').value], ['1', '2']);
    assert.deepEqual([keep.run('appState.sortColumn'), keep.run('appState.sortDirection')], ['rating', 'desc']);
    // A user change in Efficiency clears the note; the new End Week carries over.
    await keep.node('method-select').change('pbp');
    await keep.node('end-week-select').change('7');
    assert.equal(keep.node('range-adjustment').textContent, '');
    await keep.node('method-select').change('pd');
    assert.deepEqual([keep.node('start-week-select').value, keep.node('end-week-select').value], ['1', '7']);
    // A rebuilt asset (new build id) invalidates saved Efficiency results.
    const rebuilt = {...assets, 'data/pbp/manifest.js': assets['data/pbp/manifest.js'].replaceAll(s2026.build, 'new-build'),
        'data/pbp/season-2026.js': assets['data/pbp/season-2026.js'].replaceAll(s2026.build, 'new-build')};
    const afterRebuild = make({storage: new Map(h.storage), pbpAssets: rebuilt});
    await afterRebuild.context.initializeV2();
    await afterRebuild.node('method-select').change('pbp');
    assert.ok(afterRebuild.context.pbpLoads.some(url => url.includes('season-2026.js?v=new-build')));
    assertSnapshotResults(afterRebuild, w11, 2026);

    // Preferences and saved results from earlier versions migrate to Point Differential.
    const legacyStorage = new Map([
        ['nfl-ratings-v3-preferences', JSON.stringify({season: '2026', start: '1', end: '9', teamA: 'SF', teamB: 'SEA', venue: 'neutral'})],
        ['nfl-ratings-v3-ratings', JSON.stringify({version: 2, dataKey: 'old', season: '2026', start: '1', end: '9', gamesCount: 136, results: {homeFieldAdvantage: 1, ratings: []}})],
    ]);
    const legacy = make({storage: legacyStorage});
    await legacy.context.initializeV2();
    assert.equal(legacy.node('method-select').value, 'pd');
    assert.equal(lastRender(legacy).results.method, 'pd');
    assert.equal(lastRender(legacy).end, '11', 'Opens on the latest week, not the saved one');
    assert.ok(legacy.context.solverCalls > 0);

    // Missing season file: explicit unavailable state; Point Differential still works.
    const missing = make({pbpAssets: {...assets, 'data/pbp/season-2026.js': null}});
    await missing.context.initializeV2();
    await missing.node('method-select').change('pbp');
    assert.match(missing.node('status-message').textContent, /^Efficiency ratings unavailable\. Efficiency data for 2026 could not be loaded \(file could not be loaded\)\./);
    assert.equal(missing.run('appState.currentRatings.length'), 0);
    missing.run("location.hash = '#matchup'; showView()");
    assert.match(missing.node('schedule-context').textContent, /^Efficiency predictions unavailable: Efficiency data for 2026 could not be loaded/);
    assert.ok(missing.node('weekly-games').children.every(b => b.disabled && b.children[2].textContent === 'Prediction unavailable'));
    missing.run("location.hash = ''; showView()");
    await missing.node('method-select').change('pd');
    assert.equal(lastRender(missing).results.method, 'pd');
    assert.equal(missing.node('status-message').textContent, '');
    // Missing data index.
    const noIndex = make({pbpAssets: {}});
    await noIndex.context.initializeV2();
    await noIndex.node('method-select').change('pbp');
    assert.match(noIndex.node('status-message').textContent, /The Efficiency data index could not be loaded/);
    // Without the index there are no forecast settings: no unshrunk number is shown as a forecast.
    await noIndex.node('method-select').change('pd');
    noIndex.run('updateMatchup()');
    assert.equal(noIndex.node('matchup-result').textContent, 'Forecast unavailable: the forecast settings could not be loaded.');
    assert.equal(noIndex.node('matchup-detail').textContent, '');
    // Stale season file: its build differs from the index.
    const stale = make({pbpAssets: {...assets, 'data/pbp/season-2026.js': assets['data/pbp/season-2026.js'].replaceAll(s2026.build, 'older-build')}});
    await stale.context.initializeV2();
    await stale.node('method-select').change('pbp');
    assert.match(stale.node('status-message').textContent, /does not match the data index; reload the page/);
    assert.equal(stale.run('appState.currentRatings.length'), 0);

    // An imported file whose scores differ from the play-by-play slate is not combined.
    const changedCSV = csv2026.replace('2026_03_BAL_DAL,2026,REG,3,2026-09-27,DAL,BAL,31,34', '2026_03_BAL_DAL,2026,REG,3,2026-09-27,DAL,BAL,31,35');
    assert.notEqual(changedCSV, csv2026);
    const imported = make();
    await imported.context.initializeV2();
    await imported.node('method-select').change('pbp');
    assertSnapshotResults(imported, w11, 2026);
    await imported.context.handleFileUpload({target: {files: [{name: 'games.csv', text: async () => changedCSV}]}});
    assert.match(imported.node('status-message').textContent, /\(162 games\) do not match the play-by-play game slate \(162 games\)/);
    assert.equal(imported.run('appState.currentRatings.length'), 0);
    assert.match(imported.context.weeklyForecast(2026, 11).error, /do not match the play-by-play game slate \(150 games\)/);
    const fewer = csv2026.split('\n').filter(line => !line.startsWith('2026_02_')).join('\n');
    await imported.context.handleFileUpload({target: {files: [{name: 'fewer.csv', text: async () => fewer}]}});
    assert.match(imported.node('status-message').textContent, /\(146 games\) do not match the play-by-play game slate \(162 games\)/);

    // Partial week, scores ahead of the play-by-play file: Monday night finished
    // after the update. Ratings stay on the 162 play-by-play games and say so.
    const monday = csv2026.replace('2026_11_CIN_WAS,2026,REG,11,2026-11-23,WAS,CIN,,,Home', '2026_11_CIN_WAS,2026,REG,11,2026-11-23,WAS,CIN,20,27,Home');
    assert.notEqual(monday, csv2026);
    const ahead = make({csvText: monday, now: '2026-11-24T12:00:00Z'});
    await ahead.context.initializeV2();
    await ahead.node('method-select').change('pbp');
    assertSnapshotResults(ahead, w11, 2026);
    assert.equal(lastRender(ahead).results.note, 'Week 11 Efficiency ratings include 12 completed games. Not yet included: Cincinnati Bengals at Washington Commanders.');
    assert.equal(ahead.run("appState.currentRatings.find(t => t.team === 'CIN').wins + appState.currentRatings.find(t => t.team === 'CIN').losses"), 9, 'Records leave out the game the ratings do not include');
    close(ahead.context.weeklyForecast(2026, 12).results.ratings.find(t => t.team === 'SF').rating, points(w11, 'SF'), 'Week 12 still uses Week 11');
    // The extra game must be the only difference: a changed included score is refused.
    const aheadChanged = monday.replace('2026_11_TEN_DAL,2026,REG,11,2026-11-22,DAL,TEN,51,30', '2026_11_TEN_DAL,2026,REG,11,2026-11-22,DAL,TEN,51,31');
    await ahead.context.handleFileUpload({target: {files: [{name: 'changed.csv', text: async () => aheadChanged}]}});
    assert.match(ahead.node('status-message').textContent, /\(163 games\) do not match the play-by-play game slate \(162 games\)/);
    // An earlier-week difference is refused too.
    await ahead.context.handleFileUpload({target: {files: [{name: 'earlier.csv', text: async () => monday.replace('2026_03_BAL_DAL,2026,REG,3,2026-09-27,DAL,BAL,31,34', '2026_03_BAL_DAL,2026,REG,3,2026-09-27,DAL,BAL,31,35')}]}});
    assert.match(ahead.node('status-message').textContent, /do not match the play-by-play game slate/);
    // Scores behind the play-by-play file: Week 11 is refused, Week 10 still works.
    const behind = csv2026.replace('2026_11_MIN_SF,2026,REG,11,2026-11-22,SF,MIN,35,10,Neutral', '2026_11_MIN_SF,2026,REG,11,2026-11-22,SF,MIN,,,Neutral');
    await ahead.context.handleFileUpload({target: {files: [{name: 'behind.csv', text: async () => behind}]}});
    assert.match(ahead.node('status-message').textContent, /\(161 games\) do not match the play-by-play game slate \(162 games\)/);
    await ahead.node('end-week-select').change('10');
    assertSnapshotResults(ahead, w10, 2026);

    // Season switch during loading: a late response cannot overwrite the newer selection.
    let release;
    const gate = new Promise(resolve => { release = resolve; });
    const race = make({csvText: csvBoth, pbpGate: url => (url.includes('season-2001') ? gate : null)});
    await race.context.initializeV2();
    await race.node('method-select').change('pbp');
    assertSnapshotResults(race, w11, 2026);
    const rendersBefore = race.context.renders.length;
    const slow = race.node('season-select').change('2001');
    await new Promise(resolve => setTimeout(resolve, 200));
    await race.node('season-select').change('2026');
    release();
    await slow;
    assert.equal(race.context.renders.length, rendersBefore + 1);
    assertSnapshotResults(race, w11, 2026);
    assert.equal(race.node('status-message').textContent, '');

    // 2001: 31 teams, historical names, and franchise aliases in Efficiency mode.
    await race.node('season-select').change('2001');
    const w17 = snapshot(s2001, 17);
    assertSnapshotResults(race, w17, 2001);
    const teams2001 = lastRender(race).results.ratings;
    assert.equal(teams2001.length, 31);
    assert.ok(!teams2001.some(t => t.team === 'HOU'));
    for (const [team, name, abbr] of [['LAR', 'St. Louis Rams', 'STL'], ['LAC', 'San Diego Chargers', 'SD'], ['LV', 'Oakland Raiders', 'OAK'], ['WAS', 'Washington Redskins', 'WAS']]) {
        assert.equal(teams2001.find(t => t.team === team).teamName, name);
        assert.equal(race.context.teamAbbrForSeason(team, 2001), abbr);
    }
    await race.node('matchup-a').change('LAR');
    await race.node('matchup-b').change('LV');
    await race.node('matchup-venue').change('a');
    const ramsRaiders = forecastOf(s2001, w17, 'LAR', 'LV', 'a');
    assert.deepEqual(Array.from(s2001.calibration.trainingSeasons), [1999, 2000]);
    assert.equal(race.node('matchup-result').textContent, `${ramsRaiders > 0 ? 'St. Louis Rams' : 'Oakland Raiders'} by ${Math.abs(ramsRaiders).toFixed(1)} points`);
    const forecast2001 = race.context.weeklyForecast(2001, 10);
    assert.equal(forecast2001.throughWeek, 9);
    assert.equal(forecast2001.results.ratings.length, 31);
    assert.equal(race.context.schedulePrediction({away_team: 'STL', home_team: 'OAK', location: 'Home'}, forecast2001).away, 'LAR', 'Historical codes resolve to franchises');

    console.log('PASS: Efficiency slate digests, offense + defense + special teams = rating, shrunk forecasts with the 10-season HFA, default method, fixed Week 1 start, published cutoffs, Week 3/Week 4 boundaries, partial Week 11 (scores ahead and behind), matchups and venues, N-1 weekly predictions and click-through, method switching, reload, legacy storage, missing/stale assets, mismatched imports, season-switch race, and 2001 franchises.');
})().catch(error => { console.error(error); process.exitCode = 1; });
