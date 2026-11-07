const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const html = fs.readFileSync(require('node:path').join(__dirname, '../NFLpowerRatings.html'), 'utf8');

async function startup({ loaded = true, saved = false } = {}) {
    const nodes = new Map();
    const node = id => {
        if (!nodes.has(id)) nodes.set(id, { value: '', options: [], add(option) { this.options.push(option); }, addEventListener() {} });
        return nodes.get(id);
    };
    const context = vm.createContext({
        document: { getElementById: node, addEventListener() {} },
        window: { addEventListener() {} },
        Option: function(text, value) { this.text = text; this.value = value; },
        console, calls: { calculate: 0, restore: 0 }, loaded, saved,
    });
    vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)[1], context);
    // Keep the real startup orchestration; isolate network, rendering, and math.
    vm.runInContext(`
        initializeApp = async () => {
            appState.dataLoaded = loaded;
            elements.seasonSelect.value = '2026';
            elements.startWeekSelect.value = '1';
            elements.endWeekSelect.value = '9';
        };
        latestSeasonWeek = () => 9;
        setLatestWeek = () => {};
        ratingsDataKey = () => 'current-data';
        readStored = key => key === 'ratings' && saved ? {
            version: 1, dataKey: 'current-data', season: '2026', start: '1', end: '9',
            results: { homeFieldAdvantage: 2, ratings: Object.keys(TEAM_NAMES).map(team => ({team, rating: 0})) },
            gamesCount: 100
        } : null;
        handleCalculateClick = async () => { calls.calculate++; };
        renderResultsTable = () => { calls.restore++; };
        hideStatus = () => {};
        initializeFloatingHeader = () => {};
        showView = () => {};
    `, context);
    await context.initializeV2();
    return context.calls;
}
(async () => {
    assert.equal((await startup()).calculate, 1, 'First visit calculates once after data loads');
    const restored = await startup({saved: true});
    assert.equal(restored.restore, 1, 'Valid cached results restore');
    assert.equal(restored.calculate, 0, 'Valid cached results avoid duplicate calculation');
    assert.equal((await startup({loaded: false})).calculate, 0, 'Failed data load must not trigger calculation');
    console.log('PASS: automatic first-load calculation, saved-results restore, and failed-load guard.');
})().catch(error => { console.error(error); process.exitCode = 1; });
