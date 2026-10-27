# Responsive, adaptativo y mobile-first

## 0. Tres cosas distintas que se confunden

| Enfoque | Qué significa | Cuándo |
| --- | --- | --- |
| **Responsive** | Un solo layout fluido que se adapta de forma continua al espacio disponible | Por defecto, siempre |
| **Adaptativo** | Varios layouts discretos elegidos por puntos de corte (clases de ventana) | Cuando el producto tiene modos realmente distintos (móvil vs. panel de escritorio vs. plegable) |
| **Mobile-first** | **Metodología**: se diseña y se escribe primero para la pantalla pequeña y se amplía | Por defecto, siempre |

No son alternativas. **Mobile-first es cómo se trabaja; responsive es cómo se
comporta; adaptativo es la excepción justificada** cuando hay modos de uso
genuinamente diferentes.

---

## 1. Mobile-first y mejora progresiva

**Mobile-first hoy** no significa "hacer una app móvil". Significa:

1. **Decidir primero con la restricción más dura.** Espacio, atención, ancho de
   banda, precisión del dedo y contexto de uso. Lo que sobrevive a esa
   restricción es lo esencial; lo demás se añade cuando hay espacio.
2. **Escribir con `min-width`.** El CSS base es el del móvil; las media queries
   **añaden** capacidad.

```css
/* Mobile-first: la base es la pantalla pequeña. */
.grid { display: grid; gap: var(--space-stack-md); grid-template-columns: 1fr; }

@media (min-width: 48rem) {
  .grid { grid-template-columns: repeat(2, 1fr); }
}

@media (min-width: 64rem) {
  .grid { grid-template-columns: repeat(3, 1fr); }
}
```

```css
/* Desktop-first: deuda. Cada regla nueva tiene que deshacerse hacia abajo. */
.grid { display: grid; grid-template-columns: repeat(3, 1fr); }
@media (max-width: 63.99rem) { .grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 47.99rem) { .grid { grid-template-columns: 1fr; } }
```

Por qué `max-width` es deuda (`P-03`): el móvil no hereda un layout simple, sino
uno complejo con parches. Cada componente nuevo se escribe pensando en escritorio
y hay que "arreglarlo" hacia abajo, lo que garantiza que el caso peor (el
dispositivo más usado) sea el peor probado.

3. **Progressive enhancement.** El orden de dependencia es HTML → CSS → JS, y
   cada capa debe aportar valor sin las siguientes. Las capacidades opcionales
   (`@container`, `:has()`, `backdrop-filter`, `dvh`, `View Transitions`) se
   detectan con `@supports` y **degradan**, no se asumen.

| Se comprueba desactivando | El resultado debe ser |
| --- | --- |
| JavaScript | La página carga y la tarea principal es posible |
| CSS | El orden de lectura sigue teniendo sentido |
| `backdrop-filter` | Superficie sólida, misma jerarquía |
| `@container` | Una columna razonable |
| Red | Estado de error explícito con reintento |

---

## 2. Breakpoints: por contenido, no por catálogo

**La regla:** se añade un breakpoint **cuando el layout se rompe**, no cuando lo
dice un framework. Se detecta estrechando la ventana poco a poco: el punto donde
algo deja de leerse o de funcionar *es* el breakpoint.

**Cómo se documentan:** cada breakpoint se nombra por su intención, no por su
valor.

```css
/* Los puntos de corte son consecuencias, no decisiones. */
--bp-content-narrow: 30rem;  /* el texto deja de tener medida legible */
--bp-content-wide: 48rem;    /* caben dos columnas de contenido */
--bp-nav-collapse: 60rem;    /* la navegación deja de caber en una línea */
--bp-workspace: 80rem;       /* aparece el panel lateral persistente */
```

**Errores típicos:**

- Copiar 375 / 768 / 1024 de un framework (`P-02`): corresponden a dispositivos
  de hace una década, no al contenido.
- Breakpoints en `px` sobre tipografía: rompen el zoom del usuario.
- Media queries anidadas o repetidas (`P-14`): cada componente redeclara los
  mismos cortes, y cuando cambia uno, cambia en treinta sitios.
