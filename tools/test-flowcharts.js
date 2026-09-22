/*
  Tests for the flowchart CORE section, run with:  node tools/test-flowcharts.js

  CORE never touches the DOM, so it can be lifted straight out of the page and
  exercised here. Nothing in the HTML has to change for this to work: the test
  slices the script between "function FC_core()" and "function FC_ui(" and runs
  that text. Unlike the pages themselves this file only ever runs in Node, so it
  is not held to their ES5 style.

  Python Blocks has no equivalent yet: its core needs Blockly and a DOM.
*/

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const PALETTE = {
  line: '#000', ink: '#000', terminalInk: '#fff', terminal: ['#000', '#000'],
  io: ['#000', '#000'], process: ['#000', '#000'], decision: ['#000', '#000'], sub: ['#000', '#000']
};

let failures = 0;
function check(name, fn) {
  try {
    fn();
    console.log('  ok    ' + name);
  } catch (e) {
    failures++;
    console.log('  FAIL  ' + name + '\n        ' + (e && e.message || e));
  }
}
function assert(ok, message) {
  if (!ok) throw new Error(message);
}
function equal(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(message + '\n        expected: ' + JSON.stringify(expected) + '\n        actual:   ' + JSON.stringify(actual));
  }
}

/** The CORE and CONTENT sections of a page, evaluated. */
function load(file) {
  const text = fs.readFileSync(path.join(ROOT, file), 'utf8');
  const from = text.indexOf('function FC_core()');
  const to = text.indexOf('function FC_ui(');
  assert(from > 0 && to > from, file + ': could not find the CORE section');
  const sandbox = {};
  vm.runInNewContext(text.slice(from, to), sandbox, { filename: file });
  return { source: text.slice(from, to), core: sandbox.FC_core(), content: sandbox.FC_content() };
}

/** Every statement id in a program, plus the ids of the sub programs. */
function idsOf(prog) {
  const ids = [];
  function walk(list) {
    list.forEach(function (s) {
      ids.push(s.id);
      ['yes', 'no', 'body'].forEach(function (k) { if (s[k]) walk(s[k]); });
    });
  }
  walk(prog.main);
  prog.subs.forEach(function (f) { ids.push(f.id); walk(f.body); });
  return ids;
}

const online = load('flowcharts-ocr.html');
const core = online.core;

console.log('\nthe bundled examples');
online.content.EXAMPLES.forEach(function (group) {
  group.items.forEach(function (item) {
    check(group.group + ' / ' + item.title, function () {
      const prog = core.parse(item.code);

      // Python out, Python back in: the second pass must not drift.
      const python = core.toPython(prog, false);
      const again = core.toPython(core.parse(python), false);
      equal(again, python, 'the program changes when it is re-parsed');

      // Every shape must be reachable from the chart and from the runner.
      const svg = core.draw(prog, { exam: true, palette: PALETTE, editable: true }).svg;
      const traced = core.toPython(prog, true);
      idsOf(prog).forEach(function (id) {
        assert(svg.indexOf('data-id="' + id + '"') >= 0 || svg.indexOf('data-id="sub' + id + '"') >= 0,
          'shape ' + id + ' is in the model but not in the drawing');
        assert(traced.indexOf('__at(' + id + ')') >= 0,
          'shape ' + id + ' has no __at() hook, so stepping would skip it');
      });

      core.toERL(prog);           // must not throw
      assert(core.draw(prog, { exam: false, palette: PALETTE, editable: false }).svg.indexOf('fc-plus') < 0,
        'a chart that is not editable should have no + slots');
    });
  });
});

console.log('\nmistakes students make');
[
  ['a tab instead of spaces', 'x = 1\nif x:\n\tprint(x)\n', 3],
  ['else with no if', 'x = 1\nelse:\n    print(x)\n', 2],
  ['a loop that is not range()', 'for name in names:\n    print(name)\n', 1],
  ['import inside a block', 'if x:\n    import random\n', 2],
  ['return outside a function', 'return 5\n', 1],
  ['a body that is not indented', 'if x:\nprint(x)\n', 1],
  ['indented first line', '    x = 1\n', 1],
  ['return that is not last', 'def f():\n    return 1\n    print(2)\n', 2]
].forEach(function (c) {
  check(c[0], function () {
    let caught = null;
    try { core.parse(c[1]); } catch (e) { caught = e; }
    assert(caught, 'this was accepted, but it should be a ParseError');
    assert(caught instanceof core.ParseError, 'threw ' + caught + ' instead of a ParseError');
    assert(typeof caught.message === 'string' && caught.message.length > 10, 'the message is too short to help');
    equal(caught.line, c[2], 'the error points at the wrong line');
  });
});

console.log('\nthings the parser is lenient about');
check('a late import is hoisted to the top', function () {
  const python = core.toPython(core.parse('x = 1\nimport random\nprint(x)\n'), false);
  equal(python, 'import random\n\nx = 1\nprint(x)\n', 'imports should be collected and written first');
});
check('an empty program is allowed', function () {
  const prog = core.parse('');
  equal(prog.main.length, 0, 'an empty program should have no statements');
  core.draw(prog, { exam: false, palette: PALETTE, editable: true });
});
check('comments and blank lines are dropped', function () {
  equal(core.toPython(core.parse('# a note\n\nx = 1\n'), false), 'x = 1\n', 'only the code should survive');
});

console.log('\nOCR Exam Reference Language');
[
  ['operators', 'x = a MOD b\ny = a DIV b\nz = a ^ b\n', 'x = a % b\ny = a // b\nz = a ** b\n'],
  ['boolean words', 'if a AND b OR NOT c then\n', 'if a and b or not c:\n    pass\n'],
  ['counting up', 'for i = 1 to 12\n', 'for i in range(1, 13):\n    pass\n'],
  ['counting down', 'for i = 5 to 1 step -1\n', 'for i in range(5, 0, -1):\n    pass\n'],
  ['random', 'n = random(1, 6)\n', 'import random\n\nn = random.randint(1, 6)\n'],
  ['a function', 'function area(w, h)\n', 'def area(w, h):\n    return w * h\n'],
  ['a procedure', 'procedure greet(name)\n', 'def greet(name):\n    print(name)\n']
].forEach(function (c) {
  check(c[0], function () {
    const erl = core.toERL(core.parse(c[2]));
    assert(erl.indexOf(c[1].replace(/\n$/, '')) >= 0,
      'expected to find\n        ' + JSON.stringify(c[1].replace(/\n$/, '')) + '\n        in\n        ' + JSON.stringify(erl));
  });
});

console.log('\nthe offline copy');
check('its CORE is the same code as the online one', function () {
  equal(load('flowcharts-ocr-offline.html').source, online.source,
    'the two pages have drifted apart - see tools/build-offline.py');
});

console.log(failures ? '\n' + failures + ' failing\n' : '\nall passing\n');
process.exit(failures ? 1 : 0);
