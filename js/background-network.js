/* ==========================================================================
   Y Life — 인연의 그물 (Particle Network Background)
   히어로 영역이나 전체 페이지 배경으로 쓸 수 있는 파티클 네트워크 시스템.
   다른 존재들과 선으로 이어지는 연(緣)의 핵심 시각 은유.

   사용:
     <canvas data-yeon-network></canvas>
   옵션(data-* 속성):
     data-count="90"      파티클 수
     data-max-dist="160"  연결선 생기는 최대 거리
   ========================================================================== */

(function () {
  'use strict';

  function initNetwork(canvas) {
    const ctx = canvas.getContext('2d');
    const COUNT = parseInt(canvas.dataset.count || '90', 10);
    const MAX_DIST = parseInt(canvas.dataset.maxDist || '160', 10);

    let W, H, DPR;
    let particles = [];
    const mouse = { x: -9999, y: -9999, active: false };
    let rafId = null;

    function resize() {
      DPR = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      W = rect.width;
      H = rect.height;
      canvas.width = W * DPR;
      canvas.height = H * DPR;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }

    function init() {
      particles = [];
      for (let i = 0; i < COUNT; i++) {
        particles.push({
          x: Math.random() * W,
          y: Math.random() * H,
          vx: (Math.random() - 0.5) * 0.35,
          vy: (Math.random() - 0.5) * 0.35,
          r: 1.2 + Math.random() * 1.6,
          phase: Math.random() * Math.PI * 2,
        });
      }
    }

    function step() {
      ctx.clearRect(0, 0, W, H);

      // 업데이트
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.phase += 0.015;
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;

        if (mouse.active) {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 180 && d > 0) {
            const force = (180 - d) / 180 * 0.6;
            p.vx += (dx / d) * force * 0.05;
            p.vy += (dy / d) * force * 0.05;
          }
        }

        p.vx *= 0.995;
        p.vy *= 0.995;
        const sp = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (sp < 0.1) {
          p.vx += (Math.random() - 0.5) * 0.1;
          p.vy += (Math.random() - 0.5) * 0.1;
        }
      }

      // 연결선
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i], b = particles[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < MAX_DIST) {
            const opacity = (1 - d / MAX_DIST) * 0.28;
            ctx.strokeStyle = 'rgba(90, 122, 130, ' + opacity + ')';
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      // 마우스 주변 연결 (영향 시각화)
      if (mouse.active) {
        for (const p of particles) {
          const dx = p.x - mouse.x, dy = p.y - mouse.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 220) {
            const op = (1 - d / 220) * 0.35;
            ctx.strokeStyle = 'rgba(64, 87, 93, ' + op + ')';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(mouse.x, mouse.y);
            ctx.lineTo(p.x, p.y);
            ctx.stroke();
          }
        }
      }

      // 파티클 점
      for (const p of particles) {
        const pulse = 1 + Math.sin(p.phase) * 0.15;
        const r = p.r * pulse;

        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 4);
        grad.addColorStop(0, 'rgba(90, 122, 130, 0.85)');
        grad.addColorStop(1, 'rgba(90, 122, 130, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r * 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(64, 87, 93, 0.92)';
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fill();
      }

      rafId = requestAnimationFrame(step);
    }

    function onMove(e) {
      const rect = canvas.getBoundingClientRect();
      const cx = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
      const cy = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
      if (cx >= 0 && cx <= W && cy >= 0 && cy <= H) {
        mouse.x = cx;
        mouse.y = cy;
        mouse.active = true;
      } else {
        mouse.active = false;
      }
    }

    function onLeave() {
      mouse.active = false;
    }

    window.addEventListener('resize', () => { resize(); });
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseleave', onLeave);
    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('touchend', onLeave);

    resize();
    init();
    step();

    // 페이지 숨겨지면 일시정지 (성능)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      } else if (!document.hidden && !rafId) {
        step();
      }
    });
  }

  function autoInit() {
    document.querySelectorAll('canvas[data-yeon-network]').forEach(initNetwork);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInit);
  } else {
    autoInit();
  }

  window.YLifeNetwork = { init: initNetwork };
})();
