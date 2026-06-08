# -*- coding: utf-8 -*-
# 각 책 index.html(오므리 셸) -> 완성본.html(진짜 책 리더)로 교체 + 제목/메타/JSON-LD 정정
import os, re, json, shutil, html as H
BASE = r"C:/Users/jinwo/OneDrive/문서/Claude/Projects/연라이프 홈페이지 제작/yeon-life.github.io/도서관"
SH = os.path.join(BASE, "완성책장")

def f1(t, k):
    m = re.search(k + r'\s*:\s*["\'`]([^"\'`]+)["\'`]', t)
    return m.group(1).strip() if m else ""

replaced = titled = skipped_sample = no_engine = 0
for d in sorted(os.listdir(SH)):
    p = os.path.join(SH, d)
    if not os.path.isdir(p):
        continue
    if d.endswith("샘플"):          # 한·영 특별 샘플 보존(건드리지 않음)
        skipped_sample += 1
        continue
    engine = os.path.join(p, "완성본.html")
    idx = os.path.join(p, "index.html")
    dj = os.path.join(p, "data.js")
    if not os.path.exists(engine):
        no_engine += 1
        continue
    # 1) 진짜 리더로 교체
    shutil.copyfile(engine, idx)
    replaced += 1
    # 2) 제목/메타/JSON-LD 정정 (data.js 기준)
    title = sub = ""
    if os.path.exists(dj):
        dt = open(dj, encoding="utf-8", errors="ignore").read()[:1500]
        title = f1(dt, "title"); sub = f1(dt, "sub")
    if not title:
        title = re.sub(r"^\d+_?", "", d)
    et = H.escape(title); esub = H.escape(sub)
    html = open(idx, encoding="utf-8", errors="ignore").read()
    if "<title>" in html:
        html = re.sub(r"<title>.*?</title>", "<title>" + et + " — 연 작은도서관</title>", html, count=1, flags=re.S)
    else:
        html = html.replace("<head>", "<head>\n<title>" + et + " — 연 작은도서관</title>", 1)
    if 'name="description"' not in html and "name='description'" not in html:
        html = html.replace("</title>", "</title>\n<meta name=\"description\" content=\"" + (esub or et) + "\">", 1)
    if "application/ld+json" not in html and "</head>" in html:
        ld = {"@context": "https://schema.org", "@type": "Book", "name": title, "inLanguage": "ko",
              "author": {"@type": "Organization", "name": "연 작은도서관"}, "description": sub, "genre": "동화"}
        html = html.replace("</head>", '<script type="application/ld+json">' + json.dumps(ld, ensure_ascii=False) + '</script>\n</head>', 1)
    open(idx, "w", encoding="utf-8").write(html)
    titled += 1

print("index<-완성본 교체:", replaced, "/ 제목·메타 정정:", titled, "/ 샘플 보존:", skipped_sample, "/ 완성본없음:", no_engine)
