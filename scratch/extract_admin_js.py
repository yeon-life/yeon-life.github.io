import os

src_path = 'c:/Claude/연라이프/y-life_v6_2026-05-18/index.html'
dest_path = 'c:/Claude/연라이프/scratch/admin_js.js'

with open(src_path, 'r', encoding='utf-8') as f:
    text = f.read()

# Let's find script blocks or search for admin panels tabs/functions, e.g. panel-posts, panel-members, doLogin, etc.
# We will search for keywords: 'panel-users', 'panel-members', 'admin-nav-item', 'gabia', 'firebase'
# and extract the script content around them.
import re

# Let's search for script segments containing 'admin' or 'gabia'
scripts = re.findall(r'<script>(.*?)</script>', text, re.DOTALL)
matches = []
for i, s in enumerate(scripts):
    if 'panel-posts' in s or 'panel-users' in s or 'admin-nav-item' in s or 'gabia_status' in s or 'secretHint' in s or 'openAdmin' in s:
        matches.append((i, s))

with open(dest_path, 'w', encoding='utf-8') as out:
    for idx, s in matches:
        out.write(f'// --- SCRIPT BLOCK {idx} CONTAINING ADMIN LOGIC ---\n')
        out.write(s)
        out.write('\n\n')

print(f'Saved matches to {dest_path}')
