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

  // Soft pointer-following spotlight only — no custom or circular cursor.
  if (finePointer && !reduceMotion) {
    let pointerFrame = 0;
    let lastX = 0;
    let lastY = 0;
    window.addEventListener('pointermove', event => {
      lastX = event.clientX;
      lastY = event.clientY;
      if (!pointerFrame) {
        pointerFrame = requestAnimationFrame(() => {
          document.documentElement.style.setProperty('--pointer-x', lastX + 'px');
          document.documentElement.style.setProperty('--pointer-y', lastY + 'px');
          pointerFrame = 0;
        });
      }
    }, { passive: true });

    // Gentle 3D depth on project cards, limited to precise-pointer devices.
    document.querySelectorAll('.project-card').forEach(card => {
      card.addEventListener('pointermove', event => {
        const rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        card.style.setProperty('--tilt-x', (y * -1.5).toFixed(2) + 'deg');
        card.style.setProperty('--tilt-y', (x * 1.8).toFixed(2) + 'deg');
      }, { passive: true });
      card.addEventListener('pointerleave', () => {
        card.style.setProperty('--tilt-x', '0deg');
        card.style.setProperty('--tilt-y', '0deg');
      });
    });
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