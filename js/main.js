/* TODOCOPIAS — funciones del sitio (sin librerías) */

/* ===================== CONFIGURACIÓN (editar acá) ===================== */
var TC = {
  whatsapp: '5492995973790',
  zonaHoraria: 'America/Argentina/Buenos_Aires',
  // Horario: minutos desde las 00:00. Días: 1 = lunes … 5 = viernes.
  dias: [1, 2, 3, 4, 5],
  turnos: [[9 * 60, 13 * 60], [17 * 60, 20 * 60]],
  // Agenda: desde este mes (1 = enero) se muestra el año siguiente.
  mesCambioAgenda: 7,
  // Calculadora de stickers de vinilo (medidas en cm)
  vinilo: {
    anchoRolloCm: 100,   // ancho del rollo
    largoMinimoCm: 100,  // compra mínima de largo
    pasoLargoCm: 50,     // el largo aumenta de a medio metro
    margenCm: 5,         // margen de corte en cada borde
    separacionCm: 0.3    // separación entre stickers
  }
};
/* ====================================================================== */

(function () {
  'use strict';

  function waLink(texto) {
    return 'https://wa.me/' + TC.whatsapp + (texto ? '?text=' + encodeURIComponent(texto) : '');
  }
  function fmt(n) {
    return n.toLocaleString('es-AR', { maximumFractionDigits: 2 });
  }
  function hhmm(min) {
    var h = Math.floor(min / 60), m = min % 60;
    return h + ':' + (m < 10 ? '0' : '') + m;
  }

  /* ---------- Hora actual en Argentina ---------- */
  function ahora() {
    var parts = new Intl.DateTimeFormat('en-US', {
      timeZone: TC.zonaHoraria, weekday: 'short', hour: 'numeric', minute: 'numeric', hour12: false
    }).formatToParts(new Date());
    var get = function (t) { for (var i = 0; i < parts.length; i++) { if (parts[i].type === t) return parts[i].value; } return ''; };
    var dia = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'));
    return { dia: dia, min: (parseInt(get('hour'), 10) % 24) * 60 + parseInt(get('minute'), 10) };
  }

  /* ---------- Estado abierto / cerrado ---------- */
  function estado() {
    var n = ahora();
    var abreHoy = TC.dias.indexOf(n.dia) !== -1;
    if (abreHoy) {
      for (var i = 0; i < TC.turnos.length; i++) {
        var t = TC.turnos[i];
        if (n.min < t[0]) return { abierto: false, texto: 'Cerrado · abre hoy a las ' + hhmm(t[0]) };
        if (n.min < t[1]) return { abierto: true, texto: 'Abierto ahora · cierra a las ' + hhmm(t[1]) };
      }
    }
    // Próximo día hábil
    var nombres = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    for (var k = 1; k <= 7; k++) {
      var d = (n.dia + k) % 7;
      if (TC.dias.indexOf(d) !== -1) {
        var cuando = k === 1 ? 'mañana' : 'el ' + nombres[d];
        return { abierto: false, texto: 'Cerrado · abre ' + cuando + ' a las ' + hhmm(TC.turnos[0][0]) };
      }
    }
    return { abierto: false, texto: 'Cerrado' };
  }

  function pintarEstado() {
    var e = estado();
    var els = document.querySelectorAll('[data-status]');
    for (var i = 0; i < els.length; i++) {
      els[i].classList.toggle('is-open', e.abierto);
      var txt = els[i].querySelector('[data-status-text]');
      if (txt) txt.textContent = e.texto;
    }
    var hoy = ahora().dia;
    var filas = document.querySelectorAll('[data-day]');
    for (var j = 0; j < filas.length; j++) {
      filas[j].classList.toggle('is-today', parseInt(filas[j].getAttribute('data-day'), 10) === hoy);
    }
  }

  /* ---------- Año de la agenda ---------- */
  function pintarAnio() {
    var d = new Date();
    var anio = d.getMonth() + 1 >= TC.mesCambioAgenda ? d.getFullYear() + 1 : d.getFullYear();
    var els = document.querySelectorAll('[data-year]');
    for (var i = 0; i < els.length; i++) els[i].textContent = anio;
    var links = document.querySelectorAll('[data-wa-year]');
    for (var j = 0; j < links.length; j++) {
      links[j].href = waLink(links[j].getAttribute('data-wa-year').replace('{año}', anio));
    }
  }

  /* ---------- Calculadora de vinilo ---------- */
  function calcular(wCm, hCm, cantidad) {
    var c = TC.vinilo;
    var mm = function (cm) { return Math.round(cm * 10); };
    var rollW = mm(c.anchoRolloCm), minL = mm(c.largoMinimoCm), paso = mm(c.pasoLargoCm);
    var m = mm(c.margenCm), sep = mm(c.separacionCm);
    var util = rollW - 2 * m;
    var mejor = null;
    [[mm(wCm), mm(hCm)], [mm(hCm), mm(wCm)]].forEach(function (o) {
      var sw = o[0], sh = o[1];
      var porFila = Math.floor((util + sep) / (sw + sep));
      if (porFila < 1) return;
      var filasNec = Math.ceil(cantidad / porFila);
      var largoNec = filasNec * (sh + sep) - sep + 2 * m;
      var L = Math.max(minL, Math.ceil(largoNec / paso) * paso);
      var filas = Math.floor((L - 2 * m + sep) / (sh + sep));
      var cap = porFila * filas;
      if (!mejor || L < mejor.L || (L === mejor.L && cap > mejor.cap)) {
        mejor = { L: L, cap: cap, porFila: porFila, filas: filas };
      }
    });
    return mejor;
  }

  function iniciarCalculadora() {
    var form = document.getElementById('calc-form');
    if (!form) return;
    var $ = function (id) { return document.getElementById(id); };
    var c = TC.vinilo;
    $('calc-ancho-rollo').textContent = fmt(c.anchoRolloCm / 100);
    $('calc-sep').textContent = fmt(c.separacionCm * 10);

    function num(v) { return parseFloat(String(v).replace(',', '.')); }

    function actualizar() {
      var w = num($('calc-w').value), h = num($('calc-h').value), q = parseInt($('calc-q').value, 10);
      var ok = $('calc-ok'), err = $('calc-err');
      if (!(w > 0) || !(h > 0) || !(q > 0)) {
        ok.hidden = true; err.hidden = false;
        $('calc-err-text').textContent = 'Completá el ancho, el alto y la cantidad.';
        return;
      }
      var r = calcular(w, h, q);
      if (!r) {
        ok.hidden = true; err.hidden = false;
        $('calc-err-text').textContent = 'El sticker es más grande que el ancho útil del rollo (' + fmt(c.anchoRolloCm - 2 * c.margenCm) + ' cm). Consultanos por WhatsApp.';
        return;
      }
      var anchoM = c.anchoRolloCm / 100, largoM = r.L / 1000;
      var medida = fmt(w) + ' × ' + fmt(h) + ' cm';
      var rollo = fmt(anchoM) + ' × ' + fmt(largoM) + ' m';
      $('calc-rollo').textContent = rollo;
      $('calc-cap').textContent = r.cap.toLocaleString('es-AR');
      $('calc-medida').textContent = medida;
      $('calc-por-fila').textContent = r.porFila;
      $('calc-filas').textContent = r.filas;
      $('calc-m2').textContent = fmt(anchoM * largoM) + ' m²';
      var extra = $('calc-extra');
      if (r.cap > q) {
        extra.hidden = false;
        extra.textContent = 'Pediste ' + q.toLocaleString('es-AR') + ': podés sumar ' + (r.cap - q).toLocaleString('es-AR') + ' más en el mismo rollo.';
      } else {
        extra.hidden = true;
      }
      $('calc-wa').href = waLink('Hola, quiero ~' + q + ' stickers de vinilo de ' + medida + ' (rollo ' + rollo + ').');
      err.hidden = true; ok.hidden = false;
    }

    form.addEventListener('input', actualizar);
    form.addEventListener('submit', function (e) { e.preventDefault(); actualizar(); });
    actualizar();
  }

  /* ---------- Ajustar texto al ancho del bloque (subtítulo de la portada) ---------- */
  function ajustarTextos() {
    var els = document.querySelectorAll('[data-fit]');
    for (var i = 0; i < els.length; i++) {
      var el = els[i], inner = el.firstElementChild;
      if (!inner) continue;
      el.style.fontSize = '100px';
      var w = inner.getBoundingClientRect().width;
      var target = el.clientWidth;
      el.style.fontSize = w > 0 && target > 0 ? Math.min(40, (100 * target) / w) + 'px' : '';
    }
  }

  /* ---------- Carrusel de fotos ---------- */
  function iniciarCarruseles() {
    var reducir = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var carruseles = document.querySelectorAll('[data-carousel]');
    for (var c = 0; c < carruseles.length; c++) (function (car) {
      var track = car.querySelector('.carousel__track');
      var slides = track.children;
      var total = slides.length;
      var dotsBox = car.querySelector('.carousel__dots');
      var dots = [];
      var actual = 0;

      for (var i = 0; i < total; i++) {
        slides[i].setAttribute('role', 'group');
        slides[i].setAttribute('aria-roledescription', 'foto');
        slides[i].setAttribute('aria-label', (i + 1) + ' de ' + total);
        var d = document.createElement('button');
        d.type = 'button';
        d.className = 'carousel__dot';
        d.setAttribute('aria-label', 'Ver foto ' + (i + 1) + ' de ' + total);
        d.addEventListener('click', (function (n) { return function () { ir(n); }; })(i));
        dotsBox.appendChild(d);
        dots.push(d);
      }

      function marcar(n) {
        actual = n;
        for (var k = 0; k < total; k++) {
          if (k === n) dots[k].setAttribute('aria-current', 'true');
          else dots[k].removeAttribute('aria-current');
        }
      }
      function ir(n) {
        n = (n + total) % total;
        track.scrollTo({ left: n * track.clientWidth, behavior: reducir ? 'auto' : 'smooth' });
        marcar(n);
      }

      car.querySelector('[data-prev]').addEventListener('click', function () { ir(actual - 1); });
      car.querySelector('[data-next]').addEventListener('click', function () { ir(actual + 1); });
      track.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowLeft') { e.preventDefault(); ir(actual - 1); }
        else if (e.key === 'ArrowRight') { e.preventDefault(); ir(actual + 1); }
      });
      track.addEventListener('scroll', function () {
        var w = track.clientWidth;
        if (w > 0) marcar(Math.min(total - 1, Math.round(track.scrollLeft / w)));
      });
      window.addEventListener('resize', function () { track.scrollLeft = actual * track.clientWidth; });
      marcar(0);
    })(carruseles[c]);
  }

  /* ---------- Sonidos (generados con Web Audio, sin archivos) ---------- */
  var sonido = { ctx: null, mudo: false };
  try { sonido.mudo = localStorage.getItem('tc-sonido') === 'off'; } catch (e) {}

  function audio() {
    if (sonido.mudo) return null;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    if (!sonido.ctx) sonido.ctx = new AC();
    if (sonido.ctx.state === 'suspended') sonido.ctx.resume();
    return sonido.ctx;
  }

  // Hoja que se rasga: ruido blanco filtrado con un volumen que "cruje"
  function sonidoRasgado(seg) {
    var ctx = audio();
    if (!ctx) return;
    var t0 = ctx.currentTime, n = Math.floor(ctx.sampleRate * seg);
    var buf = ctx.createBuffer(1, n, ctx.sampleRate), d = buf.getChannelData(0);
    for (var i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    var src = ctx.createBufferSource(); src.buffer = buf;
    var bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2600; bp.Q.value = 0.9;
    var hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 900;
    var g = ctx.createGain();
    g.gain.setValueAtTime(0, t0);
    for (var t = 0; t < seg - 0.04; t += 0.018) {
      g.gain.setValueAtTime(0.05 + Math.random() * 0.14, t0 + t);
    }
    g.gain.linearRampToValueAtTime(0, t0 + seg);
    src.connect(bp); bp.connect(hp); hp.connect(g); g.connect(ctx.destination);
    src.start(t0); src.stop(t0 + seg);
  }

  // "Plop": tono corto que cae rápido de agudo a grave
  function sonidoPlop() {
    var ctx = audio();
    if (!ctx) return;
    var t0 = ctx.currentTime;
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(600, t0);
    o.frequency.exponentialRampToValueAtTime(150, t0 + 0.12);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.28, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.14);
    o.connect(g); g.connect(ctx.destination);
    o.start(t0); o.stop(t0 + 0.16);
  }

  /* ---------- Hojas: al tocarlas se cortan en dos (A3 → A4 → … → A7) ---------- */
  var HOJAS = { A3: '297 × 420', A4: '210 × 297', A5: '148 × 210', A6: '105 × 148', A7: '74 × 105' };
  var ORDEN = ['A3', 'A4', 'A5', 'A6', 'A7'];

  function crearHoja(tam, orient) {
    var sig = ORDEN[ORDEN.indexOf(tam) + 1];
    var nodo = document.createElement('div');
    nodo.className = 'sheet-node';
    nodo.setAttribute('data-size', tam);
    nodo.setAttribute('data-orient', orient);
    var mm = HOJAS[tam] + ' mm';
    var label = sig ? 'Cortar hoja ' + tam + ' (' + mm + ') en dos ' + sig : 'Hoja ' + tam + ' (' + mm + '), es el tamaño más chico';
    nodo.innerHTML =
      '<button type="button" class="sheet" aria-label="' + label + '" title="' + tam + ' · ' + mm + '">' +
      '<span class="sheet__lines" aria-hidden="true"><i></i><i></i><i></i><i></i></span>' +
      '<span class="sheet__size" aria-hidden="true">' + tam + '</span>' +
      '<span class="sheet__mm" aria-hidden="true">' + mm + '</span>' +
      '<span class="sheet__cut" aria-hidden="true"></span></button>';
    return nodo;
  }

  function iniciarHojas() {
    var caja = document.querySelector('[data-sheets]');
    if (!caja) return;
    var reducir = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var original = caja.innerHTML;
    var btnReset = document.querySelector('[data-sheets-reset]');
    var btnMudo = document.querySelector('[data-sheets-mute]');
    var vivo = document.querySelector('[data-sheets-live]');
    var ocupado = false;

    function pintarMudo() {
      btnMudo.setAttribute('aria-pressed', sonido.mudo ? 'true' : 'false');
      btnMudo.setAttribute('aria-label', sonido.mudo ? 'Activar sonidos' : 'Silenciar sonidos');
    }

    function cortar(nodo) {
      var tam = nodo.getAttribute('data-size');
      var sig = ORDEN[ORDEN.indexOf(tam) + 1];
      if (!sig) {
        nodo.classList.remove('is-shake');
        void nodo.offsetWidth;
        nodo.classList.add('is-shake');
        vivo.textContent = 'La hoja ' + tam + ' es la más chica, no se corta más.';
        return;
      }
      ocupado = true;
      var demora = reducir ? 0 : 700;
      nodo.classList.add('is-cutting');
      sonidoRasgado(reducir ? 0.35 : 0.7);
      setTimeout(function () {
        var orient = nodo.getAttribute('data-orient');
        var hijaOrient = orient === 'v' ? 'h' : 'v';
        var a = crearHoja(sig, hijaOrient), b = crearHoja(sig, hijaOrient);
        var eje = orient === 'v' ? '--sy' : '--sx';
        a.style.setProperty(eje, '1'); b.style.setProperty(eje, '-1');
        a.classList.add('is-new'); b.classList.add('is-new');
        nodo.classList.remove('is-cutting');
        nodo.classList.add('is-split');
        nodo.innerHTML = '';
        nodo.appendChild(a); nodo.appendChild(b);
        sonidoPlop();
        vivo.textContent = 'Ahora tenés dos hojas ' + sig + ' de ' + HOJAS[sig] + ' mm.';
        btnReset.hidden = false;
        a.querySelector('.sheet').focus({ preventScroll: true });
        ocupado = false;
      }, demora);
    }

    caja.addEventListener('click', function (e) {
      var btn = e.target.closest('.sheet');
      if (!btn || ocupado) return;
      cortar(btn.parentNode);
    });
    btnReset.addEventListener('click', function () {
      caja.innerHTML = original;
      btnReset.hidden = true;
      vivo.textContent = 'Volviste a las hojas A3 y A4.';
      caja.querySelector('.sheet').focus({ preventScroll: true });
    });
    btnMudo.addEventListener('click', function () {
      sonido.mudo = !sonido.mudo;
      try { localStorage.setItem('tc-sonido', sonido.mudo ? 'off' : 'on'); } catch (e) {}
      pintarMudo();
    });
    pintarMudo();
  }

  /* ---------- Tarjetas doble faz (tocar para dar vuelta en celular) ---------- */
  function iniciarTarjetasFlip() {
    var tarjetas = document.querySelectorAll('.flip-card');
    var tactil = window.matchMedia && window.matchMedia('(hover: none)');
    for (var i = 0; i < tarjetas.length; i++) {
      tarjetas[i].addEventListener('click', function (e) {
        var t = e.currentTarget;
        // Con mouse se da vuelta con el hover; el clic solo cuenta en pantallas táctiles o con teclado
        if (tactil && !tactil.matches && e.detail !== 0) return;
        var vuelta = !t.classList.contains('is-flipped');
        t.classList.toggle('is-flipped', vuelta);
        t.setAttribute('aria-pressed', vuelta ? 'true' : 'false');
        t.setAttribute('aria-label', t.getAttribute('aria-label').replace(vuelta ? 'mostrar el dorso' : 'mostrar el frente', vuelta ? 'mostrar el frente' : 'mostrar el dorso'));
      });
    }
  }

  /* ---------- Inicio ---------- */
  function iniciar() {
    iniciarCarruseles();
    iniciarHojas();
    iniciarTarjetasFlip();
    pintarEstado();
    setInterval(pintarEstado, 60000);
    pintarAnio();
    iniciarCalculadora();
    ajustarTextos();
    window.addEventListener('resize', ajustarTextos);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(ajustarTextos);
    var y = document.querySelectorAll('[data-copy-year]');
    for (var i = 0; i < y.length; i++) y[i].textContent = new Date().getFullYear();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();
