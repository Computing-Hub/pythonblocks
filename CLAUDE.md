# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Two self-contained teaching tools for OCR GCSE Computer Science (J277), each a single HTML file with no build step, no package manager, no server and no test runner:

| File | App | Vendored libraries |
|---|---|---|
| `python-blocks-ocr.html` | **Python Blocks** — Blockly workspace that generates Python, runs it in the browser | fetched from CDN at runtime |
| `python-blocks-ocr-offline.html` | same app | Blockly 13.2.1 + Skulpt 1.2.0 inlined |
| `flowcharts-ocr.html` | **Flowcharts** — two-way Python ⇄ flowchart editor with step-through execution | fetched from CDN at runtime |
| `flowcharts-ocr-offline.html` | same app | Skulpt 1.2.0 inlined |

Python is executed for real by **Skulpt** in the browser; nothing runs on a server.

## Running and verifying

Open a file directly in a browser (`open python-blocks-ocr.html`), or serve the directory if a `file://` restriction bites:

```
python3 -m http.server 8000     # then http://localhost:8000/python-blocks-ocr.html
```

There is no lint step. Two commands matter:

```
node tools/test-flowcharts.js              # tests for the flowchart CORE section
python3 tools/build-offline.py check       # are the offline pages in sync? (exit 1 if not)
```

Run both before finishing any change. The flowchart CORE never touches the DOM, so the test lifts it out of the HTML with `vm` and exercises it — no source changes, no dependencies. It covers every bundled example (parse → Python → re-parse must not drift, every shape reachable in both the SVG and the `__at()` hooks), the parse errors students trigger, and the ERL translation. **Python Blocks has no equivalent**: its core needs Blockly and a DOM, so changes there still need checking in the browser.

Anything the tests don't reach is manual: load the page, open **Examples**, run each one, and check the generated Python panel.

Both apps persist to `localStorage` (`python-blocks-ocr:v1`, `flowchart-ocr:v1`, shared theme key `pb-theme`). Clear these when testing first-run behaviour.

## The online/offline pairing — read before editing anything

For each app, the `*-offline.html` file is **byte-identical** to the online one except that the vendor bundles are inlined as extra `<script>` blocks before the app script. The head, CSS, body markup and the entire app script are the same text.

The offline copy keeps the CDN loader untouched; it simply never fires, because the inlined bundles have already set `window.Blockly` / `window.Sk` and the loader short-circuits on those globals.

**Never edit an offline page by hand.** Edit the online page and regenerate:

```
python3 tools/build-offline.py extract     # first time only: refill vendor/ from the offline pages
python3 tools/build-offline.py build       # rewrite the offline pages
python3 tools/build-offline.py check       # verify, for CI or a pre-commit hook
```

`vendor/` holds the library files and is deliberately untracked — `extract` rebuilds it from the offline pages that *are* tracked, so a fresh clone needs no network. The inlined blocks carry their origin as a marker comment (`/* blockly/blockly.min.js */`, …) and that marker is what the script keys on, so keep it if you replace a bundle. To upgrade a library, drop the new file into `vendor/` (URLs are pinned in the START UP section) and run `build`.

Because the build is byte-exact, `check` is a true drift detector: if it says "in sync", the two pages differ by nothing but the vendor blocks.

Note the offline copies still link Google Fonts from the network; the pages degrade to system fonts when that is blocked.

## Script layout

Each app script is a small number of top-level factory functions, separated by banner comments (`/* ===== 1. CORE ... */`). They are plain functions in file scope wired together at the bottom — no modules, no bundler.

**Python Blocks** — `PB_core(Blockly, pythonNS)` → `PB_content(core)` → `PB_VFS(files)` → `PB_ui(Blockly, pythonNS, pythonReady)` → START UP.

