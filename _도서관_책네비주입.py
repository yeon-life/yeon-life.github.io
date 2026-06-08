# -*- coding: utf-8 -*-
# 각 책 상단에 '연라이프 속 작은 도서관' 네비 바 주입 (연라이프 마크->홈, 도서관 링크)
import os, re
SH = r"C:/Users/jinwo/OneDrive/문서/Claude/Projects/연라이프 홈페이지 제작/yeon-life.github.io/도서관/완성책장"
BAR = ('<div id="yl-libbar" style="background:#2f5d62;color:#fff;'
       "font:600 13px/1 'Pretendard','Apple SD Gothic Neo',sans-serif;"
       'display:flex;align-items:center;gap:10px;padding:9px 14px;position:relative;z-index:99999">'
       '<a href="https://y-life.kr/index.html" style="color:#fff;text-decoration:none" title="연라이프 홈으로">緣 연라이프</a>'
       '<span style="opacity:.5">›</span>'
       '<a href="https://y-life.kr/도서관/" style="color:#e7d9bf;text-decoration:none" title="도서관 전체 목차">📚 연 작은도서관</a>'
       '<span style="margin-left:auto;font-weight:500;opacity:.85;font-size:11px">연라이프 속 작은 도서관</span>'
       '</div>')
done = skip = 0
for d in sorted(os.listdir(SH)):
    p = os.path.join(SH, d)
    ij = os.path.join(p, "index.html")
    if not (os.path.isdir(p) and os.path.exists(ij)):
        continue
    if d.endswith("샘플"):
        skip += 1; continue
    html = open(ij, encoding="utf-8", errors="ignore").read()
    if "yl-libbar" in html:
        skip += 1; continue
    m = re.search(r"<body[^>]*>", html)
    if not m:
        skip += 1; continue
    pos = m.end()
    html = html[:pos] + "\n" + BAR + html[pos:]
    open(ij, "w", encoding="utf-8").write(html)
    done += 1
print("네비 바 주입:", done, "/ 건너뜀(샘플·중복·body없음):", skip)
