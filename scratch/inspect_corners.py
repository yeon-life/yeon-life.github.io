import json
import re

path = r"C:\Users\jinwo\OneDrive\문서\Claude\Projects\연라이프 홈페이지 제작\yeon-life.github.io\어린이의_결_유치_월간\index.html"
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

pattern = re.compile(r'<script id="issue-data" type="application/json">(.*?)</script>', re.DOTALL)
matches = pattern.findall(content)

data = json.loads(matches[0].strip())
corners = data.get("corners", [])

with open("scratch/inspect_corners.txt", "w", encoding="utf-8") as out:
    for idx, c in enumerate(corners):
        out.write(f"Corner {idx}: key={c.get('key')}, title={c.get('title')}\n")
        out.write(f"  headline: {c.get('headline')}\n")
        out.write(f"  keys in corner: {list(c.keys())}\n")
        body = c.get('body_md', '')
        out.write(f"  body length: {len(body)}\n")
        out.write(f"  body snippet: {repr(body[:100])}\n")
        out.write("-" * 50 + "\n")

print("Done inspecting corners in scratch/inspect_corners.txt")
