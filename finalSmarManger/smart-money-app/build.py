#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
BUILD SCRIPT — SmartMoney
=========================
Ye script smart-money-app/ ke saare source files (css + 8 js)
ko jod kar EK single-file app banati hai:

    smart-money-manager.html   (workspace root me)

Kyun? Single file:
  - kahin bhi share karo, bas browser me kholo (internet ki
    zaroorat nahi, koi server nahi)
  - Arena viewer / preview me direct chalti hai

Use:   python3 build.py
"""
import re
import os
import io

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(os.path.dirname(HERE), 'smart-money-manager.html')


def read(path):
    return io.open(path, encoding='utf-8').read()


html = read(os.path.join(HERE, 'index.html'))


def inline_css(match):
    href = match.group(1)
    css = read(os.path.join(HERE, href))
    return '<style>\n' + css + '</style>'


html = re.sub(r'<link rel="stylesheet" href="([^"]+)">', inline_css, html)

# ---- saare js files ko ORDER me jodkar EK hi <script> block banao ----
srcs = re.findall(r'<script src="([^"]+)"></script>', html)
if not srcs:
    raise SystemExit('ERROR: index.html me koi <script src> nahi mila!')

combined = '\n'.join(read(os.path.join(HERE, s)) for s in srcs)
first = '<script src="%s"></script>' % srcs[0]
html = html.replace(first, '<script>\n' + combined + '\n</script>', 1)
for s in srcs[1:]:
    html = html.replace('<script src="%s"></script>' % s, '', 1)

if '<script src=' in html or '<link rel="stylesheet"' in html:
    raise SystemExit('ERROR: kuch files inline nahi hui!')
if html.count('<script>') != 1:
    raise SystemExit('ERROR: script blocks merge nahi hue!')

io.open(OUT, 'w', encoding='utf-8').write(html)
print('Built OK ->', OUT)
