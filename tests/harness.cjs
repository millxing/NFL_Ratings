// Shared Node harness for NFLPowerRatings.html. It runs the page script in a VM
// with a minimal DOM, real CSV parsing, storage, regression and Play-by-Play assets.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'NFLPowerRatings.html'), 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];

function realPbpAssets() {
    // PBP_ASSETS=<folder> tests a scratch build before it replaces data/pbp.
    const dir = process.env.PBP_ASSETS || path.join(root, 'data/pbp');
    return Object.fromEntries(fs.readdirSync(dir).filter(name => name.endsWith('.js'))
        .map(name => [`data/pbp/${name}`, fs.readFileSync(path.join(dir, name), 'utf8')]));
}

// Exercise real loading, parsing, filter handlers, storage, availability and regression.
// Rendering layout and browser scrolling are outside this unit harness.
// pbpAssets maps published asset paths (for example data/pbp/manifest.js) to script text;
// null or a missing entry simulates a failed load. pbpGate(url) can return a promise to delay a load.
function harness({ fail = false, storage = new Map(), csvText, now = '2025-11-07T12:00:00Z', pbpAssets = realPbpAssets(), pbpGate = null } = {}) {
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
        createCaption() { this.caption = new Node('caption'); return this.caption; }
        createTHead() { return this.appendChild(new Node('thead')); }
        createTBody() { return this.appendChild(new Node('tbody')); }
        insertRow() { return this.appendChild(new Node('tr')); }
        insertCell() { return this.appendChild(new Node('td')); }
        addEventListener(type, fn) { (this.listeners[type] ??= []).push(fn); }
        async dispatch(type) { await Promise.all((this.listeners[type] ?? []).map(fn => fn({target:this}))); }
        async change(value) { this.value = value; await this.dispatch('change'); }
        setAttribute(key,value) { this.attributes[key] = String(value); }
        getAttribute(key) { return this.attributes[key]; }
        hasAttribute(key) { return key in this.attributes; }
        removeAttribute(key) { delete this.attributes[key]; }
        get classList() { const node = this; return {add(...names) { node.className = [...new Set([...node.className.split(' ').filter(Boolean),...names])].join(' '); }, remove(...names) { node.className = node.className.split(' ').filter(v => !names.includes(v)).join(' '); }, toggle(name, force) { if (force ?? !node.className.split(' ').includes(name)) this.add(name); else this.remove(name); }}; }
    }
    const nodes = new Map();
    const selects = ['season-select','method-select','start-week-select','end-week-select','matchup-a','matchup-b','matchup-venue','schedule-week'];
    const node = id => { if (!nodes.has(id)) nodes.set(id,new Node(selects.includes(id) ? 'select' : '')); return nodes.get(id); };
    const options = ['neutral','a','b'];
    options.forEach(value => { const option = new Node(); option.value = value; node('matchup-venue').add(option); });
    const context = vm.createContext({
        document: { getElementById: node, addEventListener() {}, createElement: tag => new Node(tag), querySelector: node, querySelectorAll: () => [] },
        window: {addEventListener() {}}, location: {hash:''},
        Option: function(text,value) { this.textContent = text; this.value = String(value); },
        localStorage: {getItem:key=>storage.get(key)??null,setItem:(key,value)=>storage.set(key,value)},
        fetch: async () => { if (network.fail) throw new Error('offline'); return {ok:true,text:async()=>network.csvText}; },
        Date: class extends Date { constructor(...args) { super(...(args.length ? args : [now])); } static now() { return new Date(now).getTime(); } },
        AbortSignal, setTimeout, clearTimeout, console: {log(){},warn(){},error(){}}, renders: [], solverCalls: 0, pbpLoads: [],
    });
    vm.runInContext(script,context);
    context.loadAsset = async url => {
        context.pbpLoads.push(url);
        if (pbpGate) await pbpGate(url);
        const text = pbpAssets[url.split('?')[0]];
        if (typeof text !== 'string') throw new Error('file could not be loaded');
        vm.runInContext(text, context);
    };
    vm.runInContext(`
        loadPbpScript = loadAsset;
        const actualSolver = performOLSRegression;
        performOLSRegression = (...args) => { solverCalls++; return actualSolver(...args); };
        initializeFloatingHeader = () => {};
        initializeColumnTooltips = () => {};
        syncFloatingHeader = () => {};
        renderResultsTable = (results, gamesCount) => {
            appState.currentRatings = results.ratings;
            appState.currentHFA = results.homeFieldAdvantage;
            renders.push({season:elements.seasonSelect.value,start:elements.startWeekSelect.value,end:elements.endWeekSelect.value,gamesCount,results});
            elements.resultsSection.classList.add('results-section--visible');
            saveResults(results, gamesCount);
        };
    `,context);
    return {context,node,storage,network,run:code=>vm.runInContext(code,context)};
}

module.exports = {harness, html, realPbpAssets};
