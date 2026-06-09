path = r"C:\Users\jinwo\OneDrive\문서\Claude\Projects\연라이프 홈페이지 제작\yeon-life.github.io\어린이의_결_유치_월간\index.html"
with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

with open("scratch/inspect_middle.txt", "w", encoding="utf-8") as out:
    for idx in range(510, 715):
        if idx < len(lines):
            out.write(f"Line {idx+1}: {lines[idx]}")

print("Done writing lines 511 to 715 to scratch/inspect_middle.txt")
