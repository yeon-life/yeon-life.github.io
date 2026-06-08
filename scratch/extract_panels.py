with open('c:/Claude/연라이프/y-life_v6_2026-05-18/index.html', 'r', encoding='utf-8') as f:
    text = f.read()

# Let's search for admin-panel divs and extract them
import re
panels = re.findall(r'<div class=\"admin-panel\" id=\"panel-[^\"]*\".*?</div>\s*<!-- /panel-', text, re.DOTALL)
if not panels:
    panels = re.findall(r'<div class=\"admin-panel\" id=\"panel-.*?</aside>', text, re.DOTALL) # fallback

# Let's find all occurrences of <div class="admin-panel"
idx = 0
found_panels = []
while True:
    idx = text.find('class="admin-panel"', idx)
    if idx == -1:
        break
    # extract 4000 characters from this point
    found_panels.append(text[idx-50:idx+4000])
    idx += 1

with open('c:/Claude/연라이프/scratch/admin_panels.txt', 'w', encoding='utf-8') as out:
    for i, p in enumerate(found_panels):
        out.write(f'// --- PANEL {i} ---\n')
        out.write(p)
        out.write('\n\n')

print(f'Extracted {len(found_panels)} panels.')
