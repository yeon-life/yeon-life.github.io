path = r"C:\Users\jinwo\OneDrive\문서\Claude\Projects\연라이프 홈페이지 제작\yeon-life.github.io\어린이의_결_유치_월간\index.html"
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

import re
matches = list(re.finditer(r'</script>', content))

if len(matches) >= 2:
    first_end = matches[0].end()
    second_end = matches[1].end()
    
    clean_content = content[:first_end] + content[second_end:]
    
    with open(path, 'w', encoding='utf-8') as f_out:
        f_out.write(clean_content)
    print("Successfully cleaned yuchi index.html by removing the broken duplicate section!")
else:
    print("Not enough script tags found to clean")
