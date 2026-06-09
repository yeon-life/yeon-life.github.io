import json
import re

path = r"C:\Users\jinwo\OneDrive\문서\Claude\Projects\연라이프 홈페이지 제작\yeon-life.github.io\어린이의_결_유치_월간\index.html"
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

pattern = re.compile(r'<script id="issue-data" type="application/json">(.*?)</script>', re.DOTALL)
matches = pattern.findall(content)

data = json.loads(matches[0].strip())
future_corner = [c for c in data["corners"] if c["key"] == "future"][0]

with open("scratch/future_body_out.txt", "w", encoding="utf-8") as out:
    out.write(future_corner["body_md"])

print("Done writing future body to scratch/future_body_out.txt")
