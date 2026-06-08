import os
import shutil
import re

base_dir = r"C:\Claude\연라이프"
src_ulsan = os.path.join(base_dir, "yeon-ai-kr", "ulsan")
dst_korea = os.path.join(base_dir, "korea")
dst_ulsan = os.path.join(dst_korea, "ulsan")

# 1. Copy yeon-ai-kr/ulsan to korea/ulsan
if os.path.exists(dst_ulsan):
    shutil.rmtree(dst_ulsan)

print(f"Copying {src_ulsan} to {dst_ulsan}...")
shutil.copytree(src_ulsan, dst_ulsan)

# 2. Modify korea/ulsan/index.html
ulsan_index_path = os.path.join(dst_ulsan, "index.html")
if os.path.exists(ulsan_index_path):
    with open(ulsan_index_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Update breadcrumb / platform bar
    content = content.replace('<a href="../">연마을</a>', '<a href="/korea/ulsan/">연마을</a>')
    content = content.replace('© 2026 y-life.kr/yeon-ai-kr/ulsan/', '© 2026 y-life.kr/korea/ulsan/')
    content = content.replace('y-life.kr/yeon-ai-kr/ulsan/yeon-planning/?branch=samsan', 'yeon-samsan.pages.dev')
    content = content.replace('y-life.kr/yeon-ai-kr/ulsan/yeon-planning/?branch=sijung', 'y-life.kr/korea/ulsan/yeon-planning/?branch=sijung')
    content = content.replace('y-life.kr/yeon-ai-kr/ulsan/yeon-planning/?branch=gangdong', 'y-life.kr/korea/ulsan/yeon-planning/?branch=gangdong')
    
    # Update Samsan card link
    # Find '<a href="./yeon-planning/?branch=samsan" class="listing-card">' and replace href
    content = content.replace('href="./yeon-planning/?branch=samsan"', 'href="https://yeon-samsan.pages.dev/" target="_blank"')
    
    # Update other links
    content = content.replace('href="./yeon-planning/?branch=sijung"', 'href="./yeon-planning/?branch=sijung"')
    content = content.replace('href="./yeon-planning/?branch=gangdong"', 'href="./yeon-planning/?branch=gangdong"')
    
    # Save back
    with open(ulsan_index_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Updated korea/ulsan/index.html")

# 3. Create deep shortcut directories and redirect files
# Folders for Samsan
samsan_paths = [
    os.path.join(dst_ulsan, "남구", "삼산동", "교육_연아카데미", "연플래닝아카데미", "삼산분원"),
    os.path.join(dst_ulsan, "남구", "삼산동", "교육_연아카데미", "연플래닝아카데미", "삼산점")
]
for path in samsan_paths:
    os.makedirs(path, exist_ok=True)
    redirect_html = """<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<title>연플래닝아카데미 삼산점 바로가기</title>
<meta http-equiv="refresh" content="0; url=https://yeon-samsan.pages.dev/">
<script>location.replace("https://yeon-samsan.pages.dev/");</script>
</head>
<body>
  <p>연플래닝아카데미 삼산점 페이지로 이동 중입니다... 자동으로 이동하지 않으면 <a href="https://yeon-samsan.pages.dev/">여기를 클릭</a>하세요.</p>
</body>
</html>"""
    with open(os.path.join(path, "index.html"), 'w', encoding='utf-8') as f:
        f.write(redirect_html)

# Folders for Sijung
sijung_paths = [
    os.path.join(dst_ulsan, "남구", "신정동", "교육_연아카데미", "연플래닝아카데미", "시청분원"),
    os.path.join(dst_ulsan, "남구", "신정동", "교육_연아카데미", "연플래닝아카데미", "시청점")
]
for path in sijung_paths:
    os.makedirs(path, exist_ok=True)
    redirect_html = """<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<title>연플래닝아카데미 시청점 바로가기</title>
<meta http-equiv="refresh" content="0; url=/yp/sijung/index.html">
<script>location.replace("/yp/sijung/index.html");</script>
</head>
<body>
  <p>연플래닝아카데미 시청점 페이지로 이동 중입니다... 자동으로 이동하지 않으면 <a href="/yp/sijung/index.html">여기를 클릭</a>하세요.</p>
</body>
</html>"""
    with open(os.path.join(path, "index.html"), 'w', encoding='utf-8') as f:
        f.write(redirect_html)

# Folders for Gangdong
gangdong_paths = [
    os.path.join(dst_ulsan, "북구", "산하동", "교육_연아카데미", "연플래닝아카데미", "강동분원"),
    os.path.join(dst_ulsan, "북구", "산하동", "교육_연아카데미", "연플래닝아카데미", "강동점")
]
for path in gangdong_paths:
    os.makedirs(path, exist_ok=True)
    redirect_html = """<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<title>연플래닝아카데미 강동점 바로가기</title>
<meta http-equiv="refresh" content="0; url=/yp/gangdong/index.html">
<script>location.replace("/yp/gangdong/index.html");</script>
</head>
<body>
  <p>연플래닝아전트 강동점 페이지로 이동 중입니다... 자동으로 이동하지 않으면 <a href="/yp/gangdong/index.html">여기를 클릭</a>하세요.</p>
</body>
</html>"""
    with open(os.path.join(path, "index.html"), 'w', encoding='utf-8') as f:
        f.write(redirect_html)

print("Created deep shortcut redirect directories.")

# 4. Modify korea/ulsan/yeon-planning/index.html to redirect Samsan to pages.dev
planning_index_path = os.path.join(dst_ulsan, "yeon-planning", "index.html")
if os.path.exists(planning_index_path):
    with open(planning_index_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Add JS redirect for samsan at the top of script/head
    redirect_script = """<script>
  (function(){
    var urlParams = new URLSearchParams(window.location.search);
    if(urlParams.get('branch') === 'samsan') {
      window.location.replace("https://yeon-samsan.pages.dev/");
    }
  })();
</script>"""
    # Insert redirect script right after <head>
    content = content.replace('<head>', '<head>\n' + redirect_script)
    
    # Replace any local yeon-ai-kr references
    content = content.replace('/yeon-ai-kr/ulsan/', '/korea/ulsan/')
    
    with open(planning_index_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Updated korea/ulsan/yeon-planning/index.html with Samsan redirect script.")

# 5. Update C:\Claude\연라이프\index.html
root_index_path = os.path.join(base_dir, "index.html")
if os.path.exists(root_index_path):
    with open(root_index_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Replace navigation links
    content = content.replace('href="/yeon-ai-kr/ulsan/"', 'href="/korea/ulsan/"')
    content = content.replace('href="yeon-ai-kr/ulsan/"', 'href="korea/ulsan/"')
    
    # Replace in mega-menu if any
    content = content.replace('https://yeon.ai.kr', '/korea/ulsan/')
    content = content.replace('연마을 yeon.ai.kr', '연마을 (울산)')
    
    with open(root_index_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Updated root index.html navigation links.")

# 6. Update C:\Claude\연라이프\yeon-pwa.js
pwa_js_path = os.path.join(base_dir, "yeon-pwa.js")
if os.path.exists(pwa_js_path):
    with open(pwa_js_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Replace the mega menu link
    content = content.replace('href="https://yeon.ai.kr"', 'href="/korea/ulsan/"')
    content = content.replace('연마을 yeon.ai.kr', '연마을 (울산)')
    content = content.replace('지금 운영 중인 마을 ↗', '울산 소식 마당')
    
    with open(pwa_js_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Updated yeon-pwa.js mega menu reference.")

# 7. Update yp redirect files
yp_samsan_path = os.path.join(base_dir, "yp", "samsan", "index.html")
if os.path.exists(yp_samsan_path):
    with open(yp_samsan_path, 'r', encoding='utf-8') as f:
        content = f.read()
    content = re.sub(r'url=/yeon-ai-kr/ulsan/yeon-planning/\?branch=samsan', 'url=https://yeon-samsan.pages.dev/', content)
    content = content.replace('/yeon-ai-kr/ulsan/yeon-planning/?branch=samsan', 'https://yeon-samsan.pages.dev/')
    with open(yp_samsan_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Updated yp/samsan/index.html to redirect to pages.dev")

yp_sijung_path = os.path.join(base_dir, "yp", "sijung", "index.html")
if os.path.exists(yp_sijung_path):
    with open(yp_sijung_path, 'r', encoding='utf-8') as f:
        content = f.read()
    content = content.replace('/yeon-ai-kr/ulsan/yeon-planning/?branch=sijung', '/korea/ulsan/yeon-planning/?branch=sijung')
    with open(yp_sijung_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Updated yp/sijung/index.html redirect path")

yp_gangdong_path = os.path.join(base_dir, "yp", "gangdong", "index.html")
if os.path.exists(yp_gangdong_path):
    with open(yp_gangdong_path, 'r', encoding='utf-8') as f:
        content = f.read()
    content = content.replace('/yeon-ai-kr/ulsan/yeon-planning/?branch=gangdong', '/korea/ulsan/yeon-planning/?branch=gangdong')
    with open(yp_gangdong_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Updated yp/gangdong/index.html redirect path")

# 8. Delete yeon-ai-kr directory from C:\Claude\연라이프
src_yeon_ai_kr = os.path.join(base_dir, "yeon-ai-kr")
if os.path.exists(src_yeon_ai_kr):
    print(f"Removing old {src_yeon_ai_kr} directory...")
    shutil.rmtree(src_yeon_ai_kr)
    print("Removed yeon-ai-kr directory.")

print("Rebuilding process finished successfully!")