- Confundir "breakpoint" con "dispositivo": los plegables, las ventanas
  redimensionadas y los modos divididos no caben en ninguna lista.

**Relación con las guías de plataforma:** Material 3 define clases de ventana
(compact < 600, medium 600–839, expanded 840–1199, large 1200–1599,
extra-large ≥ 1600 dp) y Apple usa *size classes*. Alinearse con ellas es
razonable **si el producto vive en esa plataforma**; importarlas a la web sin
criterio reintroduce el problema del catálogo.

Las dos guías coinciden en algo que se cita mal a menudo: **las clases de ventana
se calculan sobre el espacio disponible, no sobre el tipo de dispositivo**. Apple
lo dice literalmente —*"determine layout based on size classes, not device type or
orientation"*— y Android advierte que no sirven para lógica del tipo
"¿es una tablet?". Un diseño que pregunta "¿es móvil?" ya está mal planteado
(`P-21`).

---

## 3. Container queries: el cambio de paradigma

Una **media query** pregunta por el viewport. Una **container query** pregunta por
el espacio que el componente realmente tiene. Un componente reutilizable debe
adaptarse a **su contenedor**, no al tamaño de la ventana: es lo que hace que
funcione igual en la barra lateral y en la página completa.

```css
.card-host { container-type: inline-size; container-name: card; }

.card { display: grid; gap: var(--space-stack-sm); grid-template-columns: 1fr; }

@container card (min-width: 28rem) {
  .card { grid-template-columns: 8rem 1fr; align-items: start; }
}
```

| Pregunta a responder | Herramienta |
| --- | --- |
| ¿Cambia el layout **global** de la página? | Media query |
| ¿Cambia **este componente** según el espacio que le dan? | **Container query** |
| ¿Cambia según las capacidades del dispositivo? | Media query de capacidad (`hover`, `pointer`, `prefers-*`) |
| ¿Cambia según el contenido? | `:has()`, `auto-fit`, `minmax()` |

La recomendación de web.dev es **combinarlas**: media queries para los estilos
macro y globales, container queries para los micro y los hijos del contenedor.

`:has()` permite adaptar un contenedor según su contenido (por ejemplo, un campo
con error dentro de un grupo), y las *container query units* (`cqw`, `cqh`,
`cqi`) dan fluidez relativa al contenedor.

**Soporte verificado** (dataset `web-features`, estado a 2026):

| Característica | Baseline desde | Chrome | Safari | Firefox |
| --- | --- | --- | --- | --- |
| Container queries (`container-type`, `@container`, unidades `cq*`) | 14 feb 2023 | 105 | 16 | 110 |
| `:has()` | 19 dic 2023 | 105 | 15.4 | 121 |

Ambas están hoy en **Baseline ampliamente disponible**, así que no necesitan
polyfill: lo que sí necesitan es una **forma degradada por defecto**. El
componente se escribe primero para el contenedor estrecho y la container query
**añade**; si la query no se aplica, queda la versión de una columna. Nunca al
revés.

---

## 4. Unidades y fluidez

| Unidad | Uso correcto |
| --- | --- |
| `rem` | Tipografía, espaciado y todo lo que debe escalar con la preferencia del usuario |
| `em` | Tamaños relativos **al propio** elemento (padding de un botón respecto a su texto) |
| `ch` | Medida de lectura (`max-width: 68ch`) |
| `%` | Anchuras relativas al contenedor |
| `px` | Solo bordes de 1px y detalles ópticos que no deben escalar |
| `vw`/`vh` | Con cuidado; `100vw` incluye la barra de scroll |
| `svh`/`lvh`/`dvh` | Alto real del viewport: `dvh` es el que acompaña a la barra dinámica del navegador |
| `cqw`/`cqi` | Fluidez relativa al contenedor |

**`100vh` está roto en móvil** (`P-04`): en el navegador móvil mide el viewport
con las barras retraídas, así que el contenido queda recortado o genera salto. Se
usa `100dvh` (dinámico) o `100svh` (mínimo garantizado).

