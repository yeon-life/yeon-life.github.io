import json
import re

path = r"C:\Users\jinwo\OneDrive\문서\Claude\Projects\연라이프 홈페이지 제작\yeon-life.github.io\어린이의_결_유치_월간\index.html"
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

pattern = re.compile(r'<script id="issue-data" type="application/json">(.*?)</script>', re.DOTALL)
matches = pattern.findall(content)

with open("scratch/yuchi_debug.txt", "w", encoding="utf-8") as out:
    out.write(f"Found {len(matches)} matches\n")
    for i, match in enumerate(matches):
        out.write(f"\n--- Match {i+1} (length {len(match)}) ---\n")
        try:
            data = json.loads(match.strip())
            out.write("Valid JSON!\n")
            out.write(f"Keys: {list(data.keys())}\n")
            out.write(f"Number of corners: {len(data.get('corners', []))}\n")
            for idx, c in enumerate(data.get("corners", [])):
                out.write(f"  [{idx}] Corner: {c.get('key')} - {c.get('title')}\n")
        except Exception as e:
            out.write(f"JSON Error: {str(e)}\n")
            out.write("START:\n")
            out.write(match[:500] + "\n")
            out.write("...\n")
            out.write("END:\n")
            out.write(match[-500:] + "\n")
print("Done writing debug output to scratch/yuchi_debug.txt")
