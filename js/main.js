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

  /* ---------- Inicio ---------- */
  function iniciar() {
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