- **CORE** holds `DEFS` (JSON block definitions), the `pythonGenerator.forBlock` generators, the toolbox, and the builder `D` — a terse DSL (`set`, `pr`, `iff`, `for1`, `func`, …) that produces serialized Blockly workspaces. `codeOf(ws)` generates Python from a workspace; `codeFor(state)` from a saved program.
- **CONTENT** defines `HELP` topics and `EXAMPLES`. Every program there is written with `D`, so the blocks a student loads, the Python shown in the help panel and the code that actually runs cannot drift apart. `erl:` strings next to each topic are the OCR Exam Reference Language equivalent, written by hand.
- **VIRTUAL FILES** is a Python source string built by `PB_VFS`, imported into Skulpt as `pbfiles` and bound over the built-in `open()`. Files live in a JS object; after each run the module's `_files` dict is read back with `Sk.ffi.remapToJs`.
- **INTERFACE** owns the workspace, the help/examples drawer, the code panel, the console and the runner.

**Flowcharts** — `FC_core()` → `FC_content()` → `FC_ui(pythonReady)` → START UP.

- **CORE** is the interesting part. The program model is `{ imports, subs, main }` with statement nodes typed `process | input | output | call | if | while | for`. `parse(source)` is a hand-written indentation parser (throws `ParseError(message, line)`); `toPython(prog, trace)` goes back the other way; `toERL(prog)` renders OCR Exam Reference Language; `draw(prog, opts)` lays the chart out around a vertical axis and returns an SVG string plus `slots` (the clickable `+` insertion points).
- **INTERFACE** treats **the Python text as the single source of truth**: editing the textarea re-parses and redraws (debounced 350 ms); editing a shape mutates the model and rewrites the textarea via `fromChart()`. Never add a path that mutates the chart without regenerating the Python.

### Step-through execution (Flowcharts)

`toPython(prog, true)` interleaves a `__at(<node id>)` call before every shape, and wraps conditions as `__at(id) and (cond)`. `__at` is installed as a Skulpt builtin that records a trace row, highlights the shape, and returns a suspension — resolved by a timer in Run mode, or by the Step button in step mode. This is what drives the shape highlight, the variable watch and the trace table (capped at 400 rows). Anything that changes statement ordering in `toPython` must keep the hooks aligned with the ids `draw` emits.

## Conventions that hold across both files

- **ES5 only**: `var`, `function`, no arrow functions, no `let`/`const`, no template literals. Keep new code in the same dialect.
- **Teaching-first error messages.** Each app has a `HINTS` table mapping `[/^ErrorName/, /message pattern/, 'advice']`; runtime errors are rendered as title + message + hint rather than a traceback. Add a row here rather than making an error message longer.
- **Skulpt setup** is duplicated per app: `__future__: Sk.python3`, `yieldLimit: 100`, `killableWhile/For: true`, `inputfun` returning a console promise. **Stop works by setting `Sk.execLimit = 1`**, so every run must reset `Sk.execLimit` and `Sk.execStart`. Output above ~60 000 characters trips a flood guard that stops the program.
- **Theming** is CSS custom properties on `:root`, overridden under `:root[data-theme="dark"]`. Flowchart SVG colours are *not* CSS — they come from the `PALETTES` object in `FC_ui` and must be updated alongside the CSS when colours change.
- Blockly block styles come from `COL` (one colour per concept); empty value sockets render as the `BLANK` marker `___`, and Run refuses to start while any remain.
- User-facing copy is British English, second person, and aimed at 14–16-year-olds. Match it.

## Adding content

- **A Python Blocks example or help topic**: copy an entry in `PB_content` and rewrite it with the `D` builder. Don't hand-write the Python for the help panel — it is generated from the same blocks.
- **A new block**: add to `DEFS`, add a generator in `defineGenerators`, add it to `TOOLBOX`, and usually add a `D` helper so examples can use it.
- **A flowchart example**: entries in `FC_content` are plain Python strings, and they must parse under the deliberately narrow subset — spaces not tabs, `import` lines at the top, sub programs at the left margin, `return` only as the last line of a function, and `for x in range(...)` as the only loop form. Anything outside that must produce a helpful `ParseError`, not a crash.
