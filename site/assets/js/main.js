(() => {
  const nav = document.querySelector('#primary-nav');
  const toggle = document.querySelector('.menu-toggle');
  const year = document.querySelector('#year');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  if (year) year.textContent = new Date().getFullYear();

  // Accessible mobile navigation: closes after selection or Escape.
  if (toggle && nav) {
    const closeNav = () => {
      nav.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Open navigation');
    };
    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    });
    nav.querySelectorAll('a').forEach(link => link.addEventListener('click', closeNav));
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') closeNav();
    });
  }

  // Reveal content as it enters the viewport; never hide content if motion is reduced.
  const revealItems = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window) || reduceMotion) {
    revealItems.forEach(item => item.classList.add('is-visible'));
  } else {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -30px 0px' });
    revealItems.forEach(item => revealObserver.observe(item));
  }

  // Cursor ring and spotlight use transforms/CSS variables rather than layout reads.
  const cursor = document.querySelector('.custom-cursor');
  let pointerX = window.innerWidth / 2;
  let pointerY = window.innerHeight / 3;
  let cursorX = pointerX;
  let cursorY = pointerY;
  let rafPending = false;
  if (finePointer && cursor && !reduceMotion) {
    document.body.classList.add('cursor-ready');
    const updatePointer = event => {
      pointerX = event.clientX;
      pointerY = event.clientY;
      document.documentElement.style.setProperty('--pointer-x', pointerX + 'px');
      document.documentElement.style.setProperty('--pointer-y', pointerY + 'px');
      if (!rafPending) {
        rafPending = true;
        requestAnimationFrame(() => {
          cursorX += (pointerX - cursorX) * 0.28;
          cursorY += (pointerY - cursorY) * 0.28;
          cursor.style.transform = 'translate3d(' + (cursorX - 17) + 'px,' + (cursorY - 17) + 'px,0)';
          rafPending = false;
          if (Math.abs(pointerX - cursorX) > 0.5 || Math.abs(pointerY - cursorY) > 0.5) {
            requestAnimationFrame(function follow() {
              cursorX += (pointerX - cursorX) * 0.28;
              cursorY += (pointerY - cursorY) * 0.28;
              cursor.style.transform = 'translate3d(' + (cursorX - 17) + 'px,' + (cursorY - 17) + 'px,0)';
              if (Math.abs(pointerX - cursorX) > 0.5 || Math.abs(pointerY - cursorY) > 0.5) requestAnimationFrame(follow);
            });
          }
        });
      }
    };
    window.addEventListener('pointermove', updatePointer, { passive: true });
    document.querySelectorAll('a,button,.project-card').forEach(element => {
      element.addEventListener('pointerenter', () => document.body.classList.add('cursor-hover'));
      element.addEventListener('pointerleave', () => document.body.classList.remove('cursor-hover'));
    });
    document.addEventListener('pointerdown', () => document.body.classList.add('cursor-hover'));
    document.addEventListener('pointerup', () => document.body.classList.remove('cursor-hover'));
  }

  // Lightweight ambient particles on canvas; no library, no continuous work when hidden.
  const canvas = document.querySelector('#ambient-particles');
  const context = canvas && canvas.getContext ? canvas.getContext('2d') : null;
  if (canvas && context && !reduceMotion) {
    const smallScreen = window.matchMedia('(max-width: 660px)').matches;
    const count = smallScreen ? 20 : 42;
    let width = 0;
    let height = 0;
    let particles = [];
    let frame = 0;
    let visible = !document.hidden;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * width, y: Math.random() * height,
        r: Math.random() * 1.4 + .4, vx: (Math.random() - .5) * .18,
        vy: (Math.random() - .5) * .16, a: Math.random() * .35 + .1
      }));
    };
    const draw = () => {
      if (!visible) { frame = 0; return; }
      context.clearRect(0, 0, width, height);
      particles.forEach((p, index) => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < -5) p.x = width + 5;
        if (p.x > width + 5) p.x = -5;
        if (p.y < -5) p.y = height + 5;
        if (p.y > height + 5) p.y = -5;
        context.beginPath();
        context.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        context.fillStyle = 'rgba(229,181,199,' + p.a + ')';
        context.fill();
        for (let n = index + 1; n < Math.min(index + 4, particles.length); n++) {
          const q = particles[n];
          const dx = p.x - q.x;
          const dy = p.y - q.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance < 95) {
            context.beginPath();
            context.moveTo(p.x, p.y);
            context.lineTo(q.x, q.y);
            context.strokeStyle = 'rgba(199,123,155,' + ((1 - distance / 95) * .09) + ')';
            context.lineWidth = .6;
            context.stroke();
          }
        }
      });
      frame = requestAnimationFrame(draw);
    };
    const start = () => { if (visible && !frame) frame = requestAnimationFrame(draw); };
    const stop = () => { if (frame) cancelAnimationFrame(frame); frame = 0; };
    resize();
    start();
    window.addEventListener('resize', () => { resize(); start(); }, { passive: true });
    document.addEventListener('visibilitychange', () => {
      visible = !document.hidden;
      if (visible) start(); else stop();
    });
  }
})();