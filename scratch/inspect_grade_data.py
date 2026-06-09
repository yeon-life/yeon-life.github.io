import re

path = r"C:\Users\jinwo\OneDrive\문서\Claude\Projects\연라이프 홈페이지 제작\yeon-life.github.io\어린이의_결_초등_월간\js\grade_data.js"
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

with open("scratch/grade_data_debug.txt", "w", encoding="utf-8") as out:
    out.write(f"File length: {len(content)} characters.\n")
    out.write("START OF JS:\n")
    out.write(content[:2000] + "\n")
    out.write("\nVariable declarations:\n")
    for m in re.finditer(r'(const|let|var)\s+(\w+)\s*=', content):
        out.write(m.group(0) + "\n")

print("Done writing grade_data.js inspection to scratch/grade_data_debug.txt")
