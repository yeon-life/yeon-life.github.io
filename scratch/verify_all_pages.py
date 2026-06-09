import json
import re
import os

cwd = r"C:\Users\jinwo\OneDrive\문서\Claude\Projects\연라이프 홈페이지 제작\yeon-life.github.io"

def check_html(file_path, out_file):
    out_file.write(f"\nChecking {os.path.basename(file_path)}...\n")
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Extract <script id="issue-data" type="application/json">
    pattern = re.compile(r'<script id="issue-data" type="application/json">(.*?)</script>', re.DOTALL)
    matches = pattern.findall(content)
    out_file.write(f"Found {len(matches)} matches\n")
    for i, match in enumerate(matches):
        try:
            data = json.loads(match.strip())
            out_file.write(f"  Match {i+1} JSON valid!\n")
            out_file.write(f"  Issue: {data.get('issue')}\n")
            out_file.write(f"  Corners: {len(data.get('corners', []))}\n")
            for idx, c in enumerate(data.get('corners', [])):
                out_file.write(f"    [{idx}] {c.get('key')} - {c.get('title')} - body length: {len(c.get('body_md', ''))}\n")
        except Exception as e:
            out_file.write(f"  Match {i+1} JSON ERROR: {e}\n")

with open("scratch/verify_pages_out.txt", "w", encoding="utf-8") as out_file:
    check_html(os.path.join(cwd, "어린이의_결_월간", "index.html"), out_file)
    check_html(os.path.join(cwd, "어린이의_결_유치_월간", "index.html"), out_file)

print("Done writing results to scratch/verify_pages_out.txt")
