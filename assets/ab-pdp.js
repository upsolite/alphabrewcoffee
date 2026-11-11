/* A/B test variant behaviour. Loaded only by the ab-pdp-hero section. */
(function () {
  function all(selector, scope) {
    return Array.prototype.slice.call((scope || document).querySelectorAll(selector));
  }

  // Each element is wired up once, so init() can re-run after a theme editor reload.
  function each(selector, setup) {
    all(selector).forEach(function (el) {
      if (el.dataset.abReady) return;
      el.dataset.abReady = '1';
      setup(el);
    });
  }

  /* Rotating banner: every 4s, arrows skip, pauses while touched */
  function initBanner() {
    each('[data-ab-banner]', function (banner) {
      var msgs = all('.ab-banner__msg', banner);
      if (!msgs.length) return;
      var i = 0;
      var paused = false;
      var show = function (n) {
        msgs[i].classList.remove('is-active');
        i = (n + msgs.length) % msgs.length;
        msgs[i].classList.add('is-active');
      };
      banner.querySelector('[data-ab-banner-prev]').addEventListener('click', function () { show(i - 1); });
      banner.querySelector('[data-ab-banner-next]').addEventListener('click', function () { show(i + 1); });
      banner.addEventListener('touchstart', function () { paused = true; }, { passive: true });
      banner.addEventListener('touchend', function () { paused = false; }, { passive: true });
      var timer = setInterval(function () {
        if (!document.contains(banner)) return clearInterval(timer);
        if (!paused) show(i + 1);
      }, 4000);
    });
  }

  /* Gallery: swipe, thumbnails, fullscreen. Slides can be hidden for No Caffeine, so only visible ones count. */
  function visibleOf(list) {
    return list.filter(function (el) { return el.offsetParent !== null; });
  }
  function shownImg(el) {
    return visibleOf(all('img', el))[0] || el.querySelector('img');
  }
  function openLightbox(slides, thumbs, start) {
    var srcs = slides.map(function (s) { var img = shownImg(s); return img.currentSrc || img.src; });
    var n = start;
    var zoomed = false;
    var lb = document.createElement('div');
    lb.className = 'ab-lb';
    lb.setAttribute('role', 'dialog');
    lb.setAttribute('aria-modal', 'true');
    lb.innerHTML = '<div class="ab-lb__top"><span data-c></span><button type="button" data-x aria-label="Close">×</button></div>' +
      '<div class="ab-lb__stage"><img alt=""><button type="button" class="ab-lb__prev" aria-label="Previous">‹</button><button type="button" class="ab-lb__next" aria-label="Next">›</button></div>' +
      '<div class="ab-lb__thumbs"></div>';
    var img = lb.querySelector('.ab-lb__stage img');
    var row = lb.querySelector('.ab-lb__thumbs');
    var count = lb.querySelector('[data-c]');
    srcs.forEach(function (src, k) {
      var t = new Image();
      t.src = thumbs[k] ? shownImg(thumbs[k]).src : src;
      t.alt = '';
      t.addEventListener('click', function () { go(k); });
      row.appendChild(t);
    });
    function go(k) {
      n = (k + srcs.length) % srcs.length;
      zoomed = false;
      img.style.transform = '';
      img.src = srcs[n];
      count.textContent = (n + 1) + ' / ' + srcs.length;
      Array.prototype.forEach.call(row.children, function (t, j) { t.classList.toggle('is-active', j === n); });
    }
    function close() {
      lb.remove();
      document.documentElement.style.overflow = '';
    }
    lb.querySelector('[data-x]').addEventListener('click', close);
    lb.querySelector('.ab-lb__prev').addEventListener('click', function () { go(n - 1); });
    lb.querySelector('.ab-lb__next').addEventListener('click', function () { go(n + 1); });
    var last = 0, sx = 0, sy = 0, multi = false;
    var stage = lb.querySelector('.ab-lb__stage');
    var toggleZoom = function () {
      zoomed = !zoomed;
      img.style.transform = zoomed ? 'scale(3)' : '';
    };
    img.addEventListener('dblclick', toggleZoom);
    stage.addEventListener('touchstart', function (e) {
      multi = e.touches.length > 1;
      sx = e.touches[0].clientX;
      sy = e.touches[0].clientY;
    }, { passive: true });
    stage.addEventListener('touchend', function (e) {
      if (multi || zoomed) {
        if (!multi && Date.now() - last < 300) toggleZoom();
        last = Date.now();
        return;
      }
      var dx = e.changedTouches[0].clientX - sx;
      var dy = e.changedTouches[0].clientY - sy;
      if (dy > 80 && Math.abs(dy) > Math.abs(dx)) return close();
      if (Math.abs(dx) > 40) return go(n + (dx < 0 ? 1 : -1));
      if (Date.now() - last < 300) toggleZoom();
      last = Date.now();
    }, { passive: true });
    document.documentElement.style.overflow = 'hidden';
    document.body.appendChild(lb);
    go(n);
  }

  function initGallery(root) {
    var track = root.querySelector('[data-ab-track]');
    var slides = all('[data-ab-slide]', root);
    var thumbs = all('[data-ab-thumb]', root);
    var row = root.querySelector('[data-ab-thumbs]');
    if (!track || !slides.length) return;
    var current = 0;
    var ticking = false;
    var thumbFor = function (slide) { return root.querySelector('[data-ab-thumb="' + slide.dataset.abSlide + '"]'); };
    var setThumb = function (slide) {
      var t = thumbFor(slide);
      thumbs.forEach(function (x) { x.classList.toggle('is-active', x === t); });
      if (t) row.scrollTo({ left: t.offsetLeft - row.offsetLeft - (row.clientWidth - t.offsetWidth) / 2, behavior: 'smooth' });
    };
    track.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        ticking = false;
        var shown = visibleOf(slides);
        if (!shown.length) return;
        var n = Math.round(track.scrollLeft / shown[0].offsetWidth);
        if (n !== current && shown[n]) {
          current = n;
          setThumb(shown[n]);
        }
      });
    }, { passive: true });
    thumbs.forEach(function (t) {
      t.addEventListener('click', function () {
        var slide = root.querySelector('[data-ab-slide="' + t.dataset.abThumb + '"]');
        track.scrollTo({ left: slide.offsetLeft - track.offsetLeft, behavior: 'smooth' });
      });
    });
    slides.forEach(function (s) {
      s.addEventListener('click', function () {
        var shown = visibleOf(slides);
        openLightbox(shown, shown.map(thumbFor), shown.indexOf(s));
      });
    });
    root.abResetGallery = function () {
      track.scrollLeft = 0;
      current = 0;
      var first = visibleOf(slides)[0];
      if (first) setThumb(first);
    };
  }

  /* Bundles, purchase mode and Add To Cart */
  function initBuyBox(root) {
    var cards = all('[data-ab-card]', root);
    var onetime = false;
    var q = function (s) { return root.querySelector(s); };
    var selected = function () { return q('[data-ab-card].is-selected'); };

    // Caffeine / No Caffeine: picks the matching variant and switches the page copy.
    var bases = all('[data-ab-base]', root);
    var base = bases.length ? bases[0].querySelector('input').value : '';
    document.documentElement.classList.remove('ab-nc');
    var variantFor = function (c) {
      if (!base || !c.dataset.variants) return c.dataset.variant;
      return JSON.parse(c.dataset.variants)[base] || c.dataset.variant;
    };
    bases.forEach(function (b) {
      b.querySelector('input').addEventListener('change', function () {
        base = this.value;
        bases.forEach(function (o) { o.classList.toggle('is-selected', o === b); });
        document.documentElement.classList.toggle('ab-nc', b.hasAttribute('data-nc'));
        if (root.abResetGallery) root.abResetGallery();
      });
    });

    function sync() {
      var c = selected();
      root.classList.toggle('is-onetime', onetime);
      q('[data-ab-one-price]').textContent = c.dataset.one;
      q('[data-ab-sticky-title]').textContent = c.dataset.title;
      q('[data-ab-sticky-price]').textContent = onetime ? c.dataset.one : c.dataset.sub;
      q('[data-ab-sticky-compare]').textContent = c.dataset.compare;
      q('[data-ab-sticky-pack]').src = c.dataset.pack;
    }
    cards.forEach(function (c) {
      c.querySelector('input').addEventListener('change', function () {
        cards.forEach(function (o) { o.classList.toggle('is-selected', o === c); });
        sync();
      });
    });
    q('[data-ab-mode]').addEventListener('click', function () {
      onetime = !onetime;
      sync();
    });
    sync();

    var buttons = all('[data-ab-atc]', root);
    var error = q('[data-ab-error]');
    var busy = false;
    function setState(label, sub) {
      buttons.forEach(function (b) {
        b.querySelector('[data-ab-atc-label]').textContent = label;
        var s = b.querySelector('[data-ab-atc-sub]');
        if (s) s.textContent = sub;
        b.setAttribute('aria-busy', busy ? 'true' : 'false');
      });
    }
    function idle() {
      busy = false;
      setState('Add To Cart', '90-Day Money-Back Guarantee');
    }
    function addToCart() {
      if (busy) return;
      busy = true;
      error.hidden = true;
      setState('Adding…', 'Securing your bundle');
      var c = selected();
      var cart = document.querySelector('cart-drawer');
      var body = new FormData();
      body.append('id', variantFor(c));
      body.append('quantity', c.dataset.qty);
      if (!onetime) body.append('selling_plan', c.dataset.plan);
      if (cart) {
        body.append('sections', cart.getSectionsToRender().map(function (s) { return s.id; }));
        body.append('sections_url', window.location.pathname);
      }
      fetch(window.routes.cart_add_url, {
        method: 'POST',
        headers: { Accept: 'application/javascript', 'X-Requested-With': 'XMLHttpRequest' },
        body: body
      })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          if (data.status) throw new Error(data.description || data.message || 'Could not add to cart');
          setState('✓ Added To Cart', 'Opening your cart…');
          setTimeout(function () {
            idle();
            if (cart) {
              cart.classList.remove('is-empty');
              cart.renderContents(data);
            } else {
              window.location = window.routes.cart_url;
            }
          }, 1200);
        })
        .catch(function (e) {
          idle();
          error.textContent = e.message || 'Something went wrong. Please try again.';
          error.hidden = false;
        });
    }
    buttons.forEach(function (b) { b.addEventListener('click', addToCart); });
  }

  /* Delivery estimate: today + 5 days, moved off Sundays */
  function initDelivery(root) {
    var d = new Date();
    d.setDate(d.getDate() + 5);
    if (d.getDay() === 0) d.setDate(d.getDate() + 1);
    var n = d.getDate();
    var v = n % 100;
    var suffix = (v > 10 && v < 14) ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' }[n % 10] || 'th');
    var box = root.querySelector('[data-ab-delivery]');
    box.textContent = 'Estimated delivery: ';
    var b = document.createElement('b');
    b.textContent = d.toLocaleDateString('en-US', { weekday: 'short' }) + ', ' + d.toLocaleDateString('en-US', { month: 'short' }) + ' ' + n + suffix;
    box.appendChild(b);
  }

  /* Sticky bar: shows once the main button has scrolled away, hides over the footer */
  function initSticky(root) {
    var sticky = root.querySelector('[data-ab-sticky]');
    var main = root.querySelector('.ab-atc');
    var footer = document.querySelector('[id*="__footer"]');
    var render = function () {
      var pastButton = main.getBoundingClientRect().bottom < 0;
      var footerVisible = footer ? footer.getBoundingClientRect().top < window.innerHeight : false;
      var on = pastButton && !footerVisible;
      sticky.classList.toggle('is-visible', on);
      sticky.setAttribute('aria-hidden', on ? 'false' : 'true');
      sticky.querySelector('button').tabIndex = on ? 0 : -1;
    };
    window.addEventListener('scroll', render, { passive: true });
    window.addEventListener('resize', render);
    render();
  }

  /* Supplement Facts sheet */
  var sheetOpener = null;
  function closeSheet() {
    var sheet = document.querySelector('[data-ab-sheet]');
    if (!sheet || sheet.hidden) return;
    sheet.hidden = true;
    document.documentElement.style.overflow = '';
    if (sheetOpener) sheetOpener.focus();
  }
  function initSheet() {
    each('[data-ab-sheet]', function (sheet) {
      var handle = sheet.querySelector('[data-ab-sheet-handle]');
      var y = 0;
      sheet.querySelector('[data-ab-sheet-close]').addEventListener('click', closeSheet);
      sheet.addEventListener('click', function (e) { if (e.target === sheet) closeSheet(); });
      handle.addEventListener('touchstart', function (e) { y = e.touches[0].clientY; }, { passive: true });
      handle.addEventListener('touchend', function (e) { if (e.changedTouches[0].clientY - y > 50) closeSheet(); }, { passive: true });
    });
    each('[data-ab-sheet-open]', function (b) {
      b.addEventListener('click', function () {
        var sheet = document.querySelector('[data-ab-sheet]');
        if (!sheet) return;
        sheetOpener = b;
        sheet.hidden = false;
        document.documentElement.style.overflow = 'hidden';
        sheet.querySelector('[data-ab-sheet-close]').focus();
      });
    });
  }

  /* Tabs */
  function showTab(box, name) {
    all('[data-ab-tab]', box).forEach(function (t) {
      var on = t.dataset.abTab === name;
      t.classList.toggle('is-active', on);
      t.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    all('[data-ab-panel]', box).forEach(function (p) {
      var on = p.dataset.abPanel === name;
      p.hidden = !on;
      p.classList.toggle('is-active', on);
    });
  }
  function initTabs() {
    each('[data-ab-tabs]', function (box) {
      all('[data-ab-tab]', box).forEach(function (t) {
        t.addEventListener('click', function () { showTab(box, t.dataset.abTab); });
      });
    });
  }

  /* Ingredients: show all / show less */
  function setIngredients(btn, list, open) {
    list.classList.toggle('is-open', open);
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    btn.querySelector('[data-ab-ing-label]').textContent = open ? btn.dataset.less : btn.dataset.more;
  }
  function initIngredients() {
    each('[data-ab-ing-toggle]', function (btn) {
      var section = btn.closest('section');
      var list = section.querySelector('[data-ab-ing]');
      btn.addEventListener('click', function () {
        var open = !list.classList.contains('is-open');
        setIngredients(btn, list, open);
        if (!open) section.scrollIntoView({ behavior: 'smooth' });
      });
    });
  }

  /* Carousels: dots follow the swipe */
  function initCarousels() {
    each('[data-ab-carousel]', function (track) {
      var dots = track.parentElement.querySelector('[data-ab-dots]');
      var items = track.children;
      if (!dots) return;
      for (var d = 0; d < items.length; d++) dots.appendChild(document.createElement('i'));
      var set = function () {
        var step = items.length > 1 ? items[1].offsetLeft - items[0].offsetLeft : 1;
        var n = Math.min(items.length - 1, Math.round(track.scrollLeft / step));
        Array.prototype.forEach.call(dots.children, function (x, k) { x.classList.toggle('is-active', k === n); });
      };
      track.addEventListener('scroll', set, { passive: true });
      set();
    });
  }

  /* Reviews: topic filter */
  function initReviews() {
    each('.ab-rev__chips', function (group) {
      var chips = all('[data-ab-chip]', group);
      var reviews = all('[data-ab-tags]', group.closest('section'));
      chips.forEach(function (c) {
        c.addEventListener('click', function () {
          chips.forEach(function (o) { o.classList.toggle('is-active', o === c); });
          reviews.forEach(function (r) {
            r.hidden = c.dataset.abChip !== 'all' && r.dataset.abTags.split(' ').indexOf(c.dataset.abChip) < 0;
          });
        });
      });
    });
  }

  /* FAQ: one open at a time */
  function setFaq(item, open) {
    item.classList.toggle('is-open', open);
    var q = item.querySelector('.ab-faq__q');
    q.setAttribute('aria-expanded', open ? 'true' : 'false');
    q.querySelector('i').textContent = open ? '−' : '+';
  }
  function initFaq() {
    each('[data-ab-faq]', function (list) {
      var items = all('.ab-faq__item', list);
      items.forEach(function (item) {
        item.querySelector('.ab-faq__q').addEventListener('click', function () {
          var open = !item.classList.contains('is-open');
          items.forEach(function (o) { setFaq(o, false); });
          setFaq(item, open);
        });
      });
    });
  }

  /* In-page links */
  function initScrollLinks() {
    each('[data-ab-scroll]', function (b) {
      b.addEventListener('click', function () {
        var el = document.querySelector(b.dataset.abScroll);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      });
    });
  }

  function init() {
    each('[data-ab-pdp]', function (root) {
      initGallery(root);
      initBuyBox(root);
      initDelivery(root);
      initSticky(root);
    });
    initBanner();
    initSheet();
    initTabs();
    initIngredients();
    initCarousels();
    initReviews();
    initFaq();
    initScrollLinks();
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeSheet();
  });

  // Theme editor: re-wire reloaded sections and reveal the block being edited.
  document.addEventListener('shopify:section:load', init);
  document.addEventListener('shopify:block:select', function (e) {
    var el = e.target;
    var panel = el.closest('[data-ab-panel]');
    if (panel) showTab(panel.closest('[data-ab-tabs]'), panel.dataset.abPanel);
    if (el.classList.contains('is-extra')) {
      var section = el.closest('section');
      setIngredients(section.querySelector('[data-ab-ing-toggle]'), section.querySelector('[data-ab-ing]'), true);
    }
    if (el.classList.contains('ab-faq__item')) setFaq(el, true);
  });

  init();
})();
