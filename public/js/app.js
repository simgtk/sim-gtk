(function () {
  var body = document.body;

  var toggle = document.getElementById('navToggle');
  if (toggle) {
    toggle.addEventListener('click', function () { body.classList.toggle('nav-open'); });
  }
  body.addEventListener('click', function (e) {
    if (body.classList.contains('nav-open') && e.target === body) body.classList.remove('nav-open');
    var dd = document.querySelectorAll('details.dropdown[open]');
    dd.forEach(function (d) {
      if (!d.contains(e.target)) d.removeAttribute('open');
    });
  });

  var flash = document.getElementById('flashBar');
  if (flash) {
    setTimeout(function () {
      flash.style.transition = 'opacity .35s ease, transform .35s ease';
      flash.style.opacity = '0';
      flash.style.transform = 'translateY(-10px)';
      setTimeout(function () { flash.remove(); }, 380);
    }, 4800);
  }

  document.querySelectorAll('[data-confirm]').forEach(function (el) {
    el.addEventListener('submit', function (e) {
      if (!window.confirm(el.getAttribute('data-confirm'))) e.preventDefault();
    });
  });

  document.querySelectorAll('[data-print]').forEach(function (el) {
    el.addEventListener('click', function (e) { e.preventDefault(); window.print(); });
  });

  document.querySelectorAll('[data-mark-hadir]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var scope = document.querySelector(btn.getAttribute('data-mark-hadir')) || document;
      scope.querySelectorAll('input[type=radio][value="H"]').forEach(function (r) { r.checked = true; });
    });
  });

  document.querySelectorAll('[data-autosubmit]').forEach(function (el) {
    el.addEventListener('change', function () { el.form && el.form.submit(); });
  });

  document.querySelectorAll('[data-copy]').forEach(function (el) {
    el.addEventListener('click', function () {
      var t = el.getAttribute('data-copy');
      if (navigator.clipboard) navigator.clipboard.writeText(t);
      var old = el.textContent;
      el.textContent = 'Tersalin!';
      setTimeout(function () { el.textContent = old; }, 1500);
    });
  });

  var passToggles = document.querySelectorAll('[data-pass-toggle]');
  passToggles.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var input = document.getElementById(btn.getAttribute('data-pass-toggle'));
      if (!input) return;
      input.type = input.type === 'password' ? 'text' : 'password';
      btn.innerHTML = input.type === 'password'
        ? '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><use href="#i-eye"></use></svg>'
        : '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><use href="#i-lock"></use></svg>';
    });
  });

  // bilah progres tipis saat berpindah halaman/menu
  var bar = document.createElement('div');
  bar.className = 'nav-progress';
  document.body.appendChild(bar);
  function startProgress() {
    bar.classList.remove('done');
    bar.classList.add('active');
    bar.style.width = '18%';
    setTimeout(function () { bar.style.width = '62%'; }, 120);
    setTimeout(function () { bar.style.width = '86%'; }, 420);
  }
  document.addEventListener('click', function (ev) {
    var a = ev.target.closest ? ev.target.closest('a') : null;
    if (!a) return;
    var href = a.getAttribute('href') || '';
    if (!href || href.charAt(0) === '#' || a.target === '_blank' || href.indexOf('http') === 0 || a.hasAttribute('download')) return;
    startProgress();
  });
  document.querySelectorAll('form').forEach(function (f) {
    f.addEventListener('submit', function () { startProgress(); });
  });

  var aiForm = document.querySelector('[data-ai-form]');
  if (aiForm) {
    aiForm.addEventListener('submit', function () {
      var btn = aiForm.querySelector('button[type=submit]');
      if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> Menyusun dokumen…'; }
      var box = document.getElementById('aiProgress');
      if (box) box.classList.remove('hidden');
    });
  }
})();