**Tipografía fluida:**

```css
--text-display: clamp(1.875rem, 1.4rem + 2.4vw, 3rem);
```

**Regla de la práctica, no de WCAG:** en tipografía fluida se recomienda que el
máximo sea al menos el doble del mínimo **en unidades relativas**, porque un
`clamp()` con máximo en `px` fijo se queda corto al ampliar. Es una convención de
diseño fluido, **no un criterio de conformidad**: lo que WCAG 1.4.4 exige es que
el texto se pueda ampliar al **200%** sin pérdida de contenido ni funcionalidad.
No la cites como si fuera WCAG.

**Y un fallo que sí está tipificado:** usar `vw` en `font-size` sin `clamp()` es
la técnica de fallo **F94** de 1.4.4. El texto que solo escala con el viewport
deja de responder al zoom del usuario.

**Los dos que siempre se olvidan:**

- **`min-width: 0` / `min-height: 0`** en hijos de flex y grid. Sin ellos, un hijo
  se niega a encogerse por debajo de su contenido y el layout desborda (`D-11`).
- **`aspect-ratio`** junto a `width`/`height` para reservar espacio y evitar CLS.

---

## 5. Imágenes y medios responsivos

```html
<img
  src="foto-800.jpg"
  srcset="foto-400.jpg 400w, foto-800.jpg 800w, foto-1600.jpg 1600w"
  sizes="(min-width: 64rem) 33vw, (min-width: 48rem) 50vw, 100vw"
  width="800" height="600"
  loading="lazy" decoding="async" alt="Descripción útil">
```

| Regla | Detalle |
| --- | --- |
| `srcset` + `sizes` | El navegador elige. **Con `sizes` mal escrito, `srcset` no sirve de nada** (`Q-14`) |
| `width` y `height` explícitos | Reservan el espacio y evitan CLS (`Q-02`). El CSS puede sobreescribirlos |
| `loading="lazy"` | Para lo que está bajo el pliegue. **Nunca en la imagen del LCP** (`Q-01`) |
| `fetchpriority="high"` | En el recurso que es el LCP |
| `decoding="async"` | No bloquea el render |
| `<picture>` | Solo para *art direction* real (recorte distinto por tamaño), no para servir formatos |
| Formatos | AVIF y WebP con `<source type>` y *fallback* al formato clásico |
| Vídeo | `poster`, `preload="metadata"`, `playsinline`, y subtítulos |

---

## 6. Plataforma móvil: lo que rompe siempre

### Viewport

```html
<meta name="viewport" content="width=device-width, initial-scale=1">
```

