const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const html = fs.readFileSync(path.join(__dirname, '../NFLpowerRatings.html'), 'utf8');
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
console.log('PASS: known coefficients, zero neutral HFA, neutral outcome isolation, team rating response, insufficient data and singular schedule guards.');
if(process.argv[2]) {
 const sample=parseCSV(fs.readFileSync(process.argv[2],'utf8')).filter(g=>g.season===2026 && g.week<=7);
 const result=fit(sample);
 console.log(JSON.stringify({games:sample.length,nonNeutral:sample.filter(g=>g.location==='Home').length,homeFieldAdvantage:result[0]}));
 const {X,y}=buildDesignMatrix(sample);
 fs.writeFileSync('/tmp/nfl-model-check.json',JSON.stringify({X,y,result}));
}
