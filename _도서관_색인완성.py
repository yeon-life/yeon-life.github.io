# -*- coding: utf-8 -*-
import os, re, json, html as H
BASE = r"C:/Users/jinwo/OneDrive/문서/Claude/Projects/연라이프 홈페이지 제작/yeon-life.github.io/도서관"
SH = os.path.join(BASE, "완성책장")

def f1(t, k):
    m = re.search(k + r'\s*:\s*["\'`]([^"\'`]+)["\'`]', t)
    return m.group(1).strip() if m else ""

def grade_from(s):
    if "고등" in s or re.search(r"고[123]", s): return "고등"
    if "중학" in s or re.search(r"중[123]", s): return "중등"
    if re.search(r"1·2|초등?\s*1|초등?\s*2|초1|초2", s): return "초1·2"
    if re.search(r"3·4|초3|초4", s): return "초3·4"
    if re.search(r"5·6|초5|초6", s): return "초5·6"
    return "전체"

def get_lines(t):
    out = []
    for m in re.finditer(r'line\s*:\s*"([^"]*)"', t):
        out.append(m.group(1).replace("\\n", " ").strip())
    return out

fixed = jsonld = 0
idx = []
sm = []
for d in sorted(os.listdir(SH)):
    p = os.path.join(SH, d)
    ij = os.path.join(p, "index.html")
    dj = os.path.join(p, "data.js")
    if not (os.path.isdir(p) and os.path.exists(ij) and os.path.exists(dj)):
        continue
    dt = open(dj, encoding="utf-8", errors="ignore").read()
    title = f1(dt[:1500], "title") or d
    sub = f1(dt[:1500], "sub")
    badge = f1(dt[:1500], "badge")
    grade = grade_from(badge + " " + title)
    body = " ".join(get_lines(dt))
    et = H.escape(title)
    esub = H.escape(sub)
    url = "완성책장/" + d + "/index.html"
    html = open(ij, encoding="utf-8", errors="ignore").read()
    new = re.sub(r"<title>.*?</title>", "<title>" + et + " — 연 작은도서관</title>", html, count=1, flags=re.S)
    new = re.sub(r'(<meta[^>]*property=["\']og:title["\'][^>]*content=)["\'][^"\']*["\']',
                 r'\1"' + et + ' — 연 작은도서관"', new, count=1)
    if 'name="description"' not in new and "name='description'" not in new:
        new = new.replace("</title>", "</title>\n<meta name=\"description\" content=\"" + (esub or et) + "\">", 1)
    if "application/ld+json" not in new and "</head>" in new:
        ld = {"@context": "https://schema.org", "@type": "Book", "name": title, "inLanguage": "ko",
              "author": {"@type": "Organization", "name": "연 작은도서관"}, "description": sub, "genre": "동화"}
        new = new.replace("</head>", '<script type="application/ld+json">' + json.dumps(ld, ensure_ascii=False) + '</script>\n</head>', 1)
        jsonld += 1
    if new != html:
        open(ij, "w", encoding="utf-8").write(new)
        fixed += 1
    idx.append({"slug": d, "title": title, "sub": sub, "grade": grade, "url": url, "text": body[:1200]})
    sm.append(url)

json.dump({"updated": "2026-06-03", "total": len(idx), "items": idx},
          open(os.path.join(BASE, "search-index.json"), "w", encoding="utf-8"), ensure_ascii=False)
sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
sitemap += '<url><loc>https://y-life.kr/도서관/</loc></url>\n'
for u in sm:
    sitemap += '<url><loc>https://y-life.kr/도서관/' + u + '</loc></url>\n'
sitemap += '</urlset>\n'
open(os.path.join(BASE, "sitemap.xml"), "w", encoding="utf-8").write(sitemap)
print("title/meta fixed:", fixed, "/ jsonld:", jsonld)
print("search-index items:", len(idx), "/ sitemap urls:", len(sm) + 1)
print("sample idx:", idx[8]["title"], "->", idx[8]["text"][:50])
