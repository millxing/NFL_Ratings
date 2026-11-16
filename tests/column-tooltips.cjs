const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const html = fs.readFileSync(require('node:path').join(__dirname, '../NFLPowerRatings.html'), 'utf8');
const source = html.slice(html.indexOf('        function initializeColumnTooltips()'), html.indexOf('        function initializeFloatingHeader()'));
const listeners = {};
const windowListeners = {};
const timers = new Map();
let timerId = 0;
function node(attrs = {}, rect = {left:5, top:40, bottom:70, width:70, height:30}) {
    return {
        attrs, style:{}, hidden:false, isConnected:true,
        getAttribute(key) { return this.attrs[key]; },
        setAttribute(key, value) { this.attrs[key] = value; },
        removeAttribute(key) { delete this.attrs[key]; },
        getBoundingClientRect() { return rect; },
        contains(target) { return target === this || target === this.button; },
        querySelector() { return this.button || null; },
        closest() { return this.header || this; }
    };
}
const header = node({title:'Rating in points above or below average'});
header.button = node({title:'Old browser tooltip'});
header.button.header = header;
const matchup = node({title:'Total points scored'}, {left:390, top:150, bottom:180, width:60, height:30});
let popup;
const context = vm.createContext({
    document: {
        body:{append(element) { popup = element; }},
        createElement:() => node({}, {width:280, height:60}),
        querySelectorAll:() => [header, matchup],
        addEventListener:(name, handler) => { listeners[name] = handler; }
    },
    window:{innerWidth:480, innerHeight:240, addEventListener:(name, handler) => { windowListeners[name] = handler; }},
    setTimeout(fn) { const id = ++timerId; timers.set(id, fn); return id; },
    clearTimeout(id) { timers.delete(id); },
    Date
});
vm.runInContext(source + '\ninitializeColumnTooltips();', context);
const flush = () => { const pending = [...timers.values()]; timers.clear(); pending.forEach(fn => fn()); };
assert.equal(header.attrs.title, undefined);
assert.equal(header.button.attrs.title, undefined);
assert.equal(header.button.attrs['aria-description'], 'Rating in points above or below average');
assert.equal(matchup.tabIndex, 0, 'Unsorted matchup headers support keyboard focus');
listeners.pointerover({target:header.button, pointerType:'mouse'});
assert.equal(popup.hidden, true, 'Initial hover has a delay');
flush();
assert.equal(popup.hidden, false);
assert.equal(popup.textContent, header.attrs['data-column-tooltip']);
assert.equal(popup.style.left, '12px', 'Popup stays inside the left edge');
listeners.pointerover({target:matchup, pointerType:'mouse'});
assert.equal(popup.textContent, 'Total points scored', 'Adjacent tooltip opens immediately');
assert.equal(popup.style.left, '188px', 'Popup stays inside the right edge');
assert.equal(popup.style.top, '82px', 'Popup moves above a header near the bottom');
listeners.keydown({key:'Escape'});
assert.equal(popup.hidden, true);
listeners.focusin({target:header.button});
assert.equal(popup.hidden, false, 'Keyboard focus opens immediately');
listeners.focusout({target:header.button});
assert.equal(popup.hidden, true);
listeners.pointerover({target:header, pointerType:'touch'});
assert.equal(popup.hidden, true, 'Touch does not create a stuck hover popup');
listeners.focusin({target:header.button});
listeners.scroll();
assert.equal(popup.hidden, true);
listeners.focusin({target:header.button});
windowListeners.resize();
assert.equal(popup.hidden, true);
listeners.pointerover({target:header, pointerType:'mouse'});
listeners.pointerout({target:header, relatedTarget:null});
flush();
assert.equal(popup.hidden, true, 'Leaving a header cancels pending hover');
console.log('PASS: tooltip descriptions, focus, hover delay, adjacent headers, viewport bounds, Escape, scroll, resize, and touch guards.');
