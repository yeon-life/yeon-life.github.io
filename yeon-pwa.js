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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectShareWidget);
  } else {
    injectShareWidget();
  }

  // 글로벌로 노출 (다른 스크립트에서 사용 가능)
  window.yeonToast = showToast;
})();

