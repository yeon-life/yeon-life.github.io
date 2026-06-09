import re

path = r"C:\Users\jinwo\OneDrive\문서\Claude\Projects\연라이프 홈페이지 제작\yeon-life.github.io\어린이의_결_유치_월간\index.html"
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Let's see the characters around '</script>'
# Let's find occurrences of </script>
for match in re.finditer(r'</script>', content):
    start = max(0, match.start() - 100)
    end = min(len(content), match.end() + 100)
    print(f"Match at index {match.start()}:")
    print("--- CONTEXT ---")
    print(repr(content[start:end]))
    print("----------------")
