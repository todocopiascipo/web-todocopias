# Web TODOCOPIAS

Sitio web de **TODOCOPIAS**, centro de impresión y copiado en Cipolletti, Río Negro.
Sitio estático: HTML, CSS y JavaScript, sin base de datos ni instalación.

## Páginas

| Archivo | Contenido |
| --- | --- |
| `index.html` | Inicio: portada, formas de imprimir, productos, papeles, preguntas frecuentes, horarios y mapa |
| `agendas.html` | Agendas y libretas personalizadas |
| `stickers.html` | Stickers de papel y de vinilo, con calculadora |
| `impresiones.html`, `anillados.html`, `plastificados.html`, `tarjetas.html`, `banners.html`, `carteles-foam.html`, `carteles-nfc-qr.html`, `vinilos.html`, `cartel-auto.html`, `diseno.html` | Una página por producto de "Qué hacemos" (anillados incluye la tabla de anillos) |

## Estructura

```
css/styles.css   estilos (colores y tipografía de la marca)
js/main.js       horario abierto/cerrado, año de la agenda, calculadora de vinilo
img/             logos, ícono de WhatsApp y favicon
robots.txt       para buscadores (cambiar el dominio antes de publicar)
sitemap.xml      para buscadores (cambiar el dominio antes de publicar)
```

## Ver la web en la PC

Doble clic en `index.html`. Después de cada cambio, `Ctrl + F5` en el navegador.

## Configuración rápida

Al principio de `js/main.js`:

- Días y horarios de atención.
- Mes desde el que la agenda muestra el año siguiente.
- Calculadora de vinilo: ancho del rollo, largo mínimo, paso de medio metro, margen y separación.

## Pendientes

- Fotos reales: buscar `FOTO:` en los `.html`.
- Cantidad de stickers de papel de 3 cm: buscar `COMPLETAR` en `stickers.html`.
- Dominio real en `robots.txt` y `sitemap.xml`.

## Trabajar desde distintas PC

1. Instalar **GitHub Desktop** e iniciar sesión con la cuenta `todocopiascipo`.
2. *File → Clone repository* → `web-todocopias`.
3. Antes de empezar a trabajar: **Fetch / Pull** (trae los últimos cambios).
4. Al terminar: escribir qué cambiaste → **Commit to main** → **Push origin**.

Así cada PC tiene siempre la última versión y queda el historial de todos los cambios.
