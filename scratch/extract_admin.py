import os
import re

src_path = 'c:/Claude/연라이프/y-life_v6_2026-05-18/index.html'
dest_path = 'c:/Claude/연라이프/scratch/admin_blocks.txt'

os.makedirs(os.path.dirname(dest_path), exist_ok=True)

with open(src_path, 'r', encoding='utf-8') as f:
    text = f.read()

# Find occurrences of 'admin-overlay'
idx = text.find('admin-overlay')
if idx != -1:
    with open(dest_path, 'w', encoding='utf-8') as out:
        out.write(text[max(0, idx-1000):idx+12000])
    print('Successfully extracted admin block.')
else:
    print('admin-overlay not found in file.')
