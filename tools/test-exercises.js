/*
  Tests for the exercises page, run with:  node tools/test-exercises.js

  The point of this one is that no student can be given a task that
  cannot be passed. Every worked solution is really run under Skulpt
  against its own tests, and a program that does nothing useful is run
  against them too, to catch tests so loose that anything passes.

  Needs vendor/:  python3 tools/build-offline.py extract
*/

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const PAGE = 'exercises.html';

let failures = 0;
function check(name, fn) {
  try { fn(); console.log('  ok    ' + name); }
  catch (e) { failures++; console.log('  FAIL  ' + name + '\n        ' + (e && e.message || e)); }
}
function assert(ok, message) { if (!ok) throw new Error(message); }
function fail(where, why) { failures++; console.log('  FAIL  ' + where + '\n        ' + why); }

/** Skulpt, with just enough of a browser around it to load. */
function skulpt() {
  const missing = ['vendor/skulpt.min.js', 'vendor/skulpt-stdlib.js'].filter(f => !fs.existsSync(path.join(ROOT, f)));
  if (missing.length) {
    console.log('\nvendor/ is not here yet. Run:  python3 tools/build-offline.py extract\n');
    process.exit(1);
  }
  const sandbox = {
    document: {
      getElementById: () => null,
      createElement: () => ({ style: {}, setAttribute() {}, appendChild() {} }),
      head: { appendChild() {} }, body: { appendChild() {} }
    },
    navigator: { userAgent: 'node' }, setTimeout, clearTimeout, console, Promise
  };
  sandbox.window = sandbox; sandbox.self = sandbox; sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  for (const f of ['vendor/skulpt.min.js', 'vendor/skulpt-stdlib.js']) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), sandbox, { filename: f });
  }
  return sandbox.Sk;
}

/** The CORE and CONTENT sections of the page, evaluated. */
function load(file) {
  const text = fs.readFileSync(path.join(ROOT, file), 'utf8');
  const from = text.indexOf('function EX_core(');
  const to = text.indexOf('function EX_badges(');
  assert(from > 0 && to > from, file + ': could not find the CORE and CONTENT sections');
  const sandbox = { Promise, console };
  vm.runInNewContext(text.slice(from, to), sandbox, { filename: file });
  return sandbox;
}

const page = load(PAGE);
const Sk = skulpt();
const core = page.EX_core(Sk);
const SETS = page.EX_content().SETS;

