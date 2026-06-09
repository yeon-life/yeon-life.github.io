import re

with open("index.html", "r", encoding="utf-8") as f:
    content = f.read()

keywords = ['수풀', '영풀', '과풀', '연플래너', 'curiosity', 'y-life']

with open("scratch/portal_apps_debug.txt", "w", encoding="utf-8") as out:
    for kw in keywords:
        matches = list(re.finditer(kw, content))
        out.write(f"Keyword '{kw}': found {len(matches)} matches\n")
        for m in matches:
            start = max(0, m.start() - 150)
            end = min(len(content), m.end() + 150)
            out.write(f"  Match at index {m.start()}:\n")
            out.write(content[start:end] + "\n")
            out.write("-" * 80 + "\n")

print("Done writing to scratch/portal_apps_debug.txt")
