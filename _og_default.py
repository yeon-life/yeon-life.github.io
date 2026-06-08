# -*- coding: utf-8 -*-
# 주요 공개 페이지에 OG/트위터 공유 이미지 기본값 적용 (없으면 삽입, 아이콘이면 교체)
import os, re
BASE = r"C:/Users/jinwo/OneDrive/문서/Claude/Projects/연라이프 홈페이지 제작/yeon-life.github.io"
OG = "https://y-life.kr/assets/img/og-share.png"
pages = [
    "블로그_AI작가기자_인덱스.html","블로그_페르소나.html","블로그_페르소나_칼럼.html","블로그_페르소나_상점.html",
    "광장_생각지도.html","광장의_진짜_목적.html","단계2_광장글_상세페이지.html",
    "ulsan.html","news.html","parent.html","student.html","column.html","writers.html",
    "question-forest.html","saranbang.html","마이페이지_효능감.html","writer-yeonsosa.html",
]
done = 0
for f in pages:
    p = os.path.join(BASE, f)
    if not os.path.exists(p):
        continue
    t = open(p, encoding="utf-8", errors="ignore").read()
    o = t
    # 기존 og:image / twitter:image content 교체 (아이콘 등)
    t = re.sub(r'(<meta[^>]*property=["\']og:image["\'][^>]*content=)["\'][^"\']*["\']', r'\1"%s"' % OG, t, count=1)
    t = re.sub(r'(<meta[^>]*name=["\']twitter:image["\'][^>]*content=)["\'][^"\']*["\']', r'\1"%s"' % OG, t, count=1)
    # og:image 가 아예 없으면 <title> 뒤에 삽입
    if "og:image" not in t:
        if "</title>" in t:
            t = t.replace("</title>",
                '</title>\n<meta property="og:image" content="%s">\n<meta name="twitter:image" content="%s">\n<meta name="twitter:card" content="summary_large_image">' % (OG, OG),
                1)
    if t != o:
        open(p, "w", encoding="utf-8").write(t)
        done += 1
        print("OG 적용:", f)
print("총 적용:", done)
