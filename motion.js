/* shared motion: page transitions, nav, progress, marker highlight, clip reveal */
(function(){
  var less = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- page transition curtain ---- */
  var pt = document.createElement('div'); pt.className = 'pt'; document.body.appendChild(pt);

  if (!less && sessionStorage.getItem('pt')) {
    sessionStorage.removeItem('pt');
    pt.classList.add('instant','cover');
    void pt.offsetWidth;
    pt.classList.remove('instant');
    requestAnimationFrame(function(){ pt.classList.remove('cover'); pt.classList.add('out'); });
    setTimeout(function(){ pt.classList.remove('out'); }, 700);
  }

  document.addEventListener('click', function(e){
    if (less) return;
    var a = e.target.closest && e.target.closest('a');
    if (!a) return;
    var href = a.getAttribute('href');
    if (!href || href.charAt(0) === '#' || a.target === '_blank') return;
    if (!/\.html$/.test(href.split('?')[0])) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    sessionStorage.setItem('pt','1');
    pt.classList.add('cover');
    setTimeout(function(){ window.location.href = href; }, 430);
  });

  /* ---- scroll progress ---- */
  var bar = document.createElement('div'); bar.className = 'prog'; document.body.appendChild(bar);

  /* ---- nav hide on scroll down ---- */
  var nav = document.querySelector('nav'), last = 0;
  function onScroll(){
    var y = window.scrollY || document.documentElement.scrollTop;
    var h = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = (h > 0 ? (y / h) * 100 : 0) + '%';
    /* header stays fixed and visible at all times */
    last = y;
  }
  addEventListener('scroll', onScroll, {passive:true});
  onScroll();

  /* ---- marker highlight + clip reveal ---- */
  function watch(sel, cls, threshold){
    var o = new IntersectionObserver(function(es){
      es.forEach(function(en){
        if (!en.isIntersecting) return;
        en.target.classList.add(cls);
        o.unobserve(en.target);
      });
    }, {threshold: threshold || .6, rootMargin:'0px 0px -40px 0px'});
    document.querySelectorAll(sel).forEach(function(el){ o.observe(el); });
  }
  watch('.hl', 'on', .85);

  document.querySelectorAll('.hero-img').forEach(function(el){ el.classList.add('clipr'); });
  watch('.clipr', 'shown', .25);

  /* Failsafe. .clipr hides content until the observer fires, so anything that
     stops it firing (an image with no height yet, a load race) would clip real
     content out of existence. Never let decoration hide content: force-reveal
     anything already in view that the observer missed. */
  function unclip(){
    document.querySelectorAll('.clipr:not(.shown)').forEach(function(el){
      if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add('shown');
    });
  }
  document.querySelectorAll('img.hero-img').forEach(function(im){
    im.addEventListener('load', function(){ setTimeout(unclip, 60); });
    if (im.complete) setTimeout(unclip, 60);
  });
  addEventListener('load', function(){ setTimeout(unclip, 250); });
  setTimeout(unclip, 2500);
})();

/* ---------------- line mask reveal ---------------- */
(function(){
  var less = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var targets = [];
  document.querySelectorAll('h1, h2, .lead, .sub').forEach(function(el){
    // only plain-text elements: splitting would destroy nested markup
    var onlyText = Array.prototype.every.call(el.childNodes, function(n){ return n.nodeType === 3; });
    if (onlyText && el.textContent.trim()) targets.push(el);
  });

  function split(el){
    var text = el.dataset.raw || el.textContent;
    el.dataset.raw = text;
    el.innerHTML = text.trim().split(/\s+/)
      .map(function(w){ return '<span class="w">' + w + '</span>'; }).join(' ');
    var words = el.querySelectorAll('.w'), lines = [], top = null, cur = [];
    words.forEach(function(w){
      var t = w.offsetTop;
      if (top === null) top = t;
      if (Math.abs(t - top) > 4) { lines.push(cur); cur = []; top = t; }
      cur.push(w.textContent);
    });
    if (cur.length) lines.push(cur);
    el.innerHTML = lines.map(function(l){
      return '<span class="ln"><span class="li">' + l.join(' ') + '</span></span>';
    }).join('');
  }

  function run(){
    targets.forEach(function(el){
      split(el);
      if (less) { el.querySelectorAll('.ln').forEach(function(l){ l.classList.add('on'); }); return; }
      var o = new IntersectionObserver(function(es){
        es.forEach(function(en){
          if (!en.isIntersecting) return;
          el.querySelectorAll('.ln').forEach(function(l, i){
            setTimeout(function(){ l.classList.add('on'); }, i * 85);
          });
          o.unobserve(el);
        });
      }, {threshold:.2, rootMargin:'0px 0px -60px 0px'});
      o.observe(el);
    });
  }

  if (document.fonts && document.fonts.ready) document.fonts.ready.then(run);
  else addEventListener('load', run);

  var rt;
  addEventListener('resize', function(){
    clearTimeout(rt);
    rt = setTimeout(function(){
      targets.forEach(function(el){
        var wasOn = el.querySelector('.ln.on');
        split(el);
        if (wasOn || less) el.querySelectorAll('.ln').forEach(function(l){ l.classList.add('on'); });
      });
    }, 200);
  });
})();

/* ---------------- concurrency lanes: scroll-linked, no pinning ----------------
   Progress is driven by where the chart sits in the viewport, so you scrub it
   forwards and backwards by scrolling normally. The section behaves like every
   other section: no sticky, no tall track, no hijacked scrolling. */
(function(){
  var less = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var box = document.getElementById('lanechart');
  if (!box) return;
  var bars  = box.querySelectorAll('.bar');
  var head  = document.getElementById('playhead');
  var track = box.querySelector('.lane-track');

  if (less) {
    bars.forEach(function(b){ b.style.width = b.dataset.w; b.classList.add('lit'); });
    return;
  }
  /* JS owns width now, so the CSS transition would fight the scrub */
  bars.forEach(function(b){ b.style.transition = 'none'; });

  var ticking = false;
  function frame(){
    ticking = false;
    var r  = box.getBoundingClientRect();
    var vh = window.innerHeight;
    var startY = vh * 0.88;   /* begins as the chart enters from below */
    var endY   = vh * 0.32;   /* complete by the time it sits comfortably in view */
    var p = (startY - r.top) / (startY - endY);
    p = Math.min(1, Math.max(0, p));

    bars.forEach(function(b, i){
      var start = i * 0.09, span = 0.62;
      var lp = Math.min(1, Math.max(0, (p - start) / span));
      var eased = lp * lp * (3 - 2 * lp);
      b.style.width = (parseFloat(b.dataset.w) * eased) + '%';
      b.classList.toggle('lit', lp > 0.22);
    });

    if (head && track) {
      head.style.left = (track.offsetLeft + p * track.offsetWidth) + 'px';
      head.classList.toggle('on', p > 0.02 && p < 0.985);
    }
  }
  function onScroll(){ if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
  addEventListener('scroll', onScroll, {passive:true});
  addEventListener('resize', onScroll);
  frame();
})();
