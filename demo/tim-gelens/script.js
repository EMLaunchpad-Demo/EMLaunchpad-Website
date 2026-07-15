/* Tim Gelens — demo website · kleine interacties */
(function () {
  'use strict';

  // Jaartal in footer
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Mobiel menu openen/sluiten
  var toggle = document.getElementById('navToggle');
  var nav = document.getElementById('nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? 'Menu sluiten' : 'Menu openen');
    });

    // Menu sluiten na klik op een link
    nav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        nav.classList.remove('open');
        toggle.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // Contactformulier (demo — verstuurt niet echt)
  var form = document.getElementById('contactForm');
  var note = document.getElementById('formNote');
  if (form && note) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var naam = (document.getElementById('naam') || {}).value || '';
      var email = (document.getElementById('email') || {}).value || '';
      if (!naam.trim() || !email.trim()) {
        note.textContent = 'Vul zeker je naam en e-mailadres in.';
        note.className = 'form-note';
        return;
      }
      note.textContent = 'Bedankt ' + naam.trim().split(' ')[0] +
        '! Je aanvraag is goed ontvangen — we nemen snel contact op. (Demo)';
      note.className = 'form-note ok';
      form.reset();
    });
  }
})();
