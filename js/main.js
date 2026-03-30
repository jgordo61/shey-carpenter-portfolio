/* ============================================================
   SHEY CARPENTER — main.js
   - Custom cursor
   - Sticky nav on scroll
   - Horizontal gallery drag-to-scroll with momentum
   - Gallery scroll progress bar
   - Contact form feedback
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ── Custom Cursor ──────────────────────────────────────── */
  const cursor     = document.getElementById('cursor');
  const cursorRing = document.getElementById('cursorRing');

  if (cursor && cursorRing) {
    document.addEventListener('mousemove', (e) => {
      const x = e.clientX;
      const y = e.clientY;
      cursor.style.transform     = `translate(${x}px, ${y}px)`;
      cursorRing.style.transform = `translate(${x}px, ${y}px)`;
    });

    // Hover state on interactive elements
    const hoverTargets = document.querySelectorAll(
      'a, button, .gallery-item, .about-strip-item, input, textarea'
    );
    hoverTargets.forEach(el => {
      el.addEventListener('mouseenter', () => {
        cursor.classList.add('is-hovering');
        cursorRing.classList.add('is-hovering');
      });
      el.addEventListener('mouseleave', () => {
        cursor.classList.remove('is-hovering');
        cursorRing.classList.remove('is-hovering');
      });
    });
  }

  /* ── Sticky Nav ─────────────────────────────────────────── */
  const nav = document.getElementById('nav');
  if (nav) {
    // Pages other than the landing page always use scrolled style
    const isLanding = document.querySelector('.hero') !== null;

    if (!isLanding) {
      // Already .scrolled via HTML class — nothing to do
    } else {
      const handleScroll = () => {
        if (window.scrollY > 60) {
          nav.classList.add('scrolled');
        } else {
          nav.classList.remove('scrolled');
        }
      };
      window.addEventListener('scroll', handleScroll, { passive: true });
      handleScroll();
    }
  }

  /* ── Horizontal Gallery Drag-to-Scroll ──────────────────── */
  const track       = document.getElementById('galleryTrack');
  const progressBar = document.getElementById('galleryProgressBar');

  if (track) {
    let isDown    = false;
    let startX    = 0;
    let scrollLeft = 0;

    // Velocity tracking for momentum
    let velX      = 0;
    let lastX     = 0;
    let lastTime  = 0;
    let rafId     = null;

    // Update progress bar
    function updateProgress() {
      if (!progressBar) return;
      const max = track.scrollWidth - track.clientWidth;
      const pct = max > 0 ? (track.scrollLeft / max) * 100 : 0;
      progressBar.style.width = pct + '%';
    }

    track.addEventListener('scroll', updateProgress, { passive: true });
    updateProgress();

    // ── Mouse events ────────────────────────────────────────
    track.addEventListener('mousedown', (e) => {
      isDown = true;
      startX = e.pageX - track.offsetLeft;
      scrollLeft = track.scrollLeft;
      lastX = e.pageX;
      lastTime = Date.now();
      velX = 0;

      track.classList.add('is-dragging');
      if (cursor) cursor.classList.add('is-dragging');
      if (cursorRing) cursorRing.classList.add('is-dragging');

      cancelAnimationFrame(rafId);
    });

    document.addEventListener('mouseup', () => {
      if (!isDown) return;
      isDown = false;
      track.classList.remove('is-dragging');
      if (cursor) cursor.classList.remove('is-dragging');
      if (cursorRing) cursorRing.classList.remove('is-dragging');

      // Apply momentum
      applyMomentum();
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      e.preventDefault();

      const now = Date.now();
      const dt  = now - lastTime || 1;
      velX = (e.pageX - lastX) / dt;
      lastX = e.pageX;
      lastTime = now;

      const x    = e.pageX - track.offsetLeft;
      const walk = (x - startX) * 1.4; // drag speed multiplier
      track.scrollLeft = scrollLeft - walk;
    });

    // ── Touch events ────────────────────────────────────────
    let touchStartX  = 0;
    let touchScrollL = 0;

    track.addEventListener('touchstart', (e) => {
      touchStartX  = e.touches[0].pageX;
      touchScrollL = track.scrollLeft;
      cancelAnimationFrame(rafId);
    }, { passive: true });

    track.addEventListener('touchmove', (e) => {
      const dx = touchStartX - e.touches[0].pageX;
      track.scrollLeft = touchScrollL + dx;
    }, { passive: true });

    // ── Momentum ────────────────────────────────────────────
    function applyMomentum() {
      // velX is pixels/ms; scale up for perceptible glide
      let momentum = velX * -18;
      const friction = 0.94;

      function glide() {
        if (Math.abs(momentum) < 0.5) return;
        track.scrollLeft += momentum;
        momentum *= friction;
        rafId = requestAnimationFrame(glide);
      }
      glide();
    }

    // ── Keyboard accessibility ───────────────────────────────
    track.setAttribute('tabindex', '0');
    track.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') track.scrollLeft += 340;
      if (e.key === 'ArrowLeft')  track.scrollLeft -= 340;
    });
  }

  /* ── Lightbox ───────────────────────────────────────────── */
  const lightbox     = document.getElementById('lightbox');
  const lightboxImg  = document.getElementById('lightboxImg');
  const lightboxClose = document.getElementById('lightboxClose');
  const lightboxPrev = document.getElementById('lightboxPrev');
  const lightboxNext = document.getElementById('lightboxNext');

  if (lightbox && track) {
    const items = Array.from(track.querySelectorAll('.gallery-item img'));
    let currentIndex = 0;

    function openLightbox(index) {
      currentIndex = index;
      lightboxImg.src = items[index].src;
      lightbox.classList.add('is-open');
      document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
      lightbox.classList.remove('is-open');
      document.body.style.overflow = '';
    }

    function showPrev() {
      currentIndex = (currentIndex - 1 + items.length) % items.length;
      lightboxImg.src = items[currentIndex].src;
    }

    function showNext() {
      currentIndex = (currentIndex + 1) % items.length;
      lightboxImg.src = items[currentIndex].src;
    }

    // Only open if the gallery didn't scroll (i.e. it was a click, not a drag)
    let scrollAtMouseDown = 0;
    track.addEventListener('mousedown', () => { scrollAtMouseDown = track.scrollLeft; });

    items.forEach((img, i) => {
      img.parentElement.addEventListener('click', () => {
        if (Math.abs(track.scrollLeft - scrollAtMouseDown) < 5) openLightbox(i);
      });
    });

    lightboxClose.addEventListener('click', closeLightbox);
    lightboxPrev.addEventListener('click', showPrev);
    lightboxNext.addEventListener('click', showNext);
    lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });

    document.addEventListener('keydown', (e) => {
      if (!lightbox.classList.contains('is-open')) return;
      if (e.key === 'Escape')     closeLightbox();
      if (e.key === 'ArrowLeft')  showPrev();
      if (e.key === 'ArrowRight') showNext();
    });
  }

  /* ── Contact Form ───────────────────────────────────────── */
  const form = document.getElementById('contactForm');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const btn = form.querySelector('.form-submit');
      btn.textContent = 'MESSAGE SENT ✓';
      btn.style.background   = 'transparent';
      btn.style.borderColor  = 'rgba(201,185,154,0.4)';
      btn.style.color        = 'var(--gold)';
      btn.style.cursor       = 'default';
      btn.disabled = true;

      // Reset after 4 seconds
      setTimeout(() => {
        form.reset();
        btn.innerHTML = 'SEND MESSAGE <span class="submit-arrow">→</span>';
        btn.style = '';
        btn.disabled = false;
      }, 4000);
    });
  }

  /* ── Subtle entrance animation for about/contact content ── */
  const animEls = document.querySelectorAll(
    '.about-content-col > *, .contact-info > *, .contact-form-col > *'
  );

  if (animEls.length && 'IntersectionObserver' in window) {
    animEls.forEach((el, i) => {
      el.style.opacity   = '0';
      el.style.transform = 'translateY(18px)';
      el.style.transition = `opacity 0.7s ease ${i * 0.07}s, transform 0.7s ease ${i * 0.07}s`;
    });

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity   = '1';
          entry.target.style.transform = 'translateY(0)';
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });

    animEls.forEach(el => observer.observe(el));
  }

});
