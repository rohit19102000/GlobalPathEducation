(function () {
  'use strict';

  document.documentElement.classList.remove('no-js');

  var WHATSAPP = '919326782611';
  var header = document.getElementById('header');
  var nav = document.getElementById('nav');
  var toggle = document.getElementById('navToggle');

  document.getElementById('year').textContent = new Date().getFullYear();

  // Sticky header shadow
  function onScroll() {
    header.classList.toggle('is-scrolled', window.scrollY > 10);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Mobile menu
  function closeMenu() {
    nav.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open menu');
  }
  toggle.addEventListener('click', function () {
    var open = nav.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  });
  nav.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', closeMenu); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });

  // Reveal on scroll + counters
  var counted = false;
  function runCounters() {
    if (counted) return;
    counted = true;
    document.querySelectorAll('[data-count]').forEach(function (el) {
      var target = +el.dataset.count, suffix = el.dataset.suffix || '', start = null;
      function tick(ts) {
        if (!start) start = ts;
        var p = Math.min((ts - start) / 1200, 1);
        el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))) + suffix;
        if (p < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    });
  }

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        if (entry.target.classList.contains('stat')) runCounters();
        io.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });

    // Highlight the nav link for the section in view
    var links = {};
    nav.querySelectorAll('a[href^="#"]:not(.btn)').forEach(function (a) { links[a.getAttribute('href').slice(1)] = a; });
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var link = links[entry.target.id];
        if (link && entry.isIntersecting) {
          Object.keys(links).forEach(function (k) { links[k].classList.remove('is-active'); });
          link.classList.add('is-active');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(links).forEach(function (id) {
      var sec = document.getElementById(id);
      if (sec) spy.observe(sec);
    });
  } else {
    document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('is-visible'); });
  }

  // Destination cards pre-select the form
  var destSelect = document.getElementById('destination');
  document.querySelectorAll('.dest__link').forEach(function (link) {
    link.addEventListener('click', function () {
      var card = link.closest('.dest');
      destSelect.value = link.dataset.dest || (card && card.dataset.dest) || '';
      document.getElementById('enquire').scrollIntoView({ behavior: 'smooth' });
      setTimeout(function () { document.getElementById('name').focus({ preventScroll: true }); }, 600);
    });
  });

  // Enquiry form
  var form = document.querySelector('.enquiry-form');
  var status = form.querySelector('.form-status');
  var btn = form.querySelector('button[type="submit"]');

  function setStatus(msg, type) {
    status.className = 'form-status' + (type ? ' is-' + type : '');
    status.innerHTML = msg;
  }

  function whatsappLink(data) {
    var text = 'Hi Global Path Education, I would like free counselling.\n' +
      'Name: ' + data.get('name') + '\nPhone: ' + data.get('phone') + '\nEmail: ' + data.get('email') +
      (data.get('destination') ? '\nDestination: ' + data.get('destination') : '') +
      (data.get('level') ? '\nLevel: ' + data.get('level') : '') +
      (data.get('city') ? '\nCity: ' + data.get('city') : '');
    return 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(text);
  }

  function validate() {
    var ok = true;
    ['name', 'phone', 'email'].forEach(function (id) {
      var input = document.getElementById(id);
      var valid = input.value.trim() !== '' && input.checkValidity();
      input.parentNode.classList.toggle('has-error', !valid);
      if (!valid) ok = false;
    });
    return ok;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!validate()) {
      setStatus('Please enter your name, a valid mobile number and email.', 'error');
      return;
    }
    var data = new FormData(form);
    btn.disabled = true;
    btn.textContent = 'Sending…';
    setStatus('');

    fetch(form.action, { method: 'POST', body: data, headers: { 'Accept': 'application/json' } })
      .then(function (res) { return res.json().then(function (j) { return { ok: res.ok && j.ok, msg: j.message }; }); })
      .then(function (r) {
        if (!r.ok) throw new Error(r.msg || 'send failed');
        form.reset();
        setStatus('Thank you! Our counsellor will contact you soon.', 'ok');
      })
      .catch(function () {
        setStatus('We could not send your request right now. <a href="' + whatsappLink(data) +
          '" target="_blank" rel="noopener">Send it on WhatsApp</a> or call <a href="tel:+919326782611">+91 93267 82611</a>.', 'error');
      })
      .finally(function () {
        btn.disabled = false;
        btn.textContent = 'Request a Call Back';
      });
  });
})();
