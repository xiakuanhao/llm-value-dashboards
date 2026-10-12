#!/usr/bin/env python3
"""Fold each dist-standalone/<page>/ build into one self-contained HTML file.

    docs/index.html      landing page
    docs/p1/index.html   Prototype 1
    docs/p2/index.html   Prototype 2

docs/ is served by GitHub Pages. Also writes prototype-1.html, a fragment
(no doctype/html/head/body) of Prototype 1 for publishing as an Artifact.
"""
import pathlib, re

root = pathlib.Path(__file__).resolve().parent.parent
DEST = {'index': 'docs/index.html', 'p1': 'docs/p1/index.html', 'p2': 'docs/p2/index.html'}

for page, dest in DEST.items():
    dist = root / 'dist-standalone' / page
    html = (dist / f'{page}.html').read_text()
    title = re.search(r'<title>.*?</title>', html).group(0)
    css = ''.join((dist / p).read_text() for p in re.findall(r'<link rel="stylesheet"[^>]*href="\./([^"]+)"', html))
    js = ''.join((dist / p).read_text() for p in re.findall(r'<script type="module"[^>]*src="\./([^"]+)"', html))
    js = js.replace('</script', '<\\/script')

    out = root / dest
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(
        '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8" />\n'
        '<meta name="viewport" content="width=device-width, initial-scale=1" />\n'
        f'{title}\n<style>\n{css}\n</style>\n</head>\n<body>\n<div id="app"></div>\n'
        f'<script type="module">\n{js}\n</script>\n</body>\n</html>\n'
    )
    print(out.relative_to(root), f'{out.stat().st_size / 1024:.0f} KB')
    if page == 'p1':
        (root / 'prototype-1.html').write_text(
            f'{title}\n<style>\n{css}\n</style>\n<div id="app"></div>\n<script type="module">\n{js}\n</script>\n'
        )
