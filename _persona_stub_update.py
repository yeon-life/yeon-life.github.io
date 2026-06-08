# -*- coding: utf-8 -*-
import re
p = r"C:/Users/jinwo/OneDrive/문서/Claude/Projects/연라이프 홈페이지 제작/yeon-life.github.io/data/personas.js"
t = open(p, encoding='utf-8').read()
new = {
'kr-01': "{ id:'kr-01', date:'2026-05-19', title:'KAIST, 버리던 부산물로 친환경 원료 ─ 이번 KAIST 연구 두 가지',\n        kicker:'이상엽 교수팀 바이오 플랫폼 · 윤국진 교수팀 CVPR 2026',\n        excerpt:'바이오디젤 부산물 글리세롤로 친환경 원료를 만든 연구와, 컴퓨터 비전 학회 CVPR 2026에 논문 10편을 채택시킨 연구실 소식을 출처와 함께 정리했습니다.' }",
'kp-01': "{ id:'kp-01', date:'2026-05-19', title:'해설 ─ 버리는 글리세롤이 왜 귀한 원료가 되나',\n        kicker:'KAIST 이상엽 교수팀 연구 풀어 읽기',\n        excerpt:'바이오디젤을 만들 때 남는 부산물이 어떻게 플라스틱·섬유 원료로 바뀌는지, 그 원리와 의미를 한 걸음 깊이 풀어 봅니다.' }",
'ur-01': "{ id:'ur-01', date:'2025-11-11', title:'UNIST 소식 ─ 햇빛으로 그린수소, 그리고 대학 자체 AI',\n        kicker:'장지욱·서관용 교수팀 태양광 수소 · 유니아이(UNIAI)',\n        excerpt:'사탕수수 찌꺼기와 햇빛으로 수소를 만든 연구와, 국내 대학 최초로 자체 생성형 AI를 공개한 UNIST 소식을 출처와 함께 전합니다.' }",
'up-01': "{ id:'up-01', date:'2025-04-16', title:'해설 ─ 전기 없이 햇빛만으로 수소를 만든다는 것',\n        kicker:'UNIST 태양광 수소 연구 풀어 읽기',\n        excerpt:'광전극이 햇빛을 받아 물에서 수소를 얻는 원리와, 상용화 기준의 4배라는 수치가 뜻하는 바를 신중히 풀어 봅니다.' }",
'us-01': "{ id:'us-01', date:'2025-11-11', title:'우리 학교가 자체 AI를 만들었대 ─ 학생 눈으로 본 유니아이',\n        kicker:'UNIST 캠퍼스, 학생의 눈으로',\n        excerpt:'국내 대학 최초로 UNIST가 자체 생성형 AI 유니아이를 공개했습니다. 학생이라면 이걸 어떻게 받아들일까, 솔직한 마음을 적었습니다.' }",
}
cnt = 0
for pid, obj in new.items():
    pat = re.compile(r"\{\s*id:'" + pid + r"'.*?\}", re.S)
    t, n = pat.subn(lambda m: obj, t)
    if n == 1:
        cnt += 1
    else:
        print("매칭 실패:", pid, n)
open(p, 'w', encoding='utf-8').write(t)
print("stub 갱신:", cnt, "/5")
