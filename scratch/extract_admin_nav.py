with open('c:/Claude/연라이프/scratch/admin_js.js', 'r', encoding='utf-8') as f:
    text = f.read()

# Let's search for 'panel-' or tab click listeners or functions that render panels.
import re

# We will search for references to panel-
import re
lines = text.split('\n')
matches = []
for i, line in enumerate(lines):
    if any(k in line for k in ['panel-', 'admin-nav', 'doLogin', 'toggleAdmin', 'showAdminPanel']):
        matches.append(f'{i+1}: {line}')

with open('c:/Claude/연라이프/scratch/admin_nav.txt', 'w', encoding='utf-8') as out:
    out.write('\n'.join(matches))

print(f'Saved {len(matches)} matching lines to scratch/admin_nav.txt')
