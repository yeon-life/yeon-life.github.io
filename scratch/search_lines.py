with open("index.html", "r", encoding="utf-8") as f:
    lines = f.readlines()

with open("scratch/search_lines_out.txt", "w", encoding="utf-8") as out:
    for idx, line in enumerate(lines):
        if "수풀" in line or "영풀" in line or "올풀" in line or "과풀" in line:
            out.write(f"Line {idx+1}: {line.strip()}\n")

print("Done")
