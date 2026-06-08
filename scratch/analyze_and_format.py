# -*- coding: utf-8 -*-
import re
import sys

# Ensure UTF-8 output
sys.stdout.reconfigure(encoding='utf-8')

file_path = r"C:/Users/jinwo/OneDrive/문서/Claude/Projects/연라이프 홈페이지 제작/yeon-life.github.io/data/personas.js"

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# We want to parse each persona object in window.YL_PERSONAS.
# Since JavaScript objects are not strict JSON, let's use regex to find each object.
# Find objects starting with { and ending with }, handling posts array.
# Let's split personas by the main persona blocks in YL_PERSONAS.
# We can find each block by matching:
# slug: '...', kind: '...', name: '...', role: '...', posts: [...]

# Let's do a more robust regex parsing.
# We can find all blocks that contain name and posts.
persona_pattern = re.compile(
    r"\{\s*slug\s*:\s*'([^']+)'"  # slug
    r",\s*kind\s*:\s*'([^']+)'"  # kind
    r",\s*name\s*:\s*'([^']+)'"  # name
    r".*?role\s*:\s*'([^']+)'"   # role
    r".*?posts\s*:\s*\[(.*?)\]\s*,\s*\}", # posts block
    re.DOTALL
)

matches = persona_pattern.findall(content)

# If the above strict pattern misses guest/student authors due to missing fields, 
# let's write a parser that handles all YL_PERSONAS array elements.
# Let's find all `{` ... `}` blocks in YL_PERSONAS.
# Actually, since guest and student authors don't have posts in the array (posts:[]), 
# we should list them too.
# Let's search for: name: '...' or name: "..." and posts: [...] or posts: []
all_personas_pattern = re.compile(
    r"slug\s*:\s*'([^']+)'"
    r".*?name\s*:\s*'([^']+)'"
    r".*?role\s*:\s*'([^']+)'"
    r".*?posts\s*:\s*\[(.*?)\]",
    re.DOTALL
)

all_matches = all_personas_pattern.findall(content)

# Let's collect all posts and classify them by date.
# We care about "최근 5일정도" (recent 5 days in the dataset).
# In the dataset, the latest dates are around 2026-05-12, 2026-05-14, 2026-05-15, 2026-05-17, 2026-05-19.
# Let's check these dates:
# 2026-05-15, 2026-05-16, 2026-05-17, 2026-05-18, 2026-05-19.
# Let's also check if there are any June 2026 dates (none in file, but let's check).
target_dates = ['2026-05-15', '2026-05-16', '2026-05-17', '2026-05-18', '2026-05-19']

# We can also check ALL dates or let the script list all post dates.
# Let's find all dates for all posts.
results = []
all_dates = set()

for slug, name, role, posts_str in all_matches:
    post_matches = re.findall(r"\{\s*id\s*:\s*'([^']+)'\s*,\s*date\s*:\s*'([^']+)'\s*,\s*title\s*:\s*'([^']+)'", posts_str)
    
    post_counts = {}
    for pid, date, title in post_matches:
        all_dates.add(date)
        post_counts[date] = post_counts.get(date, 0) + 1
        
    results.append({
        'name': name,
        'role': role,
        'slug': slug,
        'post_counts': post_counts,
        'total_posts': len(post_matches)
    })

sorted_dates = sorted(list(all_dates))
# Let's focus on the last 5 active dates in the dataset:
# ['2026-05-12', '2026-05-14', '2026-05-15', '2026-05-17', '2026-05-19']
# Or the recent 5 calendar days in the dataset's era:
# 2026-05-15 to 2026-05-19.
# Let's display both!

# Generate markdown table for 2026-05-15 to 2026-05-19
header = "| 작가/기자명 | 역할 | 05-15 | 05-16 | 05-17 | 05-18 | 05-19 | 1일 1개 초과 여부 |"
separator = "|---|---|---|---|---|---|---|---|"
rows = []

for r in results:
    counts = []
    exceeds = "X"
    for d in target_dates:
        count = r['post_counts'].get(d, 0)
        counts.append(str(count) if count > 0 else "-")
        if count > 1:
            exceeds = "O (초과)"
            
    row = f"| {r['name']} ({r['slug']}) | {r['role']} | " + " | ".join(counts) + f" | {exceeds} |"
    rows.append(row)

markdown = f"""# 작가별 최근 5일간 (2026-05-15 ~ 2026-05-19) 작성 글 조사 결과

연라이프 데이터베이스(`personas.js`)에 기록된 작가들의 최근 5일(데이터 상의 가장 최근 5일인 5월 15일 ~ 5월 19일)간의 발행 글 수 조사 결과입니다.

{header}
{separator}
"""
for row in rows:
    markdown += row + "\n"

# Let's also include the full dates found in the database.
markdown += "\n\n## 전체 활동 기록 (데이터 상에 기록된 모든 날짜)\n\n"
full_header = "| 작가/기자명 | 역할 | " + " | ".join(sorted_dates) + " | 총합 |"
full_sep = "|---|---| " + " | ".join(["---"] * len(sorted_dates)) + " |---| "
markdown += full_header + "\n" + full_sep + "\n"

for r in results:
    counts = []
    for d in sorted_dates:
        count = r['post_counts'].get(d, 0)
        counts.append(str(count) if count > 0 else "-")
    markdown += f"| {r['name']} | {r['role']} | " + " | ".join(counts) + f" | {r['total_posts']} |\n"

with open("scratch/results.md", "w", encoding="utf-8") as f:
    f.write(markdown)

print("Markdown generated successfully!")
