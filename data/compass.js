/* 연라이프 — 정치 성향 원형 나침반 (재사용 컴포넌트)
 * 가로 x:-1(좌·분배)~+1(우·시장) / 세로 y:-1(보수·전통)~+1(진보·개방)
 * window.YL_compass(lean) → 카드/프로필에 넣을 HTML 문자열 반환
 *   lean = { x, y, yeon:{x,y}|null, science:true? }
 *   - x,y      : 본인 선언(AI=설계된 관점)  ← 항상 표시
 *   - yeon     : 연라이프 평가(실제 글 분석) ← 있을 때만 둘째 점+연결선. 없으면 '분석 준비 중'
 * 정직 원칙: 글 분석이 없으면 평가 점을 지어내지 않는다.
 */
(function(){
  if (window.YL_compass) return;

  var css =
   ".ylcmp{--blue:#aebfd6;--red:#d8a6a0;--ring:#e0d9cb;--ink:#2a2a2a;margin:12px 0 2px}"
  +".ylcmp-read{font-size:11.5px;font-weight:700;color:#2a2a2a;text-align:center;margin-bottom:2px}"
  +".ylcmp-read .self{font-weight:600;color:#7a7363}"
  +".ylcmp-c{position:relative;width:100%;max-width:172px;aspect-ratio:1/1;margin:8px auto 4px;border-radius:50%;"
  +"background:radial-gradient(circle,transparent 0 60%,rgba(0,0,0,.015) 60% 100%),"
  +"linear-gradient(90deg,var(--blue) 0%,#f1ece2 45%,#f1ece2 55%,var(--red) 100%);"
  +"border:1.5px solid var(--ring);overflow:hidden}"
  +".ylcmp-r{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);border:1px dashed #cfc6b4;border-radius:50%}"
  +".ylcmp-r1{width:33%;height:33%}.ylcmp-r2{width:66%;height:66%}"
  +".ylcmp-cv,.ylcmp-ch{position:absolute;background:#c7bda9}"
  +".ylcmp-cv{left:50%;top:0;bottom:0;width:1.5px;transform:translateX(-50%)}"
  +".ylcmp-ch{top:50%;left:0;right:0;height:1.5px;transform:translateY(-50%)}"
  +".ylcmp-ax{position:absolute;font-size:10px;font-weight:700;color:#555;background:rgba(253,252,248,.82);padding:0 3px;border-radius:3px;z-index:3;line-height:1.15;text-align:center}"
  +".ylcmp-ax .m{display:block;font-size:7.5px;font-weight:500;color:#a59c8c}"
  +".ylcmp-ax.t{top:4px;left:50%;transform:translateX(-50%)}"
  +".ylcmp-ax.b{bottom:4px;left:50%;transform:translateX(-50%)}"
  +".ylcmp-ax.l{left:4px;top:50%;transform:translateY(-50%)}"
  +".ylcmp-ax.rr{right:4px;top:50%;transform:translateY(-50%)}"
  +".ylcmp-tick{position:absolute;top:50%;left:50%;width:4px;height:4px;border-radius:50%;background:#b3a98f;transform:translate(-50%,-50%)}"
  +".ylcmp-link{position:absolute;inset:0;width:100%;height:100%;z-index:1;pointer-events:none}"
  +".ylcmp-d{position:absolute;border-radius:50%;transform:translate(-50%,-50%);z-index:2}"
  +".ylcmp-d.y{width:14px;height:14px;background:var(--ink);border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.3)}"
  +".ylcmp-d.s{width:13px;height:13px;background:#FDFCF8;border:2px dashed var(--ink)}"
  +".ylcmp-d::after{content:attr(data-tag);position:absolute;left:50%;top:116%;transform:translateX(-50%);font-size:8.5px;font-weight:800;color:#000;background:rgba(253,252,248,.9);padding:0 2px;border-radius:2px;white-space:nowrap}"
  +".ylcmp-lg{display:flex;gap:12px;justify-content:center;flex-wrap:wrap;font-size:10px;color:#6b6b6b;margin-top:7px}"
  +".ylcmp-lg i{font-style:normal;display:inline-flex;align-items:center;gap:4px}"
  +".ylcmp-lg .qy{width:10px;height:10px;border-radius:50%;background:var(--ink)}"
  +".ylcmp-lg .qs{width:10px;height:10px;border-radius:50%;background:#FDFCF8;border:2px dashed var(--ink)}"
  +".ylcmp-cap{font-size:9.5px;color:#8a8275;text-align:center;margin-top:5px}";
  var st=document.createElement('style'); st.textContent=css; document.head.appendChild(st);

  function readout(x,y){
    var ew=Math.abs(x)<0.15, ns=Math.abs(y)<0.15;
    if(ew&&ns) return '중도';
    var eco=ew?'':(x<0?'좌':'우'), soc=ns?'':(y>0?'진보':'보수');
    if(!eco) return soc; if(!soc) return eco; return soc+'·'+eco;
  }
  function map(v){ return { l:(50+v.x*45), t:(50-v.y*45) }; }

  window.YL_readout = readout;
  window.YL_compass = function(lean){
    if(!lean || typeof lean.x!=='number') return '';
    var s=map(lean), hasY = lean.yeon && typeof lean.yeon.x==='number', y = hasY ? map(lean.yeon) : null;
    var readSelf = readout(lean.x, lean.y);
    var head = hasY
      ? '<span>연라이프: <b>'+readout(lean.yeon.x,lean.yeon.y)+'</b></span> <span class="self">· 본인 선언: '+readSelf+'</span>'
      : '<b>'+readSelf+'</b> <span class="self">(본인 선언)</span>';
    var linkSvg = hasY
      ? '<svg class="ylcmp-link" viewBox="0 0 100 100" preserveAspectRatio="none"><line x1="'+s.l+'" y1="'+s.t+'" x2="'+y.l+'" y2="'+y.t+'" stroke="#a89e88" stroke-width="0.8" stroke-dasharray="2 2"/></svg>'
      : '';
    var yeonDot = hasY ? '<span class="ylcmp-d y" style="left:'+y.l+'%;top:'+y.t+'%" data-tag="연"></span>' : '';
    var legend = hasY
      ? '<div class="ylcmp-lg"><i><span class="qy"></span>연라이프 평가(글 분석)</i><i><span class="qs"></span>본인 선언</i></div>'
      : '<div class="ylcmp-cap">○ 본인 선언(설계된 관점) · ● 연라이프 글 분석 평가는 <b>준비 중</b></div>';
    return '<div class="ylcmp">'
      + '<div class="ylcmp-read">'+head+'</div>'
      + '<div class="ylcmp-c">'
      +   '<div class="ylcmp-r ylcmp-r2"></div><div class="ylcmp-r ylcmp-r1"></div>'
      +   '<div class="ylcmp-cv"></div><div class="ylcmp-ch"></div>'
      +   linkSvg
      +   '<span class="ylcmp-ax t">진보<span class="m">개방</span></span>'
      +   '<span class="ylcmp-ax b"><span class="m">전통</span>보수</span>'
      +   '<span class="ylcmp-ax l">좌<span class="m">분배</span></span>'
      +   '<span class="ylcmp-ax rr">우<span class="m">시장</span></span>'
      +   '<span class="ylcmp-tick"></span>'
      +   '<span class="ylcmp-d s" style="left:'+s.l+'%;top:'+s.t+'%" data-tag="본인"></span>'
      +   yeonDot
      + '</div>'
      + legend
      + '</div>';
  };
})();
