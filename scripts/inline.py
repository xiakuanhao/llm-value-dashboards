#!/usr/bin/env python3
"""Fold dist-standalone/ into one self-contained page: prototype-1.html,
plus docs/index.html (the same page as a full document, for GitHub Pages).

The output is a page fragment (title, style, app root, script) with no
doctype/html/head/body wrapper, ready to publish as an Artifact or to open
directly in a browser.
"""
import pathlib, re

root = pathlib.Path(__file__).resolve().parent.parent
dist = root / 'dist-standalone'
html = (dist / 'index.html').read_text()

title = re.search(r'<title>.*?</title>', html).group(0)
css = ''.join((dist / p).read_text() for p in re.findall(r'<link rel="stylesheet"[^>]*href="\./([^"]+)"', html))
js = ''.join((dist / p).read_text() for p in re.findall(r'<script type="module"[^>]*src="\./([^"]+)"', html))
js = js.replace('</script', '<\\/script')

out = root / 'prototype-1.html'
out.write_text(f'{title}\n<style>\n{css}\n</style>\n<div id="app"></div>\n<script type="module">\n{js}\n</script>\n')
print(out, f'{out.stat().st_size / 1024:.0f} KB')

# Full HTML document for GitHub Pages (served from docs/).
page = root / 'docs' / 'index.html'
page.parent.mkdir(exist_ok=True)
page.write_text(
    '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8" />\n'
    '<meta name="viewport" content="width=device-width, initial-scale=1" />\n'
    f'{title}\n<style>\n{css}\n</style>\n</head>\n<body>\n<div id="app"></div>\n'
    f'<script type="module">\n{js}\n</script>\n</body>\n</html>\n'
)
print(page)
