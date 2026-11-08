const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const html = fs.readFileSync(require('node:path').join(__dirname, '../NFLPowerRatings.html'), 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
const teams = ['ARI','ATL','BAL','BUF','CAR','CHI','CIN','CLE','DAL','DEN','DET','GB','HOU','IND','JAX','KC','LAC','LAR','LV','MIA','MIN','NE','NO','NYG','NYJ','PHI','PIT','SEA','SF','TB','TEN','WAS'];
const header = 'game_id,season,week,gameday,home_team,away_team,home_score,away_score,location';
const lines = [header];
const rotation = [...teams];
for (let week = 1; week <= 10; week++) {
    for (let i = 0; i < 16; i++) {
        const scored = week <= 8 || (week === 9 && i === 0);
        lines.push([`2025_${week}_${i}`,2025,week,'2025-01-01',rotation[i],rotation[31-i],scored ? 20 + (i*3+week)%17 : '',scored ? 14 + (i+week*3)%19 : '', 'Home'].join(','));
    }
    rotation.splice(1,0,rotation.pop());
}
// An upcoming season must not inherit the previous season's available weeks.
lines.push('2026_1_0,2026,1,2099-01-01,ARI,ATL,,,Home');
const csv = lines.join('\n');

function harness({ fail = false, storage = new Map(), csvText = csv } = {}) {
    const network = {fail,csvText};
    class Node {
        constructor(tag = '') { this.tag = tag; this.options = []; this.children = []; this.listeners = {}; this.attributes = {}; this.style = {}; this.textContent = ''; this.className = ''; this._value = ''; this.disabled = false; }
        get value() { return this.tag === 'select' ? (this.options.find(o => o.value === this._value)?.value ?? this.options[0]?.value ?? '') : this._value; }
        set value(v) { this._value = String(v); }
        set selectedIndex(i) { this.value = this.options[i]?.value ?? ''; }
        set innerHTML(value) { this.children = []; this.options = []; }
        appendChild(child) { this.children.push(child); if (this.tag === 'select') { this.options.push(child); if (child.selected) this.value = child.value; } return child; }
        add(option) { this.appendChild(option); }
        append(...children) { children.forEach(child => this.appendChild(child)); }
        replaceChildren(...children) { this.children = []; this.options = []; this.append(...children); }
        scrollIntoView() {}
        addEventListener(type, fn) { (this.listeners[type] ??= []).push(fn); }
        async dispatch(type) { await Promise.all((this.listeners[type] ?? []).map(fn => fn({target:this}))); }
        async change(value) { this.value = value; await this.dispatch('change'); }
        setAttribute(key,value) { this.attributes[key] = String(value); }
        getAttribute(key) { return this.attributes[key]; }
        removeAttribute(key) { delete this.attributes[key]; }
        get classList() { const node = this; return {add(...names) { node.className = [...new Set([...node.className.split(' ').filter(Boolean),...names])].join(' '); }, remove(...names) { node.className = node.className.split(' ').filter(v => !names.includes(v)).join(' '); }}; }
    }
    const nodes = new Map();
    const selects = ['season-select','start-week-select','end-week-select','matchup-a','matchup-b','matchup-venue','schedule-week'];
    const node = id => { if (!nodes.has(id)) nodes.set(id,new Node(selects.includes(id) ? 'select' : '')); return nodes.get(id); };
    const options = ['neutral','a','b'];
    options.forEach(value => { const option = new Node(); option.value = value; node('matchup-venue').add(option); });
    const context = vm.createContext({
        document: { getElementById: node, addEventListener() {}, createElement: tag => new Node(tag), querySelector: node },
        window: {addEventListener() {}}, location: {hash:''},
        Option: function(text,value) { this.textContent = text; this.value = String(value); },
        localStorage: {getItem:key=>storage.get(key)??null,setItem:(key,value)=>storage.set(key,value)},
        fetch: async () => { if (network.fail) throw new Error('offline'); return {ok:true,text:async()=>network.csvText}; },
        Date: class extends Date { constructor(...args) { super(...(args.length ? args : ['2025-11-07T12:00:00Z'])); } },
        AbortSignal, setTimeout, console: {log(){},warn(){},error(){}}, renders: [], solverCalls: 0,
    });
    vm.runInContext(script,context);
    // Exercise real loading, parsing, filter handlers, storage, availability and regression.
    // Rendering layout and browser scrolling are outside this unit harness.
    vm.runInContext(`
        const actualSolver = performOLSRegression;
        performOLSRegression = (...args) => { solverCalls++; return actualSolver(...args); };
        initializeFloatingHeader = () => {};
        syncFloatingHeader = () => {};
        renderResultsTable = (results, gamesCount) => {
            appState.currentRatings = results.ratings;
            appState.currentHFA = results.homeFieldAdvantage;
            renders.push({season:elements.seasonSelect.value,start:elements.startWeekSelect.value,end:elements.endWeekSelect.value,gamesCount,results});
            elements.resultsSection.classList.add('results-section--visible');
            writeStored('ratings', {version:1,dataKey:ratingsDataKey(),season:elements.seasonSelect.value,start:elements.startWeekSelect.value,end:elements.endWeekSelect.value,results,gamesCount,movement:[...movement]});
        };
    `,context);
    return {context,node,storage,network,run:code=>vm.runInContext(code,context)};
}

(async () => {
    const currentCSV = lines.filter(line => !line.startsWith('2026_')).join('\n');
    const firstVisit = harness({csvText:currentCSV});
    await firstVisit.context.initializeV2();
    assert.equal(firstVisit.context.renders.length,1,'Fresh visit calculates automatically');
    assert.equal(firstVisit.context.renders[0].gamesCount,129);
    assert.equal(firstVisit.node('end-week-select').value,'9');
    assert.equal(firstVisit.node('end-week-select').options.find(o=>o.value==='9').textContent,'Week 9 — Partial');
    const historical = harness({csvText:currentCSV.replaceAll('2025','2024')});
    await historical.context.initializeV2();
    assert.equal(historical.node('end-week-select').options.find(o=>o.value==='9').textContent,'Week 9');
    assert.doesNotMatch(historical.node('week-availability').textContent,/Complete|Partial/);
    assert.equal(historical.node('end-week-select').options.find(o=>o.value==='10').textContent,'Week 10 — No results');
    const h = harness();
    await h.context.initializeV2();
    // Newest scheduled season has no results; it must clearly say so.
    assert.match(h.node('week-availability').textContent,/2026: no results available/);
    assert.equal(h.node('end-week-select').disabled,true);
    await h.node('season-select').change('2025');
    assert.equal(h.node('end-week-select').value,'9');
    assert.equal(h.context.renders.at(-1).gamesCount,129);
    assert.equal(h.context.renders.at(-1).results.ratings.length,32);
    assert.match(h.node('week-availability').textContent,/Week 9 · Partial · 1 of 16 games recorded/);
    assert.equal(h.node('end-week-select').options.find(o=>o.value==='8').textContent,'Week 8');
    assert.equal(h.node('end-week-select').options.find(o=>o.value==='10').disabled,true);
    assert.match(h.node('data-freshness').textContent,/^Data checked/);
    assert.equal(h.node('status-message').textContent,'');

    await h.node('end-week-select').change('8');
    assert.equal(h.context.renders.at(-1).gamesCount,128);
    assert.match(h.node('week-availability').textContent,/Selected end: Week 8 · 16 of 16 games recorded/);
    await h.node('start-week-select').change('2');
    assert.equal(h.context.renders.at(-1).gamesCount,112);
    const before = h.context.renders.length;
    const slow = h.node('end-week-select').change('7');
    const latest = h.node('end-week-select').change('6');
    await Promise.all([slow,latest]);
    assert.equal(h.context.renders.length,before+1,'Only the latest rapid filter change renders');
    assert.equal(h.context.renders.at(-1).end,'6');
    assert.equal(h.context.renders.at(-1).gamesCount,80);
    await h.node('start-week-select').change('9');
    assert.match(h.node('range-adjustment').textContent,/End week moved to Week 9/);
    assert.match(h.node('status-message').textContent,/Only 1 recorded game/);
    assert.equal(h.run('appState.currentRatings.length'),0,'Insufficient range clears stale results');
    assert.equal(h.node('results-section').getAttribute('aria-busy'),'false');
    await h.node('start-week-select').change('1');
    assert.equal(h.node('status-message').textContent,'');
    assert.equal(h.context.renders.at(-1).gamesCount,129);

    const restored = harness({storage:h.storage});
    await restored.context.initializeV2();
    assert.equal(restored.context.renders.length,1);
    assert.equal(restored.context.solverCalls,0,'Valid saved ratings skip recomputation');
    assert.equal(restored.context.renders[0].gamesCount,129);
    assert.match(restored.node('week-availability').textContent,/Partial/);

    const newerCSV = csv.split('\n').map(line => {
        if (!line.startsWith('2025_9_1,')) return line;
        const fields = line.split(','); fields[6]='21'; fields[7]='14'; return fields.join(',');
    }).join('\n');
    const changed = harness({storage:new Map(h.storage),csvText:newerCSV});
    await changed.context.initializeV2();
    assert.equal(changed.context.renders[0].gamesCount,130,'Changed source invalidates saved ratings');
    assert.ok(changed.context.solverCalls > 0);
    firstVisit.network.csvText = newerCSV;
    await firstVisit.node('refresh-data').onclick();
    assert.equal(firstVisit.context.renders.at(-1).gamesCount,130,'Refresh recalculates automatically');
    assert.match(firstVisit.node('week-availability').textContent,/2 of 16 games recorded/);

    const offline = harness({fail:true,storage:h.storage});
    await offline.context.initializeV2();
    assert.match(offline.node('data-freshness').textContent,/Cached data · Last successful check/);
    assert.match(offline.node('week-availability').textContent,/Partial · 1 of 16/);
    assert.equal(offline.context.renders.at(-1).gamesCount,129);

    const failed = harness({fail:true});
    await failed.context.initializeV2();
    assert.equal(failed.context.renders.length,0);
    assert.match(failed.node('status-message').textContent,/Unable to load game data/);
    assert.equal(failed.node('season-select').disabled,true);
    await failed.context.handleFileUpload({target:{files:[{name:'games.csv',text:async()=>csv}]}});
    await failed.node('season-select').change('2025');
    assert.equal(failed.context.renders.at(-1).gamesCount,129);
    assert.match(failed.node('week-availability').textContent,/Completeness unknown · 1 game recorded/);
    assert.equal(failed.node('season-select').disabled,false);
    assert.equal(failed.node('end-week-select').options.find(o=>o.value==='10').disabled,true);
    const importRenders = failed.context.renders.length;
    await failed.context.handleFileUpload({target:{files:[{name:'bad.csv',text:async()=> 'bad\ndata'}]}});
    assert.equal(failed.context.renders.length,importRenders);
    assert.match(failed.node('status-message').textContent,/Error loading file/);
    assert.equal(failed.run('appState.currentRatings.length'),32,'Rejected imports preserve existing results');

    const scrub = harness({csvText:currentCSV});
    await scrub.context.initializeV2();
    assert.equal(scrub.node('end-week-scrubber').value,'8');
    assert.equal(scrub.node('end-week-scrubber').max,'8');
    assert.match(scrub.node('week-scrubber-label').textContent,/Through Week 9 — Partial/);
    assert.equal(scrub.node('next-week').disabled,true);
    await scrub.node('previous-week').dispatch('click');
    assert.equal(scrub.node('end-week-select').value,'8');
    assert.equal(scrub.context.renders.at(-1).gamesCount,128);
    assert.equal(scrub.node('end-week-scrubber').value,'7');
    assert.equal(scrub.node('next-week').disabled,false);
    scrub.run("appState.sortColumn = 'team'; appState.sortDirection = 'asc'");
    scrub.node('end-week-scrubber').value = '5';
    await scrub.node('end-week-scrubber').dispatch('input');
    assert.equal(scrub.node('end-week-select').value,'6');
    assert.equal(scrub.node('start-week-select').value,'1');
    assert.equal(scrub.context.renders.at(-1).gamesCount,96);
    assert.equal(scrub.run('appState.sortColumn'),'team');
    assert.equal(scrub.run("readStored('preferences').end"),'6');
    await scrub.node('end-week-select').change('7');
    assert.equal(scrub.node('end-week-scrubber').value,'6','Dropdown updates slider');
    await scrub.node('start-week-select').change('3');
    assert.equal(scrub.node('end-week-scrubber').max,'6','Start week constrains scrub range');
    scrub.node('end-week-scrubber').value = '0';
    await scrub.node('end-week-scrubber').dispatch('input');
    assert.equal(scrub.node('end-week-select').value,'3');
    assert.equal(scrub.node('previous-week').disabled,true);
    assert.match(scrub.node('status-message').textContent,/Only 16 recorded games/);
    assert.equal(scrub.run('appState.currentRatings.length'),0);
    await scrub.node('next-week').dispatch('click');
    assert.equal(scrub.context.renders.at(-1).gamesCount,32);
    const pendingChange = scrub.node('end-week-select').change('8');
    await scrub.node('previous-week').dispatch('click');
    await pendingChange;
    assert.equal(scrub.context.renders.at(-1).end,'7','Scrubbing cancels an older delayed calculation');
    const gaps = harness({csvText:currentCSV.split('\n').filter(line => !line.startsWith('2025_5_')).join('\n')});
    await gaps.context.initializeV2();
    await gaps.node('end-week-select').change('6');
    await gaps.node('previous-week').dispatch('click');
    assert.equal(gaps.node('end-week-select').value,'4','Scrubbing skips weeks without results');
    await gaps.node('next-week').dispatch('click');
    assert.equal(gaps.node('end-week-select').value,'6');
    gaps.run('setDataLoading(true)');
    assert.equal(gaps.node('end-week-scrubber').disabled,true);
    assert.equal(gaps.node('previous-week').disabled,true);
    assert.equal(gaps.node('next-week').disabled,true);
    await h.node('season-select').change('2026');
    assert.equal(h.node('end-week-scrubber').disabled,true);
    assert.equal(h.node('previous-week').disabled,true);
    assert.equal(h.node('next-week').disabled,true);
    assert.equal(h.node('week-scrubber-label').textContent,'Through week —');

    const weekly = harness({csvText:currentCSV});
    await weekly.context.initializeV2();
    weekly.run("location.hash = '#matchup'; showView()");
    assert.equal(weekly.node('schedule-week').value,'9','Default to current partially played week');
    assert.equal(weekly.node('weekly-games').children.length,15,'Completed game is excluded from the partially played week');
    assert.match(weekly.node('schedule-context').textContent,/ratings through Week 8/);
    assert.match(weekly.node('schedule-context').textContent,/Selected-week results are excluded/);
    assert.ok(weekly.node('weekly-games').children.every(button => !button.children[0].textContent.includes('Completed')));
    const forecast = weekly.context.weeklyForecast(2025,9);
    assert.equal(forecast.throughWeek,8);
    const initialForecast = JSON.stringify(forecast.results);
    weekly.run("appState.gamesData = appState.gamesData.map(game => game.week === 9 ? {...game, home_score:99, away_score:0} : game)");
    assert.equal(JSON.stringify(weekly.context.weeklyForecast(2025,9).results),initialForecast,'Selected week scores cannot affect its predictions');
    const game = weekly.run('appState.schedule.find(game => game.week === 9)');
    const homePrediction = weekly.context.schedulePrediction({...game,location:'Home'},forecast);
    const neutralPrediction = weekly.context.schedulePrediction({...game,location:'Neutral'},forecast);
    assert.ok(Math.abs(neutralPrediction.margin - homePrediction.margin - forecast.results.homeFieldAdvantage) < 1e-8,'Neutral sites exclude HFA');
    await weekly.node('schedule-week').change('6');
    assert.match(weekly.node('schedule-context').textContent,/No unplayed games remaining/);
    assert.equal(weekly.node('weekly-games').children.length,0);
    await weekly.node('schedule-week').change('10');
    const scheduledGame = weekly.run('appState.schedule.find(game => game.week === 10)');
    await weekly.node('weekly-games').children[0].dispatch('click');
    assert.equal(weekly.node('matchup-a').value,scheduledGame.away_team);
    assert.equal(weekly.node('matchup-b').value,scheduledGame.home_team);
    assert.equal(weekly.node('matchup-venue').value,'b');
    assert.equal(weekly.node('start-week-select').value,'1');
    assert.equal(weekly.node('end-week-select').value,'9');
    assert.equal(weekly.context.renders.at(-1).gamesCount,129);
    weekly.run('appState.schedule = appState.schedule.map(game => game.week === 1 ? {...game, home_score:null, away_score:null} : game)');
    await weekly.node('schedule-week').change('1');
    assert.match(weekly.node('schedule-context').textContent,/Predictions unavailable: Not enough earlier games/);
    assert.ok(weekly.node('weekly-games').children.every(button => button.disabled));
    await weekly.node('schedule-week').change('10');
    assert.equal(weekly.node('weekly-games').children.length,16,'Upcoming weeks remain selectable without scores');
    assert.match(weekly.node('schedule-context').textContent,/ratings through Week 9/);
    weekly.run("appState.gamesData = []; appState.schedule = []; renderWeeklySchedule()");
    assert.equal(weekly.node('schedule-week').disabled,true);
    assert.match(weekly.node('schedule-context').textContent,/No schedule available/);

    const future = `${header}\nfuture,2025,10,2099-01-01,ARI,ATL,21,14,Home`;
    assert.equal(h.context.parseCSV(future).length,0,'Future-dated scores are not results');
    assert.equal(h.context.parseCSV(future,true).length,1,'Future games remain in schedule');
    const shutout = `${header}\nzero,2025,1,2025-01-01,ARI,ATL,0,14,Home`;
    assert.equal(h.context.parseCSV(shutout).length,1,'Zero points is a valid result');
    assert.equal(h.context.isValidScore('Infinity'),false);
    assert.equal(h.context.isValidScore('-1'),false);
    assert.ok(!html.includes('id="calculate-btn"'));
    console.log('PASS: schedule completeness, unavailable weeks, automatic season/start/end updates, manual scrubbing and bounds, weekly forecasts without hindsight, scheduled-game selection, rapid-change cancellation, saved/offline startup, import recovery, errors, and future-date guards.');
})().catch(error=>{console.error(error);process.exitCode=1;});
