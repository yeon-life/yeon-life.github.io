/*
 * 연라이프 PWA + 자동 업데이트 통합 모듈
 * YLV-4 §18 (자동 업데이트) + §24 (PWA)
 * ───────────────────────────────────────────────────────────
 * 사용법: 모든 HTML 페이지 <head> 또는 </body> 직전에:
 *   <script src="yeon-pwa.js" defer></script>
 *
 * 자동으로 처리:
 *  1. Service Worker 등록 (sw.js)
 *  2. version.json 5분 폴링 (새 버전 감지)
 *  3. idle 상태 자동 리로드 (사용자 입력·스크롤 중 X)
 *  4. "📲 앱 설치" 버튼 동적 표시 (beforeinstallprompt)
 *  5. 토스트 메시지 — "새 버전이 적용됐어요 ✨"
 */
(function(){
  'use strict';

  // ── 설정 ────────────────────────────────────────────
  const VERSION_CHECK_INTERVAL = 5 * 60 * 1000;   // 5분
  const IDLE_THRESHOLD         = 30 * 1000;       // 30초 idle 후 리로드
  const TOAST_DURATION         = 3000;
  const VERSION_URL            = 'version.json';
  const SW_URL                 = 'sw.js';

  let currentVersion = null;
  let pendingUpdate = false;
  let lastActivity = Date.now();
  let softReloadTimer = null;
  let installPromptEvent = null;

  // ── 0. localhost·file:// 폴백 ────────────────────────
  const isLocal = location.protocol === 'file:' ||
                  location.hostname === 'localhost' ||
                  location.hostname === '127.0.0.1' ||
                  location.hostname.endsWith('.local');

  // ── 1. Service Worker 등록 ──────────────────────────
  if ('serviceWorker' in navigator && !isLocal) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register(SW_URL)
        .then((reg) => {
          console.log('[연라이프 PWA] Service Worker 등록됨', reg.scope);

          // 새 SW 가 대기 중이면 사용자에게 알림
          if (reg.waiting) {
            showToast('새 버전이 준비됐어요 ✨');
          }
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  pendingUpdate = true;
                  scheduleSoftReload();
                }
              });
            }
          });
        })
        .catch((e) => console.warn('[연라이프 PWA] SW 등록 실패', e));
    });
  }

  // ── 2. 버전 폴링 ─────────────────────────────────────
  async function checkVersion() {
    try {
      const r = await fetch(VERSION_URL + '?t=' + Date.now(), { cache: 'no-cache' });
      if (!r.ok) return;
      const j = await r.json();
      if (currentVersion === null) {
        currentVersion = j.version;
        window.YEON_BUILD_VERSION = j.version;
        window.YEON_YLV = j.ylv;
        return;
      }
      if (j.version !== currentVersion) {
        pendingUpdate = true;
        if (j.force) {
          showToast('보안 업데이트가 적용돼요…');
          setTimeout(() => location.reload(), 1000);
        } else {
          showToast('새 버전이 준비됐어요 ✨');
          scheduleSoftReload();
        }
      }
    } catch (e) { /* 조용히 폴백 */ }
  }
  if (!isLocal) {
    setInterval(checkVersion, VERSION_CHECK_INTERVAL);
    setTimeout(checkVersion, 2000); // 페이지 로드 2초 후 첫 체크
  }

  // ── 3. idle 자동 리로드 ──────────────────────────────
  ['click', 'keydown', 'touchstart', 'scroll', 'mousemove'].forEach((ev) =>
    window.addEventListener(ev, () => { lastActivity = Date.now(); }, { passive: true })
  );

  function isCurrentlyActive() {
    const idle = (Date.now() - lastActivity) > IDLE_THRESHOLD;
    const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName);
    const isContentEditable = document.activeElement?.isContentEditable;
    const chatPending = window.YEON_CHAT_PENDING === true;
    return !idle || isInput || isContentEditable || chatPending;
  }

  function scheduleSoftReload() {
    if (softReloadTimer) return;
    softReloadTimer = setInterval(() => {
      if (!isCurrentlyActive()) {
        clearInterval(softReloadTimer);
        showToast('새 버전 적용됐어요 ✨', TOAST_DURATION);
        setTimeout(() => location.reload(), 600);
      }
    }, 5000);
  }

  // ── 4. 설치 버튼 (beforeinstallprompt) ───────────────
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    installPromptEvent = e;
    showInstallButton();
  });

  function showInstallButton() {
    if (document.getElementById('yeon-install-btn')) return;
    const btn = document.createElement('button');
    btn.id = 'yeon-install-btn';
    btn.type = 'button';
    btn.innerHTML = '📲 앱으로 설치';
    btn.style.cssText = `
      position: fixed; bottom: 24px; right: 24px; z-index: 9999;
      padding: 12px 20px; border: 0; border-radius: 999px;
      background: #c38d56; color: #fbf8f1;
      font-family: 'Pretendard','Apple SD Gothic Neo',sans-serif;
      font-size: 13.5px; font-weight: 600; letter-spacing: .02em;
      box-shadow: 0 8px 22px rgba(31,42,42,.18);
      cursor: pointer; transition: transform .18s ease;
    `;
    btn.onmouseenter = () => btn.style.transform = 'translateY(-2px)';
    btn.onmouseleave = () => btn.style.transform = 'translateY(0)';
    btn.onclick = async () => {
      if (!installPromptEvent) return;
      installPromptEvent.prompt();
      const choice = await installPromptEvent.userChoice;
      console.log('[연라이프 PWA] 설치 선택:', choice.outcome);
      installPromptEvent = null;
      btn.remove();
    };
    document.body.appendChild(btn);
  }

  window.addEventListener('appinstalled', () => {
    console.log('[연라이프 PWA] 앱 설치 완료');
    showToast('연라이프 앱이 설치됐어요 🎉', 4000);
  });

  // ── 5. 토스트 ────────────────────────────────────────
  function showToast(message, duration = TOAST_DURATION) {
    const id = 'yeon-toast';
    let toast = document.getElementById(id);
    if (toast) toast.remove();
    toast = document.createElement('div');
    toast.id = id;
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed; left: 50%; bottom: 32px; transform: translateX(-50%) translateY(40px);
      z-index: 10000; padding: 10px 22px; border-radius: 999px;
      background: rgba(31,42,42,.92); color: #fbf8f1;
      font-family: 'Pretendard','Apple SD Gothic Neo',sans-serif;
      font-size: 13.5px; font-weight: 500;
      backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
      box-shadow: 0 10px 30px rgba(0,0,0,.2);
      opacity: 0; transition: opacity .25s ease, transform .25s ease;
      pointer-events: none;
    `;
    document.body.appendChild(toast);
    requestAnimationFrame(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateX(-50%) translateY(0)';
    });
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(-50%) translateY(40px)';
      setTimeout(() => toast.remove(), 400);
    }, duration);
  }

  // ── 6. 공유 및 QR 코드 위젯 ──────────────────────────
  function injectShareWidget() {
    if (document.getElementById('yeon-share-btn')) return;

    // 1. floating share button
    const btn = document.createElement('button');
    btn.id = 'yeon-share-btn';
    btn.type = 'button';
    btn.setAttribute('aria-label', '페이지 공유');
    btn.innerHTML = `
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block;">
        <rect x="3" y="3" width="7" height="7" rx="1"/>
        <rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="3" y="14" width="7" height="7" rx="1"/>
        <path d="M14 14h3v3M21 14v3M14 21h3M21 17v4M17 17v0"/>
      </svg>
    `;
    
    // Position adjustments if PWA install button exists
    const hasInstallBtn = document.getElementById('yeon-install-btn') !== null;
    const bottomPos = hasInstallBtn ? '84px' : '24px';
    
    btn.style.cssText = `
      position: fixed; bottom: ${bottomPos}; right: 24px; z-index: 9998;
      width: 48px; height: 48px; border: 0; border-radius: 50%;
      background: #2f5d62; color: #fbf8f1;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 8px 22px rgba(31,42,42,.18);
      cursor: pointer; transition: transform .18s ease, background-color .18s ease;
    `;
    btn.onmouseenter = () => {
      btn.style.transform = 'scale(1.08)';
      btn.style.backgroundColor = '#1f3c3f';
    };
    btn.onmouseleave = () => {
      btn.style.transform = 'scale(1)';
      btn.style.backgroundColor = '#2f5d62';
    };
    btn.onclick = openShareModal;
    document.body.appendChild(btn);

    // If install button is added later, reposition share button
    const observer = new MutationObserver(() => {
      const ib = document.getElementById('yeon-install-btn');
      if (ib) {
        btn.style.bottom = '84px';
        ib.style.bottom = '24px';
      } else {
        btn.style.bottom = '24px';
      }
    });
    observer.observe(document.body, { childList: true });
  }

  function openShareModal() {
    let modal = document.getElementById('yeon-share-modal');
    let overlay = document.getElementById('yeon-share-overlay');

    if (!modal) {
      // Create Overlay
      overlay = document.createElement('div');
      overlay.id = 'yeon-share-overlay';
      overlay.style.cssText = `
        position: fixed; inset: 0; background: rgba(31,42,42,.4);
        z-index: 10001; opacity: 0; transition: opacity .25s ease;
        backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px);
        display: none;
      `;
      overlay.onclick = closeShareModal;
      document.body.appendChild(overlay);

      // Create Modal
      modal = document.createElement('div');
      modal.id = 'yeon-share-modal';
      modal.style.cssText = `
        position: fixed; left: 50%; top: 50%; transform: translate(-50%, -50%) scale(0.9);
        width: 90%; max-width: 400px; background: #fffdf8;
        border: 1px solid #d7c9b4; border-radius: 16px;
        box-shadow: 0 16px 40px rgba(31,42,42,.15);
        z-index: 10002; opacity: 0; transition: opacity .25s ease, transform .25s cubic-bezier(0.175, 0.885, 0.32, 1.15);
        overflow: hidden; font-family: 'Pretendard','Apple SD Gothic Neo',sans-serif;
        display: none;
      `;

      // Modal content
      modal.innerHTML = `
        <div style="padding: 16px 20px; border-bottom: 1px solid #e7d9bf; display: flex; justify-content: space-between; align-items: center;">
          <h3 style="font-family:'Noto Serif KR', serif; font-size: 16px; color: #2f5d62; font-weight: 700;">📢 이 페이지 공유하기</h3>
          <button onclick="window.yeonCloseShare()" style="background: none; border: none; font-size: 22px; color: #7a6e64; cursor: pointer; line-height: 1;">&times;</button>
        </div>
        <div style="padding: 20px; display: flex; flex-direction: column; align-items: center; gap: 14px;">
          <div style="background: #fff; padding: 10px; border: 1.5px solid #d7c9b4; border-radius: 12px; box-shadow: 0 4px 12px rgba(47,93,98,0.05); display: flex; justify-content: center; align-items: center; width: 170px; height: 170px;">
            <img id="yeon-share-qr-img" style="width: 150px; height: 150px;" alt="QR 코드" />
          </div>
          <div style="width: 100%; display: flex; flex-direction: column; gap: 6px;">
            <input type="text" id="yeon-share-url-input" readonly style="width: 100%; padding: 8px 12px; border: 1.5px solid #d7c9b4; border-radius: 8px; font-size: 13px; color: #1d1d1b; background: #f4f1eb; outline: none;" />
          </div>
          <div style="display: flex; flex-direction: column; gap: 8px; width: 100%; margin-top: 6px;">
            <button onclick="window.yeonCopyLink()" style="background: #2f5d62; color: #fffdf8; border: none; padding: 10px 16px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: background .2s;">🔗 링크 주소 복사</button>
            <button onclick="window.yeonShareKakao()" style="background: #fee500; color: #191919; border: none; padding: 10px 16px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: background .2s;">💬 나에게 카톡 전송</button>
            <button onclick="window.yeonShareSms()" style="background: #007aff; color: #fff; border: none; padding: 10px 16px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: background .2s;">📱 나에게 문자 전송</button>
          </div>
        </div>
      `;

      document.body.appendChild(modal);

      // Expose globally for HTML onclick handlers
      window.yeonCloseShare = closeShareModal;
      window.yeonCopyLink = () => {
        const input = document.getElementById('yeon-share-url-input');
        navigator.clipboard.writeText(input.value).then(() => {
          showToast('링크 주소가 복사되었습니다. ✨');
        }).catch(() => {
          input.select();
          document.execCommand('copy');
          showToast('링크 주소가 복사되었습니다. ✨');
        });
      };
      window.yeonShareKakao = () => {
        const url = location.href;
        window.open('https://sharer.kakao.com/talk/friends/picker/link?url=' + encodeURIComponent(url), '_blank');
      };
      window.yeonShareSms = () => {
        const url = location.href;
        const text = `[연라이프] ${document.title} 공유: ${url}`;
        location.href = `sms:?body=${encodeURIComponent(text)}`;
      };
    }

    // Set URL and QR image source
    const currentUrl = location.href;
    document.getElementById('yeon-share-url-input').value = currentUrl;
    document.getElementById('yeon-share-qr-img').src = 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=4&data=' + encodeURIComponent(currentUrl);

    // Show modal & overlay with animation
    overlay.style.display = 'block';
    modal.style.display = 'block';
    
    // Force reflow
    void modal.offsetWidth;

    overlay.style.opacity = '1';
    modal.style.opacity = '1';
    modal.style.transform = 'translate(-50%, -50%) scale(1)';
  }

  function closeShareModal() {
    const modal = document.getElementById('yeon-share-modal');
    const overlay = document.getElementById('yeon-share-overlay');
    if (modal && overlay) {
      overlay.style.opacity = '0';
      modal.style.opacity = '0';
      modal.style.transform = 'translate(-50%, -50%) scale(0.9)';
      setTimeout(() => {
        overlay.style.display = 'none';
        modal.style.display = 'none';
      }, 250);
    }
  }

  // ── 7. 공통 메가 메뉴 동적 인젝션 ────────────────────────
  function injectMegaMenu() {
    // 1. 이미 메가 메뉴나 차림표 트리거가 존재하면 생성하지 않음
    if (document.getElementById('megaMenu') || document.getElementById('menuTrigger') || document.getElementById('yeon-floating-menu-trigger')) {
      return;
    }

    // 2. 동적 스타일 인젝션
    const style = document.createElement('style');
    style.innerHTML = `
      :root {
        --yp-ink:#1f2a2a; --yp-deep:#2f5d62; --yp-pine:#427a71; --yp-accent:#c38d56;
        --yp-sage:#dfe8de; --yp-mist:#f4f1eb; --yp-sand:#e7d9bf; --yp-peach:#f3e7dd;
        --yp-line:#d7d1c5; --yp-card:#fffdf8; --yp-white:#ffffff;
        --paper-warm:#f6f3ec; --paper-base:#f4f0e6; --surface:#fbfaf5;
      }
      #yeon-floating-menu-trigger {
        position: fixed; top: 12px; left: 50%; transform: translateX(-50%); z-index: 10004;
        display: inline-flex; align-items: center; gap: 8px; padding: 7px 16px; border-radius: 999px;
        background: #427a71; color: #f4f1eb; border: 1.5px solid #ffffff;
        box-shadow: 0 4px 16px rgba(31,42,42,0.22);
        font-family: 'Noto Serif KR', serif; font-size: 13.5px; font-weight: 700;
        cursor: pointer; transition: all 0.18s ease-in-out;
      }
      #yeon-floating-menu-trigger:hover {
        background: #2f5d62; transform: translateX(-50%) translateY(-1px);
        box-shadow: 0 6px 20px rgba(31,42,42,0.3);
      }
      #yeon-floating-menu-trigger svg {
        width: 16px; height: 12px; stroke: currentColor; stroke-width: 2.5; stroke-linecap: round; fill: none;
      }
      .mega-overlay {
        position: fixed; inset: 0; background: rgba(26,35,38,.4);
        opacity: 0; visibility: hidden; transition: all .3s ease; z-index: 10005;
        backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px);
      }
      .mega-overlay.open { opacity: 1; visibility: visible; }
      .mega-menu {
        position: fixed; top: 0; left: 0; right: 0; background: #f6f3ec;
        transform: translateY(-100%); transition: transform .42s cubic-bezier(.65,.05,.36,1);
        z-index: 10006; border-bottom: 2px solid #1f2a2a; max-height: 100vh; overflow-y: auto;
        font-family: 'Pretendard', 'Apple SD Gothic Neo', sans-serif;
      }
      .mega-menu.open { transform: translateY(0); }
      .mega-head { display: flex; justify-content: space-between; align-items: center; padding: 20px 32px; border-bottom: 1px solid #d7d1c5; background: #f6f3ec; }
      .mega-head-left { display: flex; align-items: baseline; gap: 16px; }
      .mega-head-left .brand-sm { font-family: 'Noto Serif KR', serif; font-size: 24px; font-weight: 900; color: #1f2a2a; letter-spacing: -.02em; }
      .mega-head-left .brand-sm .yeon { color: #427a71; }
      .mega-head-left .label { font-family: 'Noto Serif KR', serif; font-size: 12px; letter-spacing: .16em; color: #c38d56; font-weight: 700; text-transform: uppercase; }
      .mega-close { display: inline-flex; align-items: center; gap: 8px; color: #1f2a2a; font-family: 'Noto Serif KR', serif; font-size: 13.5px; font-weight: 600; padding: 8px 0; background: none; border: none; cursor: pointer; }
      .mega-close:hover { color: #427a71; }
      .mega-body { display: grid; grid-template-columns: 280px 320px 1fr; min-height: 520px; background: #f6f3ec; }
      .mega-col-1 { padding: 28px 0; border-right: 1px solid #d7d1c5; }
      .mega-col-1 .heading { font-family: 'Noto Serif KR', serif; font-size: 11px; letter-spacing: .14em; color: #5e6a6e; font-weight: 700; text-transform: uppercase; padding: 0 32px 12px; border-bottom: 1px solid #e8e4d9; margin-bottom: 8px; }
      .cat-item { display: flex; align-items: center; justify-content: space-between; padding: 14px 32px; cursor: pointer; transition: all .2s; border-left: 3px solid transparent; text-decoration: none; color: inherit; }
      .cat-item:hover { background: #fbfaf5; }
      .cat-item.active { background: #fbfaf5; border-left-color: #427a71; }
      .cat-item-text { display: flex; flex-direction: column; gap: 2px; }
      .cat-name { font-family: 'Noto Serif KR', serif; font-size: 17px; font-weight: 600; color: #1f2a2a; }
      .cat-item.active .cat-name { color: #427a71; }
      .cat-desc { font-size: 11px; color: #5e6a6e; }
      .cat-arrow { width: 16px; height: 16px; color: #8a9398; transition: transform .2s; flex-shrink: 0; }
      .cat-arrow svg { width: 100%; height: 100%; stroke: currentColor; stroke-width: 1.6; fill: none; stroke-linecap: round; }
      .cat-item:hover .cat-arrow, .cat-item.active .cat-arrow { color: #427a71; transform: translateX(3px); }
      .mega-col-2 { padding: 28px 32px; border-right: 1px solid #d7d1c5; background: #f6f3ec; }
      .mega-col-2-pane { display: none; }
      .mega-col-2-pane.active { display: block; }
      .col-2-title { font-family: 'Noto Serif KR', serif; font-size: 13px; letter-spacing: .14em; color: #c38d56; font-weight: 700; text-transform: uppercase; margin-bottom: 18px; display: flex; align-items: center; gap: 8px; }
      .col-2-title::before { content: ""; width: 18px; height: 1px; background: #c38d56; }
      .sub-list { display: flex; flex-direction: column; gap: 2px; }
      .sub-item { display: flex; align-items: center; gap: 14px; padding: 14px 12px; border-radius: 4px; cursor: pointer; transition: all .2s; text-decoration: none; color: inherit; }
      .sub-item:hover, .sub-item.active { background: #fbfaf5; }
      .sub-icon { width: 36px; height: 36px; border-radius: 6px; background: #fbfaf5; display: flex; align-items: center; justify-content: center; font-family: 'Noto Serif KR', serif; font-size: 16px; font-weight: 700; color: #427a71; flex-shrink: 0; border: 1px solid #e8e4d9; }
      .sub-item:hover .sub-icon, .sub-item.active .sub-icon { background: #427a71; color: #f6f3ec; border-color: #427a71; }
      .sub-text { flex: 1; min-width: 0; }
      .sub-name { font-size: 14px; font-weight: 600; color: #1f2a2a; margin-bottom: 2px; }
      .sub-desc { font-size: 11px; color: #5e6a6e; line-height: 1.4; }
      .mega-col-3 { padding: 28px 32px; background: linear-gradient(180deg, #f6f3ec 0%, #f4f0e6 100%); }
      .mega-col-3-pane { display: none; }
      .mega-col-3-pane.active { display: block; }
      .featured-block { background: #fbfaf5; border: 1px solid #e8e4d9; border-radius: 4px; padding: 24px; margin-bottom: 18px; cursor: pointer; transition: all .25s; text-decoration: none; color: inherit; display: block; }
      .featured-block:hover { border-color: #427a71; transform: translateY(-2px); }
      .featured-tag { font-size: 10px; letter-spacing: .14em; text-transform: uppercase; color: #c38d56; font-weight: 700; margin-bottom: 10px; }
      .featured-tag::before { content: ""; display: inline-block; width: 18px; height: 1px; background: #c38d56; margin-right: 8px; vertical-align: 3px; }
      .featured-title { font-family: 'Noto Serif KR', serif; font-size: 20px; font-weight: 600; line-height: 1.35; color: #1f2a2a; letter-spacing: -.01em; margin-bottom: 8px; }
      .featured-deck { font-size: 13px; color: #5e6a6e; line-height: 1.6; margin-bottom: 14px; }
      .featured-meta { font-size: 11px; color: #8a9398; letter-spacing: .04em; }
      .featured-meta .now { display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; border-radius: 999px; background: rgba(195,141,86,.12); color: #c38d56; font-weight: 700; text-transform: uppercase; margin-right: 6px; font-size: 9px; }
      .featured-meta .now::before { content: ""; width: 5px; height: 5px; border-radius: 50%; background: #c38d56; }
      .mega-foot { padding: 20px 32px; border-top: 1px solid #d7d1c5; background: #f6f3ec; display: flex; justify-content: space-between; align-items: center; font-size: 12px; color: #5e6a6e; }
      .mega-foot .left a { color: #427a71; font-weight: 600; margin-right: 18px; text-decoration: none; }
      .mega-foot .right { font-style: italic; }
      
      @media (max-width: 1024px) {
        .mega-body { grid-template-columns: 1fr; min-height: auto; }
        .mega-col-1 { border-right: none; padding: 14px 0; }
        .mega-col-2 { border-right: none; padding: 14px 20px; background: transparent; }
        .mega-col-3 { display: none; }
        .mega-col-2-pane { margin-bottom: 12px; border: 1px solid #d7d1c5; border-radius: 8px; background: #fbfaf5; padding: 14px; }
        .col-2-title { margin-bottom: 10px; }
        .cat-item .cat-arrow svg { transition: transform .25s ease; }
        .cat-item.active .cat-arrow svg { transform: rotate(90deg); }
      }
    `;
    document.head.appendChild(style);

    // 3. 플로팅 버튼 생성 및 삽입
    const triggerBtn = document.createElement('button');
    triggerBtn.id = 'yeon-floating-menu-trigger';
    triggerBtn.type = 'button';
    triggerBtn.innerHTML = `
      <svg viewBox="0 0 24 16"><line x1="2" y1="3" x2="22" y2="3"/><line x1="2" y1="8" x2="22" y2="8"/><line x1="2" y1="13" x2="22" y2="13"/></svg>
      <span>차림표</span>
    `;
    document.body.appendChild(triggerBtn);

    // 4. 메가 메뉴 마크업 생성 및 삽입
    const menuOverlay = document.createElement('div');
    menuOverlay.className = 'mega-overlay';
    menuOverlay.id = 'megaOverlay';
    document.body.appendChild(menuOverlay);

    const menuContent = document.createElement('div');
    menuContent.className = 'mega-menu';
    menuContent.id = 'megaMenu';
    menuContent.innerHTML = `
      <div class="mega-head">
        <div class="mega-head-left">
          <a href="/index.html" class="brand-sm" id="megaBrand" title="홈으로 — 차림표 닫기" style="cursor:pointer;text-decoration:none"><span class="yeon">緣</span>y-life.kr</a>
          <div class="label">차림표 · Menu</div>
        </div>
        <button class="mega-close" id="megaClose">
          닫기
          <svg viewBox="0 0 24 24" style="width:16px;height:16px;stroke:currentColor;stroke-width:2;fill:none;stroke-linecap:round;"><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg>
        </button>
      </div>
      <div class="mega-body">
        <div class="mega-col-1">
          <div class="heading">큰 갈래</div>
          <div class="cat-item active" data-target="plaza">
            <div class="cat-item-text">
              <div class="cat-name">광장</div>
              <div class="cat-desc">아골라 · 아곤란이 만나는 곳</div>
            </div>
            <div class="cat-arrow"><svg viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg></div>
          </div>
          <div class="cat-item" data-target="thoughtmap">
            <div class="cat-item-text">
              <div class="cat-name">생각의 지도</div>
              <div class="cat-desc">광장의 글이 모이는 별자리</div>
            </div>
            <div class="cat-arrow"><svg viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg></div>
          </div>
          <div class="cat-item" data-target="columns">
            <div class="cat-item-text">
              <div class="cat-name">칼럼</div>
              <div class="cat-desc">네 사람의 시선</div>
            </div>
            <div class="cat-arrow"><svg viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg></div>
          </div>
          <div class="cat-item" data-target="sesang">
            <div class="cat-item-text">
              <div class="cat-name">세상</div>
              <div class="cat-desc">오늘 · 시사 · 세계 · 미래</div>
            </div>
            <div class="cat-arrow"><svg viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg></div>
          </div>
          <div class="cat-item" data-target="where">
            <div class="cat-item-text">
              <div class="cat-name">어디로 가볼까</div>
              <div class="cat-desc">동네 맛집·멋집</div>
            </div>
            <div class="cat-arrow"><svg viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg></div>
          </div>
          <div class="cat-item" data-target="journal">
            <div class="cat-item-text">
              <div class="cat-name">시민 저널</div>
              <div class="cat-desc">누구나 기자 · 6단계 검증</div>
            </div>
            <div class="cat-arrow"><svg viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg></div>
          </div>
          <div class="cat-item" data-target="blog">
            <div class="cat-item-text">
              <div class="cat-name">블로그</div>
              <div class="cat-desc">나의 마당 · 주민의 자리</div>
            </div>
            <div class="cat-arrow"><svg viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg></div>
          </div>
          <div class="cat-item" data-target="bridge">
            <div class="cat-item-text">
              <div class="cat-name">인연의 다리</div>
              <div class="cat-desc">생태계 연결 공간</div>
            </div>
            <div class="cat-arrow"><svg viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg></div>
          </div>
        </div>
        <div class="mega-col-2">
          <div class="mega-col-2-pane active" data-pane="plaza">
            <div class="col-2-title">광장 · 廣場</div>
            <div class="sub-list">
              <a class="sub-item" href="/아골라_미리보기.html"><div class="sub-icon">議</div><div class="sub-text"><div class="sub-name">아골라 阿閣羅</div><div class="sub-desc">어른의 토론</div></div></a>
              <a class="sub-item" href="/아곤란_미리보기.html"><div class="sub-icon">問</div><div class="sub-text"><div class="sub-name">아곤란 阿昆蘭</div><div class="sub-desc">학생의 질문</div></div></a>
              <a class="sub-item" href="/광장의_진짜_목적.html"><div class="sub-icon">深</div><div class="sub-text"><div class="sub-name">이번 주 인사이트</div><div class="sub-desc">가장 깊은 글 Top 10</div></div></a>
              <a class="sub-item" href="/아골라_미리보기.html"><div class="sub-icon">熱</div><div class="sub-text"><div class="sub-name">지금 깊어지는 글</div><div class="sub-desc">실시간 활발한 토론</div></div></a>
              <a class="sub-item" href="/광장의_진짜_목적.html"><div class="sub-icon">規</div><div class="sub-text"><div class="sub-name">광장 규칙</div><div class="sub-desc">우리가 지키는 약속</div></div></a>
            </div>
          </div>
          <div class="mega-col-2-pane" data-pane="thoughtmap">
            <div class="col-2-title">생각의 지도 · 星圖</div>
            <div class="sub-list">
              <a class="sub-item" href="/광장_생각지도.html"><div class="sub-icon">圖</div><div class="sub-text"><div class="sub-name">지도 들어가기</div><div class="sub-desc">노드를 누르면 글이 열립니다</div></div></a>
              <a class="sub-item" href="/광장_생각지도.html"><div class="sub-icon">深</div><div class="sub-text"><div class="sub-name">단계 2 — 깊이 보기</div><div class="sub-desc">노드 사이의 흐름</div></div></a>
              <a class="sub-item" href="/마이페이지_효능감.html"><div class="sub-icon">我</div><div class="sub-text"><div class="sub-name">내가 만든 별자리</div><div class="sub-desc">내 글이 닿은 자리</div></div></a>
            </div>
          </div>
          <div class="mega-col-2-pane" data-pane="columns">
            <div class="col-2-title">칼럼 · 柱</div>
            <div class="sub-list">
              <a class="sub-item" href="/블로그_AI작가기자_인덱스.html"><div class="sub-icon">蓮</div><div class="sub-text"><div class="sub-name">연소사</div><div class="sub-desc">교육 · 사유</div></div></a>
              <a class="sub-item" href="/블로그_AI작가기자_인덱스.html"><div class="sub-icon">林</div><div class="sub-text"><div class="sub-name">임선생</div><div class="sub-desc">철학 · 동서양</div></div></a>
              <a class="sub-item" href="/블로그_AI작가기자_인덱스.html"><div class="sub-icon">朴</div><div class="sub-text"><div class="sub-name">박주민</div><div class="sub-desc">사회 · 지역</div></div></a>
              <a class="sub-item" href="/블로그_AI작가기자_인덱스.html"><div class="sub-icon">玄</div><div class="sub-text"><div class="sub-name">현지영</div><div class="sub-desc">청년 · 미래</div></div></a>
            </div>
          </div>
          <div class="mega-col-2-pane" data-pane="sesang">
            <div class="col-2-title">세상 · 世</div>
            <div class="sub-list">
              <a class="sub-item" href="/오늘의_연라이프_2026-05-18.html"><div class="sub-icon">今</div><div class="sub-text"><div class="sub-name">오늘의 뉴스</div><div class="sub-desc">매일 15편 전체</div></div></a>
              <a class="sub-item" href="/오늘의_연라이프_2026-05-18.html"><div class="sub-icon">時</div><div class="sub-text"><div class="sub-name">시사</div><div class="sub-desc">정책 · 경제 · 사회</div></div></a>
              <a class="sub-item" href="/오늘의_연라이프_2026-05-18.html"><div class="sub-icon">界</div><div class="sub-text"><div class="sub-name">세계 흐름</div><div class="sub-desc">옆 나라 · 먼 나라</div></div></a>
              <a class="sub-item" href="/오늘의_연라이프_2026-05-18.html"><div class="sub-icon">来</div><div class="sub-text"><div class="sub-name">미래 뉴스</div><div class="sub-desc">과학·기술·환경</div></div></a>
              <a href="/ulsan.html" class="sub-item"><div class="sub-icon">里</div><div class="sub-text"><div class="sub-name">우리 동네</div><div class="sub-desc">울산 · 인근</div></div></a>
            </div>
          </div>
          <div class="mega-col-2-pane" data-pane="where">
            <div class="col-2-title">어디로 가볼까</div>
            <div class="sub-list">
              <a href="/ulsan.html#food" class="sub-item"><div class="sub-icon">食</div><div class="sub-text"><div class="sub-name">우리 동네 맛집</div><div class="sub-desc">주민 직접 다녀온 곳</div></div></a>
              <a href="/ulsan.html#nature" class="sub-item"><div class="sub-icon">美</div><div class="sub-text"><div class="sub-name">우리 동네 멋집</div><div class="sub-desc">책방·카페·갤러리</div></div></a>
              <a href="/ulsan.html#hiking" class="sub-item"><div class="sub-icon">行</div><div class="sub-text"><div class="sub-name">둘레길 · 산책</div><div class="sub-desc">걷기 좋은 길</div></div></a>
              <a href="/ulsan.html#visitor-concierge" class="sub-item"><div class="sub-icon">地</div><div class="sub-text"><div class="sub-name">지도로 보기</div><div class="sub-desc">한눈에 둘러보기</div></div></a>
            </div>
          </div>
          <div class="mega-col-2-pane" data-pane="journal">
            <div class="col-2-title">시민 저널</div>
            <div class="sub-list">
              <a class="sub-item" href="/신뢰도_평가_정책.html"><div class="sub-icon">✓</div><div class="sub-text"><div class="sub-name">검증 완료 기사</div><div class="sub-desc">6단계 통과한 글</div></div></a>
              <a class="sub-item" href="/신뢰도_평가_정책.html"><div class="sub-icon">學</div><div class="sub-text"><div class="sub-name">6단계 검증이란?</div><div class="sub-desc">시민 저널리즘 안내</div></div></a>
            </div>
          </div>
          <div class="mega-col-2-pane" data-pane="blog">
            <div class="col-2-title">블로그 · 나의 마당</div>
            <div class="sub-list">
              <a class="sub-item" href="/마이페이지_효능감.html"><div class="sub-icon">我</div><div class="sub-text"><div class="sub-name">내 블로그</div><div class="sub-desc">@나의닉네임</div></div></a>
              <a class="sub-item" href="/블로그_AI작가기자_인덱스.html"><div class="sub-icon">始</div><div class="sub-text"><div class="sub-name">블로그 시작하기</div><div class="sub-desc">템플릿 10종에서 선택</div></div></a>
            </div>
          </div>
          <div class="mega-col-2-pane" data-pane="bridge">
            <div class="col-2-title">인연의 다리</div>
            <div class="sub-list">
              <a class="sub-item" href="https://yeon.ai.kr" target="_blank" rel="noopener"><div class="sub-icon">村</div><div class="sub-text"><div class="sub-name">연마을 yeon.ai.kr</div><div class="sub-desc">지금 운영 중인 마을 ↗</div></div></a>
              <a class="sub-item" href="https://yeon.ai.kr/supul" target="_blank" rel="noopener"><div class="sub-icon">學</div><div class="sub-text"><div class="sub-name">수풀AI · 영풀</div><div class="sub-desc">완전학습 교육 AI ↗</div></div></a>
              <a class="sub-item" href="/builder.html"><div class="sub-icon">作</div><div class="sub-text"><div class="sub-name">사이트 빌더</div><div class="sub-desc">코딩 없이 만드는 페이지</div></div></a>
              <a class="sub-item" href="/challenge-diagnosis.html"><div class="sub-icon">📋</div><div class="sub-text"><div class="sub-name">지원사업 자가진단</div><div class="sub-desc">정부 및 울산시 맞춤형 지원 매칭</div></div></a>
            </div>
          </div>
        </div>
        <div class="mega-col-3">
          <div class="mega-col-3-pane active" data-pane="plaza">
            <div class="featured-block">
              <div class="featured-tag">지금 가장 깊어지는 글</div>
              <div class="featured-title">'선택'이라는 말의 무게 — Libet 실험을 다시 읽다</div>
              <div class="featured-deck">의식과 행위 사이 0.3초의 간극이 우리에게 던지는 질문은 자유의지의 부정이 아니라, 다른 종류의 자유에 대한 초대가 아닐까.</div>
              <div class="featured-meta"><span class="now">지금</span>임선생 · 2시간 전</div>
            </div>
          </div>
          <div class="mega-col-3-pane" data-pane="thoughtmap">
            <div class="featured-block">
              <div class="featured-tag">생각의 지도</div>
              <div class="featured-title">나와 타인의 생각이 이어지는 자리</div>
              <div class="featured-deck">생각의 지도를 통해 광장의 수많은 토론과 질문이 어떻게 연결되는지 탐험해보세요.</div>
            </div>
          </div>
          <div class="mega-col-3-pane" data-pane="columns">
            <div class="featured-block">
              <div class="featured-tag">네 사람의 시선</div>
              <div class="featured-title">연소사, 임선생, 박주민, 현지영</div>
              <div class="featured-deck">각자의 분야에서 깊은 성찰과 통찰로 작성한 명품 칼럼을 제공합니다.</div>
            </div>
          </div>
          <div class="mega-col-3-pane" data-pane="sesang">
            <div class="featured-block">
              <div class="featured-tag">오늘의 15편</div>
              <div class="featured-title">시사와 세계, 미래 뉴스</div>
              <div class="featured-deck">매일 엄선된 15편의 고품격 분석 뉴스를 연라이프에서 확인하세요.</div>
            </div>
          </div>
          <div class="mega-col-3-pane" data-pane="where">
            <div class="featured-block" onclick="location.href='/ulsan.html'" style="cursor:pointer;">
              <div class="featured-tag">스페셜 로컬 가이드</div>
              <div class="featured-title">울산 — 사람이 강이 되고, 강이 바다가 되는 곳</div>
              <div class="featured-deck">8,000년 역사부터 대자연까지 울산의 비밀을 탐방해보세요.</div>
            </div>
          </div>
          <div class="mega-col-3-pane" data-pane="journal">
            <div class="featured-block">
              <div class="featured-tag">시민 저널리즘</div>
              <div class="featured-title">주민이 직접 검증하는 미디어</div>
              <div class="featured-deck">신뢰도 평가를 통해 6단계를 거친 정직하고 투명한 기사들을 읽을 수 있습니다.</div>
            </div>
          </div>
          <div class="mega-col-3-pane" data-pane="blog">
            <div class="featured-block">
              <div class="featured-tag">나만의 마당</div>
              <div class="featured-title">주민 블로그 시작하기</div>
              <div class="featured-deck">10종의 템플릿 중 하나를 골라 나만의 이야기 마당을 개성 있게 가꿔보세요.</div>
            </div>
          </div>
          <div class="mega-col-3-pane" data-pane="bridge">
            <div class="featured-block">
              <div class="featured-tag">인연의 다리</div>
              <div class="featured-title">연라이프 생태계 연결</div>
              <div class="featured-deck">수풀AI, 사이트 빌더 등 교육과 자가진단을 잇는 주민 전용 연동 도구입니다.</div>
            </div>
          </div>
        </div>
      </div>
      <div class="mega-foot">
        <div class="left">
          <a href="/index.html">홈으로</a>
          <a href="/이용약관.html">이용약관</a>
          <a href="/개인정보처리방침.html">개인정보처리방침</a>
        </div>
        <div class="right">"연라이프는 천천히 자라는 마을입니다."</div>
      </div>
    `;
    document.body.appendChild(menuContent);

    // 5. 동작 바인딩
    const trigger = document.getElementById('yeon-floating-menu-trigger');
    const mega = document.getElementById('megaMenu');
    const overlay = document.getElementById('megaOverlay');
    const closeBtn = document.getElementById('megaClose');

    function openMenu() {
      mega.classList.add('open');
      overlay.classList.add('open');
      trigger.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
    function closeMenu() {
      mega.classList.remove('open');
      overlay.classList.remove('open');
      trigger.classList.remove('active');
      document.body.style.overflow = '';
    }

    trigger.addEventListener('click', () => mega.classList.contains('open') ? closeMenu() : openMenu());
    closeBtn.addEventListener('click', closeMenu);
    overlay.addEventListener('click', closeMenu);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });

    // 카테고리 전환 바인딩
    const catItems = menuContent.querySelectorAll('.cat-item');
    catItems.forEach(item => {
      const switchPane = (target) => {
        catItems.forEach(c => c.classList.toggle('active', c.dataset.target === target));
        menuContent.querySelectorAll('.mega-col-2-pane').forEach(p => p.classList.toggle('active', p.dataset.pane === target));
        menuContent.querySelectorAll('.mega-col-3-pane').forEach(p => p.classList.toggle('active', p.dataset.pane === target));
      };
      item.addEventListener('mouseenter', () => switchPane(item.dataset.target));
      item.addEventListener('click', () => switchPane(item.dataset.target));
    });

    // 모바일 아코디언 배치 조정
    const mq = window.matchMedia('(max-width:1024px)');
    let mode = '';
    function apply() {
      const narrow = mq.matches;
      const want = narrow ? 'mobile' : 'desktop';
      if (want === mode) return;
      mode = want;
      const col2 = menuContent.querySelector('.mega-col-2');
      if (narrow) {
        catItems.forEach(cat => {
          const target = cat.dataset.target;
          const pane = menuContent.querySelector(`.mega-col-2-pane[data-pane="${target}"]`);
          if (pane && cat.nextElementSibling !== pane) {
            cat.parentNode.insertBefore(pane, cat.nextSibling);
          }
        });
      } else if (col2) {
        menuContent.querySelectorAll('.mega-col-2-pane').forEach(p => col2.appendChild(p));
      }
    }
    apply();
    if (mq.addEventListener) mq.addEventListener('change', apply);
    else mq.addListener(apply);
    window.addEventListener('resize', apply);
  }

  // 상단 내비(홈 옆)에 '차림표'와 같은 기능의 메뉴 아이콘 자동 삽입 — 모든 페이지 공통, 가드와 무관하게 항상 실행
  function injectNavMenuIcon() {
    try {
      var navC = document.querySelector('.nav-center');
      if (!navC) return; // 내비가 없는 페이지는 플로팅 '차림표' 버튼을 그대로 둠(메뉴 접근 보장)
      if (!navC.querySelector('.nav-menu-ico')) {
        var nb = document.createElement('button');
        nb.type = 'button'; nb.className = 'nav-menu-ico'; nb.setAttribute('aria-label', '차림표 메뉴');
        nb.innerHTML = '<svg viewBox="0 0 24 16" width="20" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="2" y1="3" x2="22" y2="3"/><line x1="2" y1="8" x2="22" y2="8"/><line x1="2" y1="13" x2="22" y2="13"/></svg>';
        nb.style.cssText = 'background:none;border:0;padding:6px 8px;margin-right:4px;color:inherit;cursor:pointer;display:inline-flex;align-items:center;vertical-align:middle;opacity:.78;transition:opacity .18s';
        nb.onmouseenter = function(){ nb.style.opacity = '1'; };
        nb.onmouseleave = function(){ nb.style.opacity = '.78'; };
        nb.onclick = function(){ var t = document.getElementById('yeon-floating-menu-trigger') || document.getElementById('menuTrigger'); if (t) t.click(); };
        navC.insertBefore(nb, navC.firstChild);
      }
      // 내비에 메뉴 아이콘이 있으니, 떠다니는 초록 '차림표' 버튼은 숨김(아이콘으로 대체 — 동작은 유지)
      var ft = document.getElementById('yeon-floating-menu-trigger') || document.getElementById('menuTrigger');
      if (ft) ft.style.display = 'none';
    } catch(e) {}
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      injectShareWidget();
      injectMegaMenu();
      injectNavMenuIcon();
    });
  } else {
    injectShareWidget();
    injectMegaMenu();
    injectNavMenuIcon();
  }

  // 글로벌로 노출 (다른 스크립트에서 사용 가능)
  window.yeonToast = showToast;
})();

