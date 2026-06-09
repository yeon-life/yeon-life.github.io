path = r"C:\Users\jinwo\OneDrive\문서\Claude\Projects\연라이프 홈페이지 제작\yeon-life.github.io\어린이의_결_유치_월간\index.html"
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# occurrences of </script>
import re
matches = list(re.finditer(r'</script>', content))

if len(matches) >= 2:
    idx1 = matches[0].end()
    idx2 = matches[1].start()
    with open("scratch/inspect_middle_broken.txt", "w", encoding="utf-8") as out:
        out.write(content[idx1:idx2])
    print(f"Written {idx2 - idx1} characters to scratch/inspect_middle_broken.txt")
else:
    print("Fewer than 2 </script> tags found")
