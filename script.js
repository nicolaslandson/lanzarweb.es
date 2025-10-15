// ===== Interactive dots (window listeners to work through content) =====
const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d', { alpha: false });

function resize() {
  const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  canvas.width  = Math.floor(canvas.clientWidth  * dpr);
  canvas.height = Math.floor(canvas.clientHeight * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
addEventListener('resize', resize, { passive: true });
resize();

const P = [];
const settings = {
  count: 120,
  maxSpeed: 0.55,
  radius: 2.0,
  linkDist: 120,
  mouseRepelDist: 110,
  mouseRepelForce: 0.06,
  friction: 0.996,
  bg: getComputedStyle(document.documentElement).getPropertyValue('--bg').trim() || '#0b1020',
  linkRGBA: (a)=>`rgba(140,170,255,${a * 0.38})`,
  dot: '#e8f0ff'
};
const rand = (a, b) => a + Math.random() * (b - a);

function spawn(n = settings.count) {
  for (let i = 0; i < n; i++) {
    P.push({
      x: rand(0, canvas.clientWidth),
      y: rand(0, canvas.clientHeight),
      vx: rand(-settings.maxSpeed, settings.maxSpeed),
      vy: rand(-settings.maxSpeed, settings.maxSpeed)
    });
  }
}
spawn();

const mouse = { x: null, y: null, active: false };
window.addEventListener('mousemove', e => {
  mouse.x = e.clientX; mouse.y = e.clientY; mouse.active = true;
}, { passive: true });
window.addEventListener('mouseleave', () => (mouse.active = false), { passive:true });
window.addEventListener('click', e => {
  P.push({ x: e.clientX, y: e.clientY,
           vx: rand(-settings.maxSpeed, settings.maxSpeed),
           vy: rand(-settings.maxSpeed, settings.maxSpeed) });
}, { passive:true });
window.addEventListener('dblclick', () => { P.length = 0; spawn(60); }, { passive:true });

function step() {
  const w = canvas.clientWidth, h = canvas.clientHeight;

  for (const p of P) {
    if (mouse.active) {
      const dx = p.x - mouse.x, dy = p.y - mouse.y;
      const d2 = dx*dx + dy*dy, r = settings.mouseRepelDist;
      if (d2 < r*r && d2 > 0.0001) {
        const inv = 1 / Math.sqrt(d2);
        p.vx += (dx * inv) * settings.mouseRepelForce;
        p.vy += (dy * inv) * settings.mouseRepelForce;
      }
    }
    p.x += p.vx; p.y += p.vy;
    p.vx *= settings.friction; p.vy *= settings.friction;

    if (p.x < -5) p.x = w + 5; if (p.x > w + 5) p.x = -5;
    if (p.y < -5) p.y = h + 5; if (p.y > h + 5) p.y = -5;
  }

  ctx.fillStyle = settings.bg; ctx.fillRect(0, 0, w, h);

  ctx.lineWidth = 1;
  for (let i = 0; i < P.length; i++) {
    for (let j = i + 1; j < P.length; j++) {
      const a = P[i], b = P[j];
      const dx = a.x - b.x, dy = a.y - b.y;
      const d2 = dx*dx + dy*dy, r2 = settings.linkDist * settings.linkDist;
      if (d2 < r2) {
        const alpha = 1 - d2 / r2;
        ctx.strokeStyle = settings.linkRGBA(alpha);
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }
    }
  }

  ctx.fillStyle = settings.dot;
  for (const p of P) { ctx.beginPath(); ctx.arc(p.x, p.y, settings.radius, 0, Math.PI*2); ctx.fill(); }

  requestAnimationFrame(step);
}
requestAnimationFrame(step);

// ===== Auto-scroll logos on overflow (mobile/compact) =====
(function enableLogoAutoScroll(){
  const track = document.querySelector('.logos-track');
  if (!track) return;
  const needsScroll = () => track.scrollWidth > track.clientWidth + 8;
  let rafId = null;
  let paused = false;

  function start() {
    const isMobile = window.matchMedia('(max-width: 720px)').matches;
    if (!isMobile || !needsScroll()) { stop(); track.classList.remove('auto'); return; }
    if (rafId) return;
    track.classList.add('auto');
    if (!track.dataset.duped) {
      const clones = Array.from(track.children).map(n => n.cloneNode(true));
      clones.forEach(c => track.appendChild(c));
      track.dataset.duped = '1';
    }
    const speed = 0.6; // px per frame for mobile
    const loop = () => {
      if (!paused) {
        track.scrollLeft += speed;
        if (track.scrollLeft >= (track.scrollWidth / 2)) {
          track.scrollLeft = 0;
        }
      }
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);
  }
  function stop(){ if (rafId){ cancelAnimationFrame(rafId); rafId = null; } }

  const ro = new ResizeObserver(() => { stop(); start(); });
  ro.observe(track);
  window.addEventListener('orientationchange', () => { stop(); start(); }, { passive:true });
  track.addEventListener('mouseenter', () => paused = true);
  track.addEventListener('mouseleave', () => paused = false);
  track.addEventListener('touchstart', () => paused = true, { passive:true });
  track.addEventListener('touchend', () => paused = false, { passive:true });

  start();
})();