`user-scalable=no` o `maximum-scale` menor que 2 (`P-01`) **impiden ampliar** y son
un fallo de accesibilidad directo: la regla ACT **b4f0c3** ("Meta viewport allows
for zoom") los evalúa contra WCAG 1.4.4 y marca como fallido cualquier
`maximum-scale` por debajo de 2.

Se añaden por miedo a un zoom que casi siempre provoca un control con
`font-size` menor de 16px (`P-11`) — y eso se arregla en el control, no en el
meta.

### Áreas seguras

```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
```

```css
.app-bar { padding-inline: max(var(--space-inline-lg), env(safe-area-inset-left)); }
```

Sin esto, el contenido queda bajo el *notch*, la isla o la barra de gestos
(`P-12`).

### Teclado virtual y campos

| Atributo | Para qué |
| --- | --- |
| `inputmode` | Teclado adecuado sin cambiar la validación (`numeric`, `email`, `tel`, `decimal`, `search`) |
| `autocomplete` | Autocompletado real de nombre, dirección, tarjeta y credenciales |
| `enterkeyhint` | Etiqueta de la tecla de acción (`next`, `send`, `search`, `done`) |
| `autocapitalize="none"` | Correos, usuarios y códigos |
| `type="tel"` + `inputmode` | Teléfonos; nunca `type="number"` para un teléfono |

**Y un `position: fixed` de pie de página salta o queda tapado cuando aparece el
teclado** (`P-10`): lo que dependa del viewport debe anclarse al contenedor de
scroll.

### Táctil, puntero y preferencias

```css
/* El estado hover existe solo donde hay puntero real. */
@media (hover: hover) and (pointer: fine) {
  .btn:hover { background: var(--button-bg-hover); }
}

@media (pointer: coarse) {
  .btn { min-height: var(--space-12); } /* 48px en táctil */
}
```

| Media query | Qué resuelve | Soporte |
| --- | --- | --- |
| `(hover: hover)` / `(hover: none)` | No dejar estados "pegados" en táctil (`P-07`, `P-08`) | Amplio |
| `(pointer: coarse)` / `(pointer: fine)` | Ampliar objetivos donde el dedo es el puntero | Amplio |
| `(any-pointer)` | Dispositivos híbridos con ratón y táctil | Amplio |
| `prefers-reduced-motion` | Desactivar movimiento no esencial | Baseline ampliamente disponible desde jul 2022 |
| `prefers-contrast: more` | Subir contraste | Baseline desde may 2022 |
| `prefers-color-scheme` | Tema claro/oscuro | Amplio |
| `prefers-reduced-transparency` | Degradar glass a superficie sólida | **Experimental, sin Baseline**: úsalo como mejora, nunca como requisito |
| `prefers-reduced-data` | Servir menos peso | **Ningún navegador lo soporta hoy** (MDN). La vía real es el encabezado `Save-Data`, también experimental |

**Otras reglas táctiles:** `touch-action: manipulation` (elimina el doble-toque
para ampliar y con él cualquier retardo de toque), `-webkit-tap-highlight-color`
para que el resaltado del sistema no rompa el diseño, `overscroll-behavior: contain`
para cortar el *scroll* encadenado, y `-webkit-text-size-adjust: 100%` para que el
navegador no reescale el texto por su cuenta.

El clásico "retardo de 300ms" ya no es un problema real en navegadores modernos
cuando el viewport está bien declarado; si aparece, la causa suele ser un
`touchstart` mal gestionado, no la plataforma.

**Orientación:** bloquear el giro (`P-13`) es un antipatrón. Un layout que solo
funciona en vertical no funciona.

**Escalado de texto del sistema:** el usuario puede subir el tamaño de fuente del
sistema (dynamic type). Todo contenedor con altura fija sobre texto (`P-18`) se
recorta. Se usa `min-height` y se deja crecer.

---

## 7. Patrones adaptativos

### Navegación

**El matiz de 2025, que cambia el argumento pero no la conclusión.** NN/g
comprobó en 2025 que **el icono de tres líneas ya se reconoce** como menú, sobre
todo en la esquina superior izquierda y en su forma estándar. Lo que **no** cambió
es el coste de esconder la navegación: los estudios de 2015–2016 —menos
engagement con el contenido oculto, menor tasa de éxito, más tiempo de tarea y
menor satisfacción— no se repitieron. El problema nunca fue el icono; es **esconder
toda la navegación primaria**. (Y un detalle práctico: los iconos de lista o de
filtro colocados arriba a la izquierda se confunden con un menú.)

| Ancho | Patrón |
| --- | --- |
| Compacto | Barra inferior o cabecera con acción principal + menú, **con etiquetas** |
| Medio | Cabecera con navegación primaria visible y lo secundario colapsado |
| Expandido | Navegación completa visible; el menú colapsado desaparece |
| Amplio | Navegación lateral persistente + panel de contenido |

**Regla:** lo que se colapsa es lo **secundario**. Expón 4–5 opciones de primer
nivel, da al menú más presencia visual que al logotipo y mantenlo pegajoso.

### Tablas de datos

| Patrón | Cuándo | Coste |
| --- | --- | --- |
| Scroll horizontal contenido | Pocas columnas y comparación necesaria | El usuario puede no descubrir que hay más |
| Priorización de columnas | Muchas columnas con jerarquía clara | Hay que decidir qué se sacrifica |
| Fila → tarjeta | Registros con pocos campos y lectura individual | Se pierde la comparación |
| Columna congelada | Identificador + muchas métricas | Complejidad de implementación |
| Vista alternativa (resumen + detalle) | Datos muy densos | Duplica la superficie |

Lo que **no** es una estrategia: dejar la tabla igual y esperar que el usuario
haga zoom (`P-06`).

**La excepción de WCAG, bien aplicada:** 1.4.10 exime del reflow al contenido que
requiere layout bidimensional — es decir, **a la tabla de datos en sí**. La
excepción **no se extiende** a la cabecera de la página, al buscador, a los
filtros ni a la paginación que la rodean: todo eso debe reflowar a 320px. Una
excepción mal leída convierte una tabla en una página entera con scroll
bidimensional, y eso sí es un fallo.

### Formularios y overlays

- Una columna, con `<fieldset>`/`<legend>` para agrupar.
- Campos a ancho completo en pantalla pequeña; el ancho del campo comunica la
  longitud esperada del dato.
- Modales: diálogo centrado en pantalla grande, hoja inferior o pantalla completa
  en pequeña, **según la tarea**. Una hoja inferior para un formulario largo es
  un antipatrón (`N-14`).
- Nada de *scroll* dentro de *scroll*.

---

## 8. Matriz de pruebas

| Se prueba | Cómo | Qué se busca |
| --- | --- | --- |
| Anchos | 320 (reflow WCAG), 360/375/390/414 (móvil real), 600/840/1200/1600 (cortes de clases de ventana), 1280 y 1920 | Reflow (SC 1.4.10), desbordes, texto cortado |
| Zoom | 200% y 400% (zoom de página, no solo de texto) | SC 1.4.4; la regla ACT **b4f0c3** cubre el caso del meta viewport |
| Orientación | Vertical y horizontal | Layouts que solo funcionan en una |
| Puntero | Ratón, táctil, lápiz, híbrido | Estados hover pegados, targets pequeños |
| Teclado virtual | En dispositivo real, en pantalla pequeña | Elementos tapados, saltos de layout |
| Safe areas | Dispositivo con notch/isla | Contenido bajo el sistema |
| Preferencias | `prefers-reduced-motion`, `prefers-contrast`, `prefers-color-scheme` | Degradación correcta |
| Sin JS / sin CSS | Desactivados | Mejora progresiva |
| Red lenta / sin red | Limitación de red | Estados de carga y error |

**Lo que la emulación NO detecta:** rendimiento táctil real, comportamiento del
teclado virtual, safe areas, gestos del sistema, *scroll* con inercia,
`prefers-*` del dispositivo, ni las fuentes y el escalado de texto del sistema.
Una revisión que solo usa el emulador de un navegador de escritorio no ha probado
el móvil (`P-22`).

---

## 9. Checklist responsive

- [ ] El CSS base es el de pantalla pequeña; los cortes usan `min-width`.
- [ ] Los breakpoints están justificados por el contenido y documentados.
- [ ] Los componentes reutilizables usan container queries.
- [ ] Ninguna media query duplicada entre componentes.
- [ ] Cero `100vh`; `dvh`/`svh` donde haga falta.
- [ ] Cero `100vw` para anchuras.
- [ ] `min-width: 0` en los hijos de flex/grid que deben encogerse.
- [ ] `clamp()` con mínimo y máximo en `rem`, y sin `vw` suelto en `font-size`.
- [ ] Imágenes con `srcset`, `sizes` correcto y dimensiones explícitas.
- [ ] Ningún `loading="lazy"` en el elemento del LCP.
- [ ] Viewport sin `user-scalable=no`; `viewport-fit=cover` con `env()`.
- [ ] Controles con `font-size` ≥ 16px; `inputmode`/`autocomplete`/`enterkeyhint`.
- [ ] `:hover` envuelto en `@media (hover: hover)`.
- [ ] Objetivos ampliados con `(pointer: coarse)`.
- [ ] Preferencias del sistema respetadas.
- [ ] Nada esencial oculto con `display: none` en móvil.
- [ ] Tablas con una estrategia responsive explícita.
- [ ] Probado a 320px, con zoom 200%, en ambas orientaciones y en dispositivo
      real.
