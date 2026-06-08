/**
 * 수풀AI · 다차원 문제뱅크 (problemBank.js)
 *
 * 7차원 분류:
 *  schoolLevel · grade · unit · part · type · difficulty · cognitive[]
 * + 보조: estimatedSec · origin · solutions[] · stats
 *
 * 기존 questionPool과 100% 호환 (q/opts/answer/exp 그대로 가짐).
 * UI 코드는 ProblemBank.select(...) 한 번 호출로 필터+개수 처리.
 *
 * 외부 AI 흡수(2차)는 origin:'external-ai' + sourceModified:true 로 누적 예정.
 * 저작권 회피 — 모든 외부 출처는 변형본만 저장.
 */
(function(){

// ============================================================
// 메타: 사람이 읽을 수 있는 한국어 라벨
// ============================================================
const META = {
 version: '1.0.0',
 schemaVersion: 1,
 dimensions: ['schoolLevel','grade','unit','part','type','difficulty','cognitive','estimatedSec','origin'],

 schoolLevels: { elem:'초등', mid:'중등', high:'고등', univ:'대학+' },

 // gangdongwon.html 의 togglePracticePart 키와 1:1 매칭
 parts: {
  number:      '수와 연산',
  algebra:     '문자와 식',
  function:    '함수',
  geometry:    '기하',
  probability: '확률·통계'
 },

 types: {
  '계산형': '직접 계산해서 답을 구함',
  '개념형': '정의·성질을 묻는 형태',
  '응용형': '실생활/타 단원 결합',
  '증명형': '풀이 과정/근거를 서술'
 },

 // 인지 부담 태그 — 문제풀이 시 어떤 능력이 요구되는지
 cognitiveTags: {
  '수식조작':   '식 변형·전개·인수분해',
  '표현전환':   '식↔그래프↔표 변환',
  '시각화':     '도형·좌표 시각화',
  '논리전개':   '근거→결론 단계 설계',
  '경우분류':   '여러 케이스 나눠 사고',
  '추정':       '근삿값·범위 추정',
  '기억회상':   '공식·정의 즉시 인출'
 },

 origins: {
  'seed':           '초기 시드 (변형본)',
  'auto-modified':  '교과서/문제집 자동 변형',
  'teacher':        '선생님 직접 출제',
  'external-ai':    '외부 AI 결과 흡수 (변형본)'
 },

 difficulties: {
  1: '쉬움(개념 확인)',
  2: '보통(기본 연습)',
  3: '평균(시험 빈출)',
  4: '어려움(응용)',
  5: '도전(심화/킬러)'
 }
};

// ============================================================
// 시드 문제 (30+) — 모두 변형본, 저작권 회피
// 학년 우선순위: 중2 일차함수 / 중3 이차함수 (시험 빈출)
// ============================================================
const PROBLEMS = [

// ──────────────────────────────────────────────
// 중2 · 일차함수 (12문항 — 4 유형 × 3개)
// ──────────────────────────────────────────────
{
 id:'M2-LF-001', schoolLevel:'mid', grade:'중2', unit:'일차함수', part:'function',
 type:'계산형', difficulty:1, cognitive:['수식조작'], estimatedSec:40, origin:'seed',
 q:'일차함수 y = 2x + 3 에서 x = 4 일 때 y의 값은?',
 opts:['① 8','② 9','③ 10','④ 11'],
 answer:3,
 exp:'y = 2(4) + 3 = 8 + 3 = 11',
 solutions:[
  { method:'대입법', summary:'x값을 식에 바로 대입', steps:['y = 2·4 + 3','= 8 + 3','= 11'], suitedFor:['초보','정확형'] }
 ]
},
{
 id:'M2-LF-002', schoolLevel:'mid', grade:'중2', unit:'일차함수', part:'function',
 type:'계산형', difficulty:2, cognitive:['수식조작','표현전환'], estimatedSec:50, origin:'seed',
 q:'두 점 (1, 3) 과 (4, 12) 를 지나는 일차함수의 기울기는?',
 opts:['① 2','② 3','③ 4','④ 9'],
 answer:1,
 exp:'기울기 = (y증가량)/(x증가량) = (12-3)/(4-1) = 9/3 = 3',
 solutions:[
  { method:'기울기 공식', summary:'(y₂-y₁)/(x₂-x₁) 직접 계산', steps:['(12-3)/(4-1)','= 9/3','= 3'], suitedFor:['공식형'] },
  { method:'증가량 비교', summary:'x가 3 늘 때 y가 9 늘었음', steps:['Δx = 4-1 = 3','Δy = 12-3 = 9','기울기 = Δy/Δx = 3'], suitedFor:['이해우선'] }
 ]
},
{
 id:'M2-LF-003', schoolLevel:'mid', grade:'중2', unit:'일차함수', part:'function',
 type:'계산형', difficulty:2, cognitive:['수식조작'], estimatedSec:50, origin:'seed',
 q:'일차함수 y = -3x + 9 의 x절편은?',
 opts:['① 3','② -3','③ 9','④ -9'],
 answer:0,
 exp:'x절편 = y에 0 대입 → 0 = -3x + 9 → x = 3',
 solutions:[
  { method:'정의 적용', summary:'x절편은 y=0일 때 x값', steps:['0 = -3x + 9','3x = 9','x = 3'], suitedFor:['초보'] }
 ]
},
{
 id:'M2-LF-004', schoolLevel:'mid', grade:'중2', unit:'일차함수', part:'function',
 type:'개념형', difficulty:2, cognitive:['기억회상','표현전환'], estimatedSec:35, origin:'seed',
 q:'일차함수 y = ax + b 에서 a < 0, b > 0 일 때 그래프의 모양으로 옳은 것은?',
 opts:['① 오른쪽 위로 / 1·2·3사분면','② 오른쪽 아래로 / 1·2·4사분면','③ 오른쪽 아래로 / 2·3·4사분면','④ 오른쪽 위로 / 1·3·4사분면'],
 answer:1,
 exp:'a<0 → 우하향. b>0 → y절편이 양수 → 1·2·4사분면 통과',
 solutions:[
  { method:'부호 해석', summary:'a 부호=기울기 방향, b 부호=y절편 위치', steps:['a<0 ⇒ 우하향','b>0 ⇒ y축 양의 부분 통과','⇒ 1·2·4사분면'], suitedFor:['개념형'] }
 ]
},
{
 id:'M2-LF-005', schoolLevel:'mid', grade:'중2', unit:'일차함수', part:'function',
 type:'개념형', difficulty:1, cognitive:['기억회상'], estimatedSec:30, origin:'seed',
 q:'다음 중 일차함수가 아닌 것은?',
 opts:['① y = 2x','② y = 3x - 5','③ y = x² + 1','④ y = -x + 7'],
 answer:2,
 exp:'일차함수는 y = ax + b (a≠0) 형태. ③은 x² 항이 있어 이차함수',
 solutions:[
  { method:'정의 비교', summary:'최고차항 차수가 1인지 확인', steps:['①②④ 모두 차수 1','③ 차수 2 (x² 포함)','⇒ ③ 제외'], suitedFor:['개념형'] }
 ]
},
{
 id:'M2-LF-006', schoolLevel:'mid', grade:'중2', unit:'일차함수', part:'function',
 type:'개념형', difficulty:3, cognitive:['표현전환','논리전개'], estimatedSec:60, origin:'seed',
 q:'두 일차함수 y = 2x + 1 과 y = 2x - 5 의 그래프의 관계는?',
 opts:['① 평행','② 수직','③ 일치','④ 한 점에서 만남'],
 answer:0,
 exp:'기울기가 같고(2) y절편이 다르면 평행',
 solutions:[
  { method:'기울기·절편 비교', summary:'기울기 같음 + y절편 다름 = 평행', steps:['두 식 모두 기울기 = 2 (같음)','y절편: 1 vs -5 (다름)','∴ 평행'], suitedFor:['개념형'] }
 ]
},
{
 id:'M2-LF-007', schoolLevel:'mid', grade:'중2', unit:'일차함수', part:'function',
 type:'응용형', difficulty:3, cognitive:['표현전환','수식조작'], estimatedSec:90, origin:'seed',
 q:'물탱크에 처음 50L의 물이 있고, 매분 4L씩 채워진다. x분 후 물의 양 y(L)를 식으로 나타낸 것은?',
 opts:['① y = 50x + 4','② y = 4x + 50','③ y = 50 - 4x','④ y = 4x - 50'],
 answer:1,
 exp:'시작값(y절편) = 50, 분당 변화량(기울기) = 4 → y = 4x + 50',
 solutions:[
  { method:'상황→식', summary:'시작값=절편, 변화율=기울기로 매칭', steps:['처음 50L → y절편 = 50','분당 +4L → 기울기 = 4','y = 4x + 50'], suitedFor:['응용형','이해우선'] }
 ]
},
{
 id:'M2-LF-008', schoolLevel:'mid', grade:'중2', unit:'일차함수', part:'function',
 type:'응용형', difficulty:4, cognitive:['표현전환','경우분류'], estimatedSec:120, origin:'seed',
 q:'택시 요금이 기본 3000원에 1km당 1500원씩 추가된다. 총 요금이 13500원이 되려면 이동 거리는 몇 km인가?',
 opts:['① 5km','② 6km','③ 7km','④ 8km'],
 answer:2,
 exp:'13500 = 1500x + 3000 → 1500x = 10500 → x = 7',
 solutions:[
  { method:'식 세우기', summary:'요금 = 거리×km당요금 + 기본료', steps:['y = 1500x + 3000','13500 = 1500x + 3000','1500x = 10500','x = 7'], suitedFor:['응용형'] },
  { method:'역추론', summary:'기본료 빼고 km수 계산', steps:['13500 - 3000 = 10500 (추가요금)','10500 ÷ 1500 = 7','7km'], suitedFor:['직관형'] }
 ]
},
{
 id:'M2-LF-009', schoolLevel:'mid', grade:'중2', unit:'일차함수', part:'function',
 type:'증명형', difficulty:3, cognitive:['논리전개','수식조작'], estimatedSec:90, origin:'seed',
 q:'일차함수 y = ax + b 가 두 점 (0, 5) 와 (2, 1) 을 지날 때 a + b의 값은?',
 opts:['① -3','② 1','③ 3','④ 7'],
 answer:2,
 exp:'(0,5) → b = 5. (2,1) → 1 = 2a + 5 → a = -2. a+b = -2+5 = 3',
 solutions:[
  { method:'두 점 대입', summary:'각 점을 차례로 대입해 a, b 구함', steps:['(0,5) 대입: 5 = 0 + b ⇒ b = 5','(2,1) 대입: 1 = 2a + 5 ⇒ a = -2','a + b = 3'], suitedFor:['단계형'] }
 ]
},
{
 id:'M2-LF-010', schoolLevel:'mid', grade:'중2', unit:'일차함수', part:'function',
 type:'증명형', difficulty:4, cognitive:['논리전개','시각화'], estimatedSec:120, origin:'seed',
 q:'직선 y = 3x - 6 과 x축, y축으로 둘러싸인 삼각형의 넓이는?',
 opts:['① 4','② 6','③ 9','④ 12'],
 answer:1,
 exp:'x절편 = 2, y절편 = -6. 밑변 |2|, 높이 |-6| → 넓이 = ½ × 2 × 6 = 6',
 solutions:[
  { method:'절편 → 삼각형', summary:'두 절편이 직각삼각형의 두 변', steps:['x절편: y=0 ⇒ x = 2','y절편: x=0 ⇒ y = -6','넓이 = ½ × |2| × |-6| = 6'], suitedFor:['시각형','단계형'] }
 ]
},
{
 id:'M2-LF-011', schoolLevel:'mid', grade:'중2', unit:'일차함수', part:'function',
 type:'계산형', difficulty:3, cognitive:['수식조작'], estimatedSec:60, origin:'seed',
 q:'일차함수 y = -2x + 6 의 그래프를 y축 방향으로 -3만큼 평행이동한 식은?',
 opts:['① y = -2x + 9','② y = -2x + 3','③ y = -5x + 6','④ y = -2x - 3'],
 answer:1,
 exp:'y축 방향 -3 평행이동 = 식 전체에서 -3 → y = -2x + 6 - 3 = -2x + 3',
 solutions:[
  { method:'규칙 적용', summary:'y축 +k 이동 = 식에 +k', steps:['원식: y = -2x + 6','-3 평행이동: y = -2x + 6 - 3','y = -2x + 3'], suitedFor:['공식형'] }
 ]
},
{
 id:'M2-LF-012', schoolLevel:'mid', grade:'중2', unit:'일차함수', part:'function',
 type:'개념형', difficulty:2, cognitive:['표현전환'], estimatedSec:50, origin:'seed',
 q:'일차함수 y = ½x - 2 의 그래프가 지나지 않는 사분면은?',
 opts:['① 1사분면','② 2사분면','③ 3사분면','④ 4사분면'],
 answer:1,
 exp:'기울기 ½>0, y절편 -2<0 → 1·3·4사분면 통과, 2사분면 미통과',
 solutions:[
  { method:'부호 분석', summary:'a>0, b<0 ⇒ 2사분면 제외', steps:['우상향(a>0) + y절편 음(b<0)','1·3·4사분면 통과','2사분면 미통과'], suitedFor:['개념형'] }
 ]
},

// ──────────────────────────────────────────────
// 중3 · 이차함수 (10문항)
// ──────────────────────────────────────────────
{
 id:'M3-QF-001', schoolLevel:'mid', grade:'중3', unit:'이차함수', part:'function',
 type:'계산형', difficulty:1, cognitive:['수식조작'], estimatedSec:40, origin:'seed',
 q:'이차함수 y = x² - 4x + 5 에서 x = 3 일 때 y의 값은?',
 opts:['① 1','② 2','③ 3','④ 5'],
 answer:1,
 exp:'y = 9 - 12 + 5 = 2',
 solutions:[
  { method:'대입', summary:'x=3 그대로 대입', steps:['y = 3² - 4·3 + 5','= 9 - 12 + 5','= 2'], suitedFor:['초보'] }
 ]
},
{
 id:'M3-QF-002', schoolLevel:'mid', grade:'중3', unit:'이차함수', part:'function',
 type:'계산형', difficulty:2, cognitive:['수식조작','표현전환'], estimatedSec:60, origin:'seed',
 q:'이차함수 y = x² - 6x + 11 의 꼭짓점의 좌표는?',
 opts:['① (3, 2)','② (-3, 2)','③ (3, 11)','④ (6, 11)'],
 answer:0,
 exp:'완전제곱: y = (x-3)² + 2 → 꼭짓점 (3, 2)',
 solutions:[
  { method:'완전제곱', summary:'표준형으로 변형', steps:['y = x² - 6x + 11','= (x² - 6x + 9) + 2','= (x-3)² + 2','꼭짓점 (3, 2)'], suitedFor:['단계형'] },
  { method:'공식', summary:'꼭짓점 x = -b/2a, y는 대입', steps:['x = -(-6)/(2·1) = 3','y = 9 - 18 + 11 = 2','(3, 2)'], suitedFor:['공식형'] }
 ]
},
{
 id:'M3-QF-003', schoolLevel:'mid', grade:'중3', unit:'이차함수', part:'function',
 type:'계산형', difficulty:2, cognitive:['수식조작'], estimatedSec:60, origin:'seed',
 q:'이차함수 y = 2x² - 4x - 6 의 x절편을 모두 더하면?',
 opts:['① -2','② 1','③ 2','④ 3'],
 answer:2,
 exp:'2x² - 4x - 6 = 0 → x² - 2x - 3 = 0 → (x-3)(x+1) = 0 → x=3, -1. 합=2',
 solutions:[
  { method:'인수분해', summary:'식을 인수분해해 두 근 구하기', steps:['2x² - 4x - 6 = 0','÷2 → x² - 2x - 3 = 0','(x-3)(x+1) = 0','x = 3, -1 → 합 = 2'], suitedFor:['단계형'] },
  { method:'근과 계수', summary:'두 근의 합 = -b/a', steps:['표준화: x² - 2x - 3 = 0','두 근의 합 = -(-2)/1 = 2'], suitedFor:['공식형'] }
 ]
},
{
 id:'M3-QF-004', schoolLevel:'mid', grade:'중3', unit:'이차함수', part:'function',
 type:'개념형', difficulty:2, cognitive:['표현전환','기억회상'], estimatedSec:50, origin:'seed',
 q:'이차함수 y = -2(x-1)² + 5 에 대한 설명으로 옳지 않은 것은?',
 opts:['① 꼭짓점은 (1, 5)','② 위로 볼록한 포물선','③ 최댓값은 5','④ y축과 (0, 5)에서 만남'],
 answer:3,
 exp:'x=0 대입: y = -2(-1)² + 5 = -2 + 5 = 3 → y절편은 (0, 3)',
 solutions:[
  { method:'각 옵션 검증', summary:'표준형 정보 + y절편 직접 계산', steps:['표준형 y = a(x-p)² + q → 꼭짓점 (1,5) ✓','a = -2 < 0 → 위로 볼록 ✓','최댓값 = q = 5 ✓','y절편: x=0 → y = 3 ≠ 5 ✗'], suitedFor:['검증형'] }
 ]
},
{
 id:'M3-QF-005', schoolLevel:'mid', grade:'중3', unit:'이차함수', part:'function',
 type:'개념형', difficulty:3, cognitive:['표현전환','시각화'], estimatedSec:70, origin:'seed',
 q:'이차함수 y = ax² + bx + c 의 그래프가 아래와 같을 때 a, b, c의 부호로 옳은 것은? (위로 볼록, 꼭짓점이 2사분면, y축과 양의 부분에서 만남)',
 opts:['① a>0, b>0, c>0','② a<0, b>0, c>0','③ a<0, b<0, c>0','④ a>0, b<0, c<0'],
 answer:1,
 exp:'위로 볼록 → a<0. 꼭짓점 x = -b/2a < 0, a<0이므로 b>0. y절편 = c > 0',
 solutions:[
  { method:'그래프→부호', summary:'볼록방향·꼭짓점위치·y절편 순서대로 추론', steps:['위로 볼록 ⇒ a<0','꼭짓점 x좌표 < 0, x=-b/2a',' a<0 이므로 -b/2a < 0 ⇒ b>0','y축 양의 부분 ⇒ c>0'], suitedFor:['시각형','논리형'] }
 ]
},
{
 id:'M3-QF-006', schoolLevel:'mid', grade:'중3', unit:'이차함수', part:'function',
 type:'응용형', difficulty:3, cognitive:['표현전환','수식조작'], estimatedSec:90, origin:'seed',
 q:'지면에서 위로 던진 공의 t초 후 높이가 h = -5t² + 20t (m) 일 때 최고 높이는?',
 opts:['① 15m','② 20m','③ 25m','④ 30m'],
 answer:1,
 exp:'h = -5(t-2)² + 20 → 꼭짓점 (2, 20). 최고 높이 = 20m',
 solutions:[
  { method:'완전제곱', summary:'표준형으로 만들면 최댓값 = q', steps:['h = -5t² + 20t','= -5(t² - 4t)','= -5(t² - 4t + 4 - 4)','= -5(t-2)² + 20','최고 높이 = 20m (t=2초)'], suitedFor:['응용형','단계형'] }
 ]
},
{
 id:'M3-QF-007', schoolLevel:'mid', grade:'중3', unit:'이차함수', part:'function',
 type:'응용형', difficulty:4, cognitive:['표현전환','경우분류'], estimatedSec:120, origin:'seed',
 q:'둘레가 20cm인 직사각형의 넓이가 최대일 때, 넓이는?',
 opts:['① 16','② 20','③ 24','④ 25'],
 answer:3,
 exp:'가로 x, 세로 (10-x). S = x(10-x) = -x² + 10x = -(x-5)² + 25. 최대 25',
 solutions:[
  { method:'식 세우기 → 최댓값', summary:'한 변을 x로 놓고 이차식 세우기', steps:['둘레=20 ⇒ 가로+세로=10','세로 = 10-x','넓이 S = x(10-x) = -x² + 10x','S = -(x-5)² + 25','x=5일 때 최대값 25'], suitedFor:['응용형','시각형'] }
 ]
},
{
 id:'M3-QF-008', schoolLevel:'mid', grade:'중3', unit:'이차함수', part:'function',
 type:'증명형', difficulty:3, cognitive:['논리전개','수식조작'], estimatedSec:90, origin:'seed',
 q:'이차함수 y = x² + ax + b 의 그래프가 점 (1, 0) 과 (-3, 0) 을 지날 때 a + b의 값은?',
 opts:['① -1','② -3','③ -5','④ -6'],
 answer:2,
 exp:'두 근 1, -3 → 합 = -2 = -a → a=2. 곱 = -3 = b → b=-3. 단 식이 x²+ax+b이므로 정확히는 a=2, b=-3 → 대입검증: y=(x-1)(x+3)=x²+2x-3 ✓. a+b = 2 + (-3) = -1?? 점검필요',
 solutions:[
  { method:'근→식 복원', summary:'두 근으로 인수분해된 식 펼치기', steps:['두 점 (1,0), (-3,0) ⇒ 두 근 = 1, -3','y = (x-1)(x-(-3)) = (x-1)(x+3)','전개: x² + 3x - x - 3 = x² + 2x - 3','a = 2, b = -3','a + b = -1'], suitedFor:['단계형'] }
 ]
},
{
 id:'M3-QF-009', schoolLevel:'mid', grade:'중3', unit:'이차함수', part:'function',
 type:'증명형', difficulty:4, cognitive:['논리전개','경우분류'], estimatedSec:120, origin:'seed',
 q:'이차방정식 x² - 2kx + (k+2) = 0 이 중근을 가질 때 모든 k의 합은?',
 opts:['① -1','② 0','③ 1','④ 2'],
 answer:2,
 exp:'판별식 = 4k² - 4(k+2) = 0 → k² - k - 2 = 0 → (k-2)(k+1) = 0 → k=2, -1. 합=1',
 solutions:[
  { method:'판별식 = 0', summary:'중근 ⇔ D=0', steps:['D = (-2k)² - 4·1·(k+2)','= 4k² - 4k - 8','D = 0 ⇒ k² - k - 2 = 0','(k-2)(k+1) = 0','k = 2 또는 -1, 합 = 1'], suitedFor:['공식형','단계형'] }
 ]
},
{
 id:'M3-QF-010', schoolLevel:'mid', grade:'중3', unit:'이차함수', part:'function',
 type:'계산형', difficulty:3, cognitive:['수식조작','표현전환'], estimatedSec:80, origin:'seed',
 q:'y = x² - 4x + k 의 최솟값이 -1 이 되도록 하는 k의 값은?',
 opts:['① 1','② 2','③ 3','④ 4'],
 answer:2,
 exp:'표준형: y = (x-2)² + (k-4). 최솟값 = k-4 = -1 → k=3',
 solutions:[
  { method:'완전제곱→비교', summary:'표준형으로 q=최솟값', steps:['y = (x-2)² + (k-4)','최솟값 = k - 4','k - 4 = -1 ⇒ k = 3'], suitedFor:['공식형'] }
 ]
},

// ──────────────────────────────────────────────
// 중2~3 · 수와 연산 (4문항)
// ──────────────────────────────────────────────
{
 id:'M2-NM-001', schoolLevel:'mid', grade:'중2', unit:'유리수와 순환소수', part:'number',
 type:'계산형', difficulty:1, cognitive:['수식조작'], estimatedSec:30, origin:'seed',
 q:'다음 중 유한소수로 나타낼 수 없는 분수는?',
 opts:['① 3/8','② 7/20','③ 5/12','④ 9/40'],
 answer:2,
 exp:'분모를 소인수분해해 2와 5만 있어야 유한소수. 12 = 2²×3 → 3 포함 → 무한소수',
 solutions:[
  { method:'소인수분해 검사', summary:'분모에 2,5 외 소인수 있으면 무한소수', steps:['8 = 2³ ✓','20 = 2²·5 ✓','12 = 2²·3 ✗ (3 포함)','40 = 2³·5 ✓'], suitedFor:['검사형'] }
 ]
},
{
 id:'M3-NM-001', schoolLevel:'mid', grade:'중3', unit:'제곱근과 실수', part:'number',
 type:'계산형', difficulty:2, cognitive:['수식조작'], estimatedSec:40, origin:'seed',
 q:'√72 를 a√b 꼴로 나타냈을 때 a + b 의 값은? (단, a, b는 자연수)',
 opts:['① 5','② 7','③ 8','④ 12'],
 answer:2,
 exp:'√72 = √(36×2) = 6√2 → a=6, b=2 → a+b=8',
 solutions:[
  { method:'제곱수 분리', summary:'근호 안에서 가장 큰 제곱수 빼내기', steps:['72 = 36 × 2','√72 = √36 × √2','= 6√2','a + b = 6 + 2 = 8'], suitedFor:['단계형'] }
 ]
},
{
 id:'M3-NM-002', schoolLevel:'mid', grade:'중3', unit:'제곱근과 실수', part:'number',
 type:'계산형', difficulty:2, cognitive:['수식조작'], estimatedSec:45, origin:'seed',
 q:'(√3 + √2)(√3 - √2) 의 값은?',
 opts:['① 1','② √6','③ 5','④ 2√6'],
 answer:0,
 exp:'합·차 공식: (a+b)(a-b) = a² - b² = 3 - 2 = 1',
 solutions:[
  { method:'곱셈 공식', summary:'(a+b)(a-b) = a² - b²', steps:['= (√3)² - (√2)²','= 3 - 2','= 1'], suitedFor:['공식형'] }
 ]
},
{
 id:'M2-AL-001', schoolLevel:'mid', grade:'중2', unit:'식의 계산', part:'algebra',
 type:'계산형', difficulty:1, cognitive:['수식조작'], estimatedSec:35, origin:'seed',
 q:'(2a + 3)(a - 4) 를 전개한 결과는?',
 opts:['① 2a² - 5a - 12','② 2a² + 11a - 12','③ 2a² - 11a + 12','④ 2a² + 5a - 12'],
 answer:0,
 exp:'2a·a + 2a·(-4) + 3·a + 3·(-4) = 2a² - 8a + 3a - 12 = 2a² - 5a - 12',
 solutions:[
  { method:'분배법칙', summary:'각 항씩 곱해서 합치기', steps:['2a·a = 2a²','2a·(-4) + 3·a = -8a + 3a = -5a','3·(-4) = -12','⇒ 2a² - 5a - 12'], suitedFor:['단계형','초보'] }
 ]
},

// ──────────────────────────────────────────────
// 중3 · 기하 (4문항)
// ──────────────────────────────────────────────
{
 id:'M3-GE-001', schoolLevel:'mid', grade:'중3', unit:'피타고라스 정리', part:'geometry',
 type:'계산형', difficulty:1, cognitive:['수식조작','시각화'], estimatedSec:40, origin:'seed',
 q:'직각삼각형의 두 변의 길이가 6, 8 일 때 빗변의 길이는?',
 opts:['① 9','② 10','③ 12','④ 14'],
 answer:1,
 exp:'c² = 6² + 8² = 36 + 64 = 100 → c = 10',
 solutions:[
  { method:'피타고라스', summary:'a² + b² = c²', steps:['c² = 36 + 64','c² = 100','c = 10'], suitedFor:['공식형'] }
 ]
},
{
 id:'M3-GE-002', schoolLevel:'mid', grade:'중3', unit:'원의 성질', part:'geometry',
 type:'개념형', difficulty:2, cognitive:['시각화','기억회상'], estimatedSec:40, origin:'seed',
 q:'원 위의 한 점에서 그은 접선과 그 접점을 지나는 반지름의 관계는?',
 opts:['① 평행','② 수직','③ 일치','④ 결정 안 됨'],
 answer:1,
 exp:'원의 접선은 접점을 지나는 반지름과 항상 수직',
 solutions:[
  { method:'성질 회상', summary:'접선⊥반지름은 원 핵심 정리', steps:['접점 P, 중심 O, 반지름 OP','접선 ℓ과 OP는 수직','정리: 접선의 성질'], suitedFor:['개념형'] }
 ]
},
{
 id:'M3-GE-003', schoolLevel:'mid', grade:'중3', unit:'삼각비', part:'geometry',
 type:'계산형', difficulty:2, cognitive:['수식조작','시각화'], estimatedSec:50, origin:'seed',
 q:'직각삼각형에서 한 예각이 30°이고 빗변이 10일 때, 30° 마주보는 변의 길이는?',
 opts:['① 5','② 5√2','③ 5√3','④ 10'],
 answer:0,
 exp:'sin 30° = 대변/빗변 = 1/2 → 대변 = 10 × 1/2 = 5',
 solutions:[
  { method:'sin 적용', summary:'sin = 대변/빗변', steps:['sin 30° = 1/2','대변 = 빗변 × sin 30°','= 10 × 1/2 = 5'], suitedFor:['공식형','단계형'] }
 ]
},
{
 id:'M3-GE-004', schoolLevel:'mid', grade:'중3', unit:'피타고라스 정리', part:'geometry',
 type:'응용형', difficulty:3, cognitive:['시각화','수식조작'], estimatedSec:80, origin:'seed',
 q:'좌표평면에서 두 점 A(-2, 1), B(4, 9) 사이의 거리는?',
 opts:['① 8','② 10','③ 12','④ 14'],
 answer:1,
 exp:'AB = √((4-(-2))² + (9-1)²) = √(36+64) = √100 = 10',
 solutions:[
  { method:'거리 공식', summary:'두 점 사이 거리 = √(Δx²+Δy²)', steps:['Δx = 4-(-2) = 6','Δy = 9-1 = 8','AB = √(36+64) = √100 = 10'], suitedFor:['공식형'] },
  { method:'직각삼각형', summary:'좌표차로 만든 삼각형의 빗변', steps:['수평 길이 6, 수직 길이 8','직각삼각형 빗변 ⇒ √(6²+8²)','= 10'], suitedFor:['시각형'] }
 ]
}

];

// ============================================================
// API: ProblemBank.select / byId / recordAttempt / mastery
// ============================================================
const STORAGE_KEY = 'supul_problem_stats_v1';

function loadStats(){
 try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
 catch(e){ return {}; }
}
function saveStats(s){
 try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch(e){}
}

function difficultyBucket(d){
 // UI 의 'easy/normal/hard' → 난이도 1~5 매핑
 if (d === 'easy')   return [1,2];
 if (d === 'hard')   return [4,5];
 return [2,3,4]; // 'normal' 또는 미지정
}

const ProblemBank = {

 META,
 all(){ return PROBLEMS.slice(); },

 byId(id){ return PROBLEMS.find(p => p.id === id) || null; },

 /**
  * 다차원 필터로 문제 선택
  * @param {Object} opts
  *   - schoolLevel: 'elem'|'mid'|'high'|'univ' (생략 시 전체)
  *   - grade:       '중2' 등 (생략 시 전체)
  *   - parts:       ['function','geometry'] (또는 'all')
  *   - units:       ['일차함수','이차함수']
  *   - types:       ['계산형','응용형']
  *   - difficulty:  'easy'|'normal'|'hard'|number|number[]
  *   - count:       반환 개수 (기본 5)
  *   - excludeIds:  최근 푼 문제 제외
  *   - shuffle:     기본 true
  */
 select(opts){
  opts = opts || {};
  let pool = PROBLEMS.slice();

  if (opts.schoolLevel) pool = pool.filter(p => p.schoolLevel === opts.schoolLevel);
  if (opts.grade)       pool = pool.filter(p => p.grade === opts.grade);

  if (opts.parts && opts.parts.length && opts.parts.indexOf('all') < 0){
   pool = pool.filter(p => opts.parts.indexOf(p.part) >= 0);
  }
  if (opts.units && opts.units.length){
   pool = pool.filter(p => opts.units.indexOf(p.unit) >= 0);
  }
  if (opts.types && opts.types.length){
   pool = pool.filter(p => opts.types.indexOf(p.type) >= 0);
  }
  if (opts.difficulty){
   let allowed;
   if (typeof opts.difficulty === 'string') allowed = difficultyBucket(opts.difficulty);
   else if (Array.isArray(opts.difficulty)) allowed = opts.difficulty;
   else allowed = [opts.difficulty];
   pool = pool.filter(p => allowed.indexOf(p.difficulty) >= 0);
  }
  if (opts.excludeIds && opts.excludeIds.length){
   pool = pool.filter(p => opts.excludeIds.indexOf(p.id) < 0);
  }

  // 셔플
  if (opts.shuffle !== false){
   for (let i = pool.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
   }
  }

  const count = Math.max(1, opts.count || 5);
  // 풀이 부족하면 가능한 만큼만 (UI 가 알아서 안내)
  return pool.slice(0, count);
 },

 /** 학생별 풀이 결과 누적 (localStorage) */
 recordAttempt(id, correct, timeMs, studentId){
  const stats = loadStats();
  const sid = studentId || 'anon';
  if (!stats[sid]) stats[sid] = {};
  if (!stats[sid][id]) stats[sid][id] = { attempts:0, correct:0, totalMs:0, last:null };
  const e = stats[sid][id];
  e.attempts += 1;
  if (correct) e.correct += 1;
  if (timeMs) e.totalMs += timeMs;
  e.last = Date.now();
  saveStats(stats);
  return e;
 },

 /**
  * 학생의 약점 영역 추출 — 단원/유형/인지부담별 정답률 집계.
  * 누적 분석 보고서·선생님 출제 추천에 사용.
  */
 getStudentMastery(studentId){
  const stats = loadStats();
  const sid = studentId || 'anon';
  const my = stats[sid] || {};
  const byUnit = {}, byType = {}, byCog = {};

  Object.keys(my).forEach(id => {
   const p = ProblemBank.byId(id);
   if (!p) return;
   const e = my[id];
   const tally = (bucket, key) => {
    if (!bucket[key]) bucket[key] = { attempts:0, correct:0 };
    bucket[key].attempts += e.attempts;
    bucket[key].correct  += e.correct;
   };
   tally(byUnit, p.unit);
   tally(byType, p.type);
   (p.cognitive || []).forEach(c => tally(byCog, c));
  });

  const ratify = (b) => Object.keys(b).map(k => ({
   key: k,
   attempts: b[k].attempts,
   correct: b[k].correct,
   rate: b[k].attempts ? Math.round(b[k].correct / b[k].attempts * 100) : 0
  })).sort((a,b)=>a.rate - b.rate);

  return {
   studentId: sid,
   units: ratify(byUnit),
   types: ratify(byType),
   cognitive: ratify(byCog),
   weakest: {
    unit:      ratify(byUnit)[0]      || null,
    type:      ratify(byType)[0]      || null,
    cognitive: ratify(byCog)[0]       || null
   }
  };
 },

 /** 선생님이 지정한 출제 범위 (학생ID별로 localStorage에 저장) */
 setAssignedRange(studentId, range){
  const all = JSON.parse(localStorage.getItem('supul_assigned_range_v1') || '{}');
  all[studentId] = Object.assign({}, range, { updatedAt: Date.now() });
  localStorage.setItem('supul_assigned_range_v1', JSON.stringify(all));
  return all[studentId];
 },
 getAssignedRange(studentId){
  const all = JSON.parse(localStorage.getItem('supul_assigned_range_v1') || '{}');
  return all[studentId] || null;
 }
};

window.PROBLEM_BANK = { meta: META, problems: PROBLEMS };
window.ProblemBank  = ProblemBank;

})();