console.log('\nhow the sets are put together');
const seen = {};
SETS.forEach(function (set) {
  check(set.name, function () {
    ['id', 'code', 'name', 'sub', 'colour', 'about'].forEach(function (k) {
      assert(set[k], 'the set is missing ' + k);
    });
    assert(/^#[0-9A-F]{6}$/i.test(set.colour), 'colour should be a 6 digit hex value');
    assert(/^[A-Z]{3}$/.test(set.code), 'the badge code should be three capital letters');
    assert(set.items.length === 5, 'it has ' + set.items.length + ' exercises, and a set is five');
    set.items.forEach(function (ex) {
      assert(!seen[ex.id], ex.id + ' is used twice');
      seen[ex.id] = true;
      ['title', 'brief', 'hint', 'solution'].forEach(function (k) { assert(ex[k], ex.id + ' is missing ' + k); });
      assert(ex.steps && ex.steps.length, ex.id + ' has no steps');
      assert(ex.tests && ex.tests.length, ex.id + ' has no tests');
      ex.tests.forEach(function (t, n) {
        assert((t.want && t.want.length) || t.wantFiles, ex.id + ' test ' + (n + 1) + ' checks nothing');
      });
      (ex.must || []).concat(ex.forbid || []).forEach(function (rule) {
        assert(rule.re && rule.why, ex.id + ' has a rule with no pattern or no explanation');
        try { new RegExp(rule.re); } catch (e) { throw new Error(ex.id + ' has a rule that is not a valid pattern: ' + rule.re); }
      });
    });
  });
});

/* A program that runs cleanly but does none of the work. If this passes an
   exercise, that exercise is not really checking anything. */
const LAZY = 'print("nothing to see here")\n';

(async function () {
  console.log('\nevery worked solution passes its own tests');
  for (const set of SETS) {
    for (const ex of set.items) {
      const good = await core.check(ex.solution, ex);
      if (!good.ok) { fail(ex.id + '  ' + ex.title, 'the worked solution does not pass: ' + good.why); continue; }
      const lazy = await core.check(LAZY, ex);
      if (lazy.ok) { fail(ex.id + '  ' + ex.title, 'a program that does nothing still passes, so the tests are too loose'); continue; }
      console.log('  ok    ' + ex.id + '  ' + ex.title);
    }
  }

  console.log('\nmarking behaves itself');
  check('an empty answer is not correct', function () {
    core.check('', SETS[0].items[0]).then(function (r) { assert(!r.ok, 'empty code was accepted'); });
  });
  check('strings and comments do not satisfy a rule', function () {
    const ex = { tests: [], must: [{ re: '\\bfor\\b', why: 'use a loop' }] };
    assert(core.sourceProblem('print("for sale")  # for later', ex), 'the word for inside a string counted as a loop');
    assert(!core.sourceProblem('for i in range(3):\n    print(i)', ex), 'a real for loop was not recognised');
  });
  check('output is matched in order, ignoring case and spacing', function () {
    assert(core.missing('Total:  15\n', ['total: 15']) === null, 'spacing or capitals stopped a match');
    assert(core.missing('b\na\n', ['a', 'b']) !== null, 'out of order output was accepted');
  });

  console.log('\nshared code');
  check('the virtual filesystem matches the one in Python Blocks', function () {
    function vfs(file) {
      const text = fs.readFileSync(path.join(ROOT, file), 'utf8');
      const from = text.indexOf("'class TextFile:',");
      const to = text.indexOf("].join('\\n');", from);
      assert(from > 0 && to > from, file + ': could not find the virtual filesystem');
      // Compare the Python inside the strings, not how far the JavaScript
      // around it happens to be indented.
      return text.slice(from, to).split('\n').map(function (l) { return l.trim(); }).join('\n');
    }
    assert(vfs(PAGE) === vfs('python-blocks-ocr.html'),
      'exercises.html and python-blocks-ocr.html describe files differently, so the same program would behave differently in each');
  });


/* ---------------------------------------------------------------------
   The page builds. A stub document is enough to catch a render that
   throws: a mistyped element, a missing id, a badge that will not draw.
   --------------------------------------------------------------------- */
function stubDom() {
  function node(tag) {
    var e = {
      tagName: tag, className: '', textContent: '', value: '', hidden: false, disabled: false,
      children: [], style: { setProperty: function () {}, marginTop: '', justifyContent: '' },
      classList: { add: function () {}, remove: function () {}, toggle: function () {} },
      appendChild: function (c) { e.children.push(c); return c; },
      removeChild: function (c) { return c; },
      remove: function () {},
      setAttribute: function () {}, getAttribute: function () { return null; },
      addEventListener: function () {}, removeEventListener: function () {},
      querySelector: function () { return null; }, querySelectorAll: function () { return []; },
      focus: function () {}, select: function () {}, click: function () {},
      setRangeText: function () {}, scrollIntoView: function () {},
      getBoundingClientRect: function () { return { top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0 }; },
      getContext: function () { return ctx; },
      toDataURL: function () { return 'data:image/png;base64,'; }
    };
    Object.defineProperty(e, 'innerHTML', { get: function () { return ''; }, set: function () { e.children.length = 0; } });
    return e;
  }
  var ctx = {
    fillStyle: '', strokeStyle: '', font: '', lineWidth: 0, lineCap: '', lineJoin: '', textAlign: '',
    fillRect: function () {}, strokeRect: function () {}, beginPath: function () {}, arc: function () {},
    fill: function () {}, stroke: function () {}, moveTo: function () {}, lineTo: function () {},
    fillText: function () {}, measureText: function () { return { width: 120 }; }
  };
  var byId = {};
  ['sets', 'main', 'toast', 'btnTheme', 'btnTeacher', 'code', 'given', 'out'].forEach(function (id) { byId[id] = node('div'); });
  var store = {};
  return {
    document: {
      getElementById: function (id) { return byId[id] || (byId[id] = node('div')); },
      createElement: node,
      createTextNode: function (t) { return { text: t }; },
      querySelector: function () { return null; }, querySelectorAll: function () { return []; },
      addEventListener: function () {},
      documentElement: node('html'), body: node('body'), head: node('head'),
      fonts: null
    },
    localStorage: {
      getItem: function (k) { return store[k] === undefined ? null : store[k]; },
      setItem: function (k, v) { store[k] = String(v); }
    },
    navigator: {}, byId: byId
  };
}

function buildPage() {
  const text = fs.readFileSync(path.join(ROOT, PAGE), 'utf8');
  const from = text.indexOf('function EX_core(');
  const to = text.lastIndexOf('/* ===', text.indexOf('   5. START UP'));
  const dom = stubDom();
  const sandbox = {
    document: dom.document, localStorage: dom.localStorage, navigator: dom.navigator,
    setTimeout: function () { return 0; }, clearTimeout: function () {},
    scrollTo: function () {}, Promise: Promise, console: console
  };
  sandbox.window = sandbox;
  vm.runInNewContext(text.slice(from, to) + '\nvar app = EX_ui(new Promise(function () {}));', sandbox, { filename: PAGE });
  return { app: sandbox.app, dom: dom };
}

console.log('\nthe page builds');
check('the set list and the first set render', function () {
  const built = buildPage();
  const sets = built.dom.byId.sets.children;
  assert(sets.length === SETS.length + 1, 'expected a heading and ' + SETS.length + ' sets, got ' + sets.length + ' things');
  assert(built.dom.byId.main.children.length >= 2, 'the first set did not render');
});
check('an exercise renders', function () {
  const built = buildPage();
  built.app.state.done = {};
  built.dom.byId.main.children.length = 0;
  built.app.render();
  assert(built.dom.byId.main.children.length > 0, 'nothing was drawn');
});
check('a finished set draws its badge', function () {
  const built = buildPage();
  SETS[0].items.forEach(function (ex) { built.app.state.done[ex.id] = true; });
  built.app.state.badges[SETS[0].id] = { name: 'Ada Lovelace', date: '2026-09-22', code: 'VAR-ABC123' };
  built.app.render();
  assert(built.dom.byId.main.children.length > 0, 'the badge panel threw');
});

  console.log(failures ? '\n' + failures + ' failing\n' : '\nall passing: ' + Object.keys(seen).length + ' exercises\n');
  process.exit(failures ? 1 : 0);
})();
