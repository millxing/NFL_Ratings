const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const html = fs.readFileSync(path.join(__dirname, '../NFLPowerRatings.html'), 'utf8');
const context = vm.createContext({ console: { log() {}, warn() {} }, document: { getElementById: () => ({}), addEventListener() {} } });
vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)[1], context);
const { buildDesignMatrix, performOLSRegression, parseCSV } = context;
const teams = ['ARI','ATL','BAL','BUF','CAR','CHI','CIN','CLE','DAL','DEN','DET','GB','HOU','IND','JAX','KC','LAC','LAR','LV','MIA','MIN','NE','NO','NYG','NYJ','PHI','PIT','SEA','SF','TB','TEN','WAS'];
const fit = games => { const {X,y} = buildDesignMatrix(games); return performOLSRegression(X,y); };
const close = (a,b) => assert.ok(Math.abs(a-b)<1e-8, `${a} != ${b}`);
const games = [];
for (let i=0;i<32;i++) for(let j=0;j<32;j++) if(i!==j) {
    games.push({home_team:teams[i],away_team:teams[j],home_score:50+i-j+3,away_score:50,location:'Home'});
}
const baseline = fit(games);
close(baseline[0],3);
for(let i=0;i<32;i++) close(baseline[i+1]-baseline[32],i-31);
const neutral = {home_team:'ARI',away_team:'ATL',home_score:49,away_score:50,location:'Neutral'};
const exact = fit([...games,neutral]);
exact.forEach((value,i)=>close(value,baseline[i])); // Neutral margin receives no HFA subtraction.
const changed = fit([...games,{...neutral,home_score:99}]);
close(changed[0],baseline[0]); // Neutral outcomes cannot move first-stage HFA.
assert.ok(Math.abs(changed[1]-baseline[1])>0.01); // But must move team ratings.
assert.throws(()=>fit(Array(40).fill(neutral)),/non-neutral games/);
assert.throws(()=>fit(Array(40).fill(games[0])),/cannot identify/);
assert.throws(()=>fit(games.filter(game => (teams.indexOf(game.home_team) < 16) === (teams.indexOf(game.away_team) < 16))),/cannot identify/);
// Before Houston joined, the league had 31 teams. Exercise real historical games.
const historicalGames = parseCSV(fs.readFileSync(path.join(__dirname, 'fixtures/games-2001.csv'), 'utf8'));
assert.equal(historicalGames.length, 259);
assert.equal(new Set(historicalGames.map(game => `${game.gameday}:${game.home_team}:${game.away_team}`)).size, 259);
const regularSeason = historicalGames.filter(game => game.week <= 17);
assert.equal(regularSeason.length, 248);
for (const [week, count] of [[18, 0], [19, 4], [20, 4], [21, 2], [22, 1]]) {
    assert.equal(historicalGames.filter(game => game.week === week).length, count);
}
const standings = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/standings-2001.json'), 'utf8'));
for (const team of context.calculatePowerRatings(fit(regularSeason), regularSeason).ratings) {
    assert.deepEqual(standings.fields.map(field => team[field]), standings.teams[team.team], `${team.team} matches independent 2001 standings`);
    assert.equal(team.wins + team.losses + team.ties, 16);
}
const superBowl = historicalGames.find(game => game.week === 22);
assert.equal(superBowl.home_team, 'NE');
assert.equal(superBowl.away_team, 'STL');
assert.equal(superBowl.home_score, 20);
assert.equal(superBowl.away_score, 17);
assert.equal(superBowl.location, 'Neutral');
for (const season of [2001]) {
    for (const endWeek of [17, 19, 20, 21, 22]) {
        const selected = historicalGames.filter(game => game.season === season && game.week <= endWeek);
        const result = context.calculatePowerRatings(fit(selected), selected);
        assert.equal(result.ratings.length, 31);
        assert.ok(!result.ratings.some(team => team.team === 'HOU'));
        assert.ok(result.ratings.every(team => Number.isFinite(team.rating)));
        close(result.ratings.reduce((sum, team) => sum + team.rating, 0), 0);
        assert.ok(Number.isFinite(result.homeFieldAdvantage));
        assert.equal(result.ratings.reduce((sum, team) => sum + team.wins + team.ties / 2, 0), selected.length);
    }
}
// The reference team can also be absent; preserve known relative strengths.
const withoutReference = games.filter(game => game.home_team !== 'WAS' && game.away_team !== 'WAS');
const smaller = context.calculatePowerRatings(fit(withoutReference), withoutReference);
assert.equal(smaller.ratings.length, 31);
assert.ok(!smaller.ratings.some(team => team.team === 'WAS'));
close(smaller.homeFieldAdvantage, 3);
for (const team of smaller.ratings) close(team.rating, teams.indexOf(team.team) - 15);
console.log('PASS: known coefficients, neutral HFA isolation, 2001 regular-season/playoff ratings, absent reference team, insufficient data and disconnected schedule guards.');
if(process.argv[2]) {
 const sample=parseCSV(fs.readFileSync(process.argv[2],'utf8')).filter(g=>g.season===2026 && g.week<=7);
 const result=fit(sample);
 console.log(JSON.stringify({games:sample.length,nonNeutral:sample.filter(g=>g.location==='Home').length,homeFieldAdvantage:result[0]}));
 const {X,y}=buildDesignMatrix(sample);
 fs.writeFileSync('/tmp/nfl-model-check.json',JSON.stringify({X,y,result}));
}
