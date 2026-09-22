#!/usr/bin/env python3
"""Regenerate the *-offline.html pages from the online ones.

An offline page is the online page with the vendor bundles inlined as extra
<script> blocks in front of the app script. Nothing else differs, so the offline
copies should never be edited by hand: edit the online page and run

    python3 tools/build-offline.py build      # rewrite the offline pages
    python3 tools/build-offline.py check      # are they in sync? (exit 1 if not)
    python3 tools/build-offline.py extract    # refill vendor/ from the offline pages

vendor/ holds the library files. It is not in the repository: `extract` rebuilds
it from the offline pages that are, so a clone needs no network to build.
"""

import sys
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
VENDOR = ROOT / 'vendor'

# marker -> the name the library is stored under in vendor/. The marker is the
# comment the inlined block carries, and says where the file came from.
APPS = [
    {
        'online': 'python-blocks-ocr.html',
        'offline': 'python-blocks-ocr-offline.html',
        'note': '<!-- Offline copy: Blockly 13.2.1 and Skulpt 1.2.0 are included below, so no internet is needed. -->',
        'libs': [
            ('blockly/blockly.min.js', 'blockly.min.js'),
            ('blockly/python_compressed.js', 'python_compressed.js'),
            ('skulpt/dist/skulpt.min.js', 'skulpt.min.js'),
            ('skulpt/dist/skulpt-stdlib.js', 'skulpt-stdlib.js'),
        ],
    },
    {
        'online': 'exercises.html',
        'offline': 'exercises-offline.html',
        'note': '<!-- Offline copy: Skulpt 1.2.0 is included below, so no internet is needed. -->',
        'libs': [
            ('skulpt/dist/skulpt.min.js', 'skulpt.min.js'),
            ('skulpt/dist/skulpt-stdlib.js', 'skulpt-stdlib.js'),
        ],
    },
    {
        'online': 'flowcharts-ocr.html',
        'offline': 'flowcharts-ocr-offline.html',
        'note': '<!-- Offline copy: Skulpt 1.2.0 is included below, so no internet is needed. -->',
        'libs': [
            ('skulpt/dist/skulpt.min.js', 'skulpt.min.js'),
            ('skulpt/dist/skulpt-stdlib.js', 'skulpt-stdlib.js'),
        ],
    },
]

APP_TAG = '\n<script>\n'          # the app script's own opening tag


def read(path):
    return path.read_text(encoding='utf-8')


def split_online(text, where):
    """Everything before the app script, and everything from it onwards."""
    i = text.find(APP_TAG)
    if i < 0:
        raise SystemExit('%s: could not find the app <script> tag' % where)
    if text.find(APP_TAG, i + 1) >= 0:
        raise SystemExit('%s: expected exactly one bare <script> tag' % where)
    return text[:i], text[i:]


def block(marker, body):
    # body is stored byte for byte, so a rebuild of an untouched page is identical
    return '\n<script>/* %s */\n%s\n</script>' % (marker, body)


def build_text(app):
    head, app_script = split_online(read(ROOT / app['online']), app['online'])
    out = [head, '\n', app['note']]
    for marker, name in app['libs']:
        path = VENDOR / name
        if not path.exists():
            raise SystemExit('missing %s - run: python3 tools/build-offline.py extract' % path)
        out.append(block(marker, read(path)))
    out.append(app_script)
    return ''.join(out)


def extract(app):
    text = read(ROOT / app['offline'])
    for marker, name in app['libs']:
        open_tag = '<script>/* %s */\n' % marker
        i = text.find(open_tag)
        if i < 0:
            raise SystemExit('%s: no inlined block for %s' % (app['offline'], marker))
        start = i + len(open_tag)
        end = text.find('\n</script>', start)
        (VENDOR / name).write_text(text[start:end], encoding='utf-8')
        print('  vendor/%s  (%d bytes)' % (name, end - start))


def main():
    action = sys.argv[1] if len(sys.argv) > 1 else 'build'
    if action == 'extract':
        VENDOR.mkdir(exist_ok=True)
        for app in APPS:
            print(app['offline'])
            extract(app)
        return 0

    bad = 0
    for app in APPS:
        want = build_text(app)
        path = ROOT / app['offline']
        have = read(path) if path.exists() else None
        if action == 'check':
            if have == want:
                print('in sync:     %s' % app['offline'])
            else:
                bad = 1
                print('OUT OF SYNC: %s - run: python3 tools/build-offline.py build' % app['offline'])
        elif action == 'build':
            if have == want:
                print('unchanged:   %s' % app['offline'])
            else:
                path.write_text(want, encoding='utf-8')
                print('written:     %s' % app['offline'])
        else:
            raise SystemExit(__doc__)
    return bad


if __name__ == '__main__':
    sys.exit(main())
