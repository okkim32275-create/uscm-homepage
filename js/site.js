/* USCM 사이트 공통 스크립트 */
(function () {
  'use strict';

  var isMobile = function () { return window.innerWidth <= 991; };

  /* ---------- 헤더: 스크롤 시 흰 배경 ---------- */
  var header = document.querySelector('.site-header');
  function onScroll() {
    if (!header) return;
    header.classList.toggle('scrolled', window.scrollY > 10);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- 모바일 메뉴 ---------- */
  function setMenu(open) { document.body.classList.toggle('menu-open', open); }
  document.querySelectorAll('[data-menu-open]').forEach(function (b) {
    b.addEventListener('click', function () { setMenu(true); });
  });
  document.querySelectorAll('[data-menu-close]').forEach(function (b) {
    b.addEventListener('click', function () { setMenu(false); });
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });

  /* ---------- 등장 애니메이션 (AOS 대체) ---------- */
  var aosEls = Array.prototype.slice.call(document.querySelectorAll('[data-aos]'));
  if (aosEls.length && 'IntersectionObserver' in window &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var baseDelay = isMobile() ? 50 : 100;
    var offset = isMobile() ? 100 : 200;
    aosEls.forEach(function (el) {
      var d = parseInt(el.getAttribute('data-aos-delay') || '0', 10) + baseDelay;
      el.style.transitionDelay = d + 'ms';
    });
    document.documentElement.classList.add('aos-ready');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('aos-animate'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -' + offset + 'px 0px' });
    aosEls.forEach(function (el) { io.observe(el); });
    // 첫 화면에 이미 보이는 요소는 바로 시작
    requestAnimationFrame(function () {
      aosEls.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.top < window.innerHeight && r.bottom > 0) { el.classList.add('aos-animate'); io.unobserve(el); }
      });
    });
  }

  /* ---------- 연혁 슬라이더 (Swiper 대체) ---------- */
  document.querySelectorAll('[data-slider]').forEach(function (slider) {
    var track = slider.querySelector('.ab1-track');
    var slides = track.children;
    var root = slider.closest('.ab1-wrapper') || document;
    var prev = root.querySelector('[data-slider-prev]');
    var next = root.querySelector('[data-slider-next]');
    var index = 0;

    function metrics() {
      var gap = parseFloat(getComputedStyle(track).columnGap || getComputedStyle(track).gap) || 0;
      var w = slides[0].getBoundingClientRect().width;
      var maxShift = Math.max(0, track.scrollWidth - slider.clientWidth);
      return { step: w + gap, maxShift: maxShift, maxIndex: Math.ceil(maxShift / (w + gap) - 0.01) };
    }
    function render(animate) {
      var m = metrics();
      index = Math.max(0, Math.min(index, m.maxIndex));
      var shift = Math.min(index * m.step, m.maxShift);
      track.style.transition = animate === false ? 'none' : '';
      track.style.transform = 'translate3d(' + (-shift) + 'px,0,0)';
      if (prev) prev.classList.toggle('disabled', index === 0);
      if (next) next.classList.toggle('disabled', index >= m.maxIndex);
    }
    if (prev) prev.addEventListener('click', function () { index--; render(); });
    if (next) next.addEventListener('click', function () { index++; render(); });
    window.addEventListener('resize', function () { render(false); });

    // 드래그 / 스와이프
    var startX = null, startShift = 0, dx = 0;
    slider.addEventListener('pointerdown', function (e) {
      startX = e.clientX; dx = 0;
      var m = metrics(); startShift = Math.min(index * m.step, m.maxShift);
      slider.classList.add('dragging');
      track.style.transition = 'none';
    });
    window.addEventListener('pointermove', function (e) {
      if (startX === null) return;
      dx = e.clientX - startX;
      track.style.transform = 'translate3d(' + (-startShift + dx) + 'px,0,0)';
    });
    window.addEventListener('pointerup', function () {
      if (startX === null) return;
      startX = null;
      slider.classList.remove('dragging');
      if (dx < -40) index++; else if (dx > 40) index--;
      render();
    });
    render(false);
  });

  /* ---------- FAQ 아코디언 ---------- */
  document.querySelectorAll('.faq-question').forEach(function (q) {
    q.addEventListener('click', function () {
      var item = q.closest('.faq-item');
      var open = item.classList.toggle('active');
      q.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  });

  /* ---------- 문의 폼 → 이메일 발송 ---------- */
  var form = document.getElementById('contactForm');
  if (form) {
    var msg = form.querySelector('.form-msg');
    var btn = form.querySelector('.submit-btn');
    function show(type, text) { msg.className = 'form-msg ' + type; msg.textContent = text; }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var fd = new FormData(form);
      if (fd.get('_honey')) return; // 스팸 봇 차단

      var required = [['문의구분', '문의구분을 선택해 주세요.'], ['이름', '이름을 입력해 주세요.'],
        ['연락처', '연락처를 입력해 주세요.'], ['이메일', '이메일을 입력해 주세요.'], ['문의내용', '문의내용을 입력해 주세요.']];
      for (var i = 0; i < required.length; i++) {
        if (!String(fd.get(required[i][0]) || '').trim()) {
          show('err', required[i][1]);
          var el = form.querySelector('[name="' + required[i][0] + '"]'); if (el) el.focus();
          return;
        }
      }
      var email = String(fd.get('이메일')).trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { show('err', '이메일 형식을 확인해 주세요.'); return; }
      if (!form.querySelector('#agree').checked) { show('err', '개인정보 수집 및 이용에 동의해 주세요.'); return; }

      var payload = {
        _subject: '[USCM 홈페이지 문의] ' + fd.get('문의구분') + ' / ' + fd.get('이름'),
        _template: 'table',
        _replyto: email,
        '문의구분': fd.get('문의구분'),
        '이름': fd.get('이름'),
        '연락처': fd.get('연락처'),
        '이메일': email,
        '문의내용': fd.get('문의내용'),
        '접수페이지': location.href
      };

      btn.disabled = true; btn.textContent = '전송 중...';
      fetch(form.action, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload)
      }).then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
        .then(function (res) {
          if (res.ok && String(res.j.success) !== 'false') {
            form.reset();
            show('ok', '문의가 접수되었습니다. 빠르게 연락드리겠습니다.');
          } else { throw new Error(res.j && res.j.message); }
        })
        .catch(function () {
          show('err', '전송에 실패했습니다. 잠시 후 다시 시도하시거나 ceo@uscm.co.kr 로 메일 부탁드립니다.');
        })
        .finally(function () { btn.disabled = false; btn.textContent = '작성'; });
    });
  }
})();

/* 메인 실적 숫자 카운트업 */
(function () {
  var els = document.querySelectorAll('[data-count]');
  if (!els.length || !('IntersectionObserver' in window)) return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      io.unobserve(en.target);
      var el = en.target, to = parseInt(el.getAttribute('data-count'), 10);
      var from = parseInt(el.getAttribute('data-from') || '0', 10), fmt = el.hasAttribute('data-fmt');
      var t0 = null, dur = 1400;
      function step(ts) {
        if (!t0) t0 = ts;
        var p = Math.min((ts - t0) / dur, 1), e = 1 - Math.pow(1 - p, 3);
        var v = Math.round(from + (to - from) * e);
        el.textContent = fmt ? v.toLocaleString('ko-KR') : String(v);
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    });
  }, { threshold: 0.4 });
  els.forEach(function (el) { io.observe(el); });
})();
