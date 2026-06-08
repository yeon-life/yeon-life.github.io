# -*- coding: utf-8 -*-
import re
import json

file_path = r"C:/Users/jinwo/OneDrive/문서/Claude/Projects/연라이프 홈페이지 제작/yeon-life.github.io/data/personas.js"

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Let's extract the array elements. 
# We can use regular expressions to find each persona block.
# Each block starts with `{` and ends with `}`.
# We can search for posts lists.
# Since it's a JS file, let's parse using a simple state machine or regex.

# Find all blocks of posts: posts:[ ... ]
# We can search for each persona name and their posts.
# Let's find name: '...' or name:"..." and posts:[...]
persona_blocks = re.findall(r"\{\s*slug:'([^']+)',.*?name:'([^']+)',.*?posts:\s*\[(.*?)\]", content, re.DOTALL)

print(f"Found {len(persona_blocks)} personas with posts.")

data = {}
all_dates = set()

for slug, name, posts_str in persona_blocks:
    # Find all post objects inside posts_str: { id:'...', date:'...', title:'...' }
    post_blocks = re.findall(r"\{\s*id:'([^']+)'.*?date:'([^']+)'.*?title:'([^']+)'", posts_str, re.DOTALL)
    data[name] = []
    for pid, date, title in post_blocks:
        data[name].append({
            'id': pid,
            'date': date,
            'title': title
        })
        all_dates.add(date)

print(f"All post dates found in file: {sorted(list(all_dates))}")
print(json.dumps(data, ensure_ascii=False, indent=2))
