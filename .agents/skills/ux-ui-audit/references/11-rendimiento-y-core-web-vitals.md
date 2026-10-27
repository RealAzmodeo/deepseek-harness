# Rendimiento y Core Web Vitals

El rendimiento no es una optimización posterior: es una propiedad de la
experiencia. Una interfaz lenta es una interfaz con fricción, y ninguna cantidad
de buen diseño visual lo compensa.

## 1. Core Web Vitals: los números

Evaluadas al **percentil 75** de las visitas, separadas entre móvil y escritorio.

| Métrica | Bueno | Necesita mejorar | Pobre | Qué responde |
| --- | --- | --- | --- | --- |
| **LCP** (Largest Contentful Paint) | ≤ **2,5 s** | 2,5–4,0 s | > 4,0 s | "¿Cuándo veo lo importante?" |
| **INP** (Interaction to Next Paint) | ≤ **200 ms** | 200–500 ms | > 500 ms | "¿Responde cuando toco?" |
| **CLS** (Cumulative Layout Shift) | ≤ **0,1** | 0,1–0,25 | > 0,25 | "¿Puedo leer sin que se mueva?" |

**INP sustituyó a FID el 12 de marzo de 2024**; FID está retirado del programa.

**Novedad relevante para auditar SPA:** desde Chrome 151 (julio 2026) la línea de
tiempo de rendimiento expone entradas de **soft navigation** y de
`interaction-contentful-paint`, de modo que los cambios de ruta de una aplicación
de una sola página ya se pueden medir como navegaciones. Antes, una SPA podía
tener un LCP excelente en la carga inicial y una navegación interna
desastrosa que ninguna métrica veía.

**Las tres no se compensan.** Un CLS perfecto con un LCP de 6 s sigue siendo una
mala experiencia. Se reportan las tres y se prioriza la que esté en rojo.

### Campo contra laboratorio

| | Campo (CrUX, RUM) | Laboratorio (Lighthouse, WebPageTest) |
| --- | --- | --- |
| Qué mide | Usuarios reales, p75, ventana de 28 días | Una ejecución sintética con limitación simulada |
| Responde a | **¿Hay un problema?** | **¿Por qué?** |
| Limitaciones | CrUX excluye iOS y exige opt-in | **No puede medir INP** (no hay interacción real), no ve CLS posterior a la carga, y la limitación simulada puede sobreestimar |

**Regla de auditoría:** se mira el campo primero y el laboratorio después, como
diagnóstico. Si el laboratorio sale mejor que el campo, sospecha del laboratorio.

**Un informe de rendimiento no se basa en una sola pasada de Lighthouse.** No se
puede concluir el INP, ni el CLS de flujos posteriores a la carga (checkout,
modales, scroll infinito), ni el efecto de terceros que tardan en cargar.

---

## 2. LCP: los cuatro subcomponentes

| Subcomponente | Culpable habitual | Fix |
| --- | --- | --- |
| **TTFB** | Servidor lento, sin caché, sin CDN | Caché, CDN, trabajo de servidor |
| **Resource load delay** | Descubrimiento tardío: lazy mal aplicado, hero inyectado por JS | Referenciar el hero en el HTML; `preload`; **nunca** `loading="lazy"` en el LCP (`Q-01`) |
| **Resource load duration** | Imagen sobredimensionada; competencia con vídeo o JS | `srcset`/`sizes` correctos, formatos modernos, menos recursos que compiten |
| **Element render delay** | CSS/JS que bloquean el render; fuentes; contenido oculto | CSS crítico, `defer`, `font-display`, quitar scripts anti-flicker |

Reparto orientativo: TTFB ≈ 40%, duración de carga ≈ 40%, y el resto entre
retraso de descubrimiento y de render.

**Cuentan como LCP:** `<img>`, imágenes dentro de SVG, el póster de un `<video>`,
elementos con `background-image` por `url()` y bloques de texto de nivel bloque.

**No cuentan:** gradientes CSS, vídeo en reproducción, canvas ni elementos fuera
del viewport.

**Fixes de prioridad:** `fetchpriority="high"` en la imagen del LCP (mejora
progresiva: aún no es Baseline), `<link rel="preload" as="image">` si el
descubrimiento es tardío, `preconnect` a los orígenes críticos.

---

## 3. INP: respuesta a la interacción

Mide desde el clic, toque o tecla hasta el siguiente frame pintado. Hover y
scroll no cuentan. A diferencia de FID, **cubre el ciclo completo** y agrega las
peores interacciones de la página, no la primera.

| Subcomponente | Causa | Fix |
| --- | --- | --- |
| **Input delay** | El hilo principal está ocupado cuando el usuario interactúa | Romper tareas largas; diferir trabajo; menos JS de terceros |
| **Processing time** | Handlers pesados, re-render, DOM enorme, selectores complejos | Event delegation, memoización, virtualización |
| **Presentation delay** | Interacciones encoladas, estilo y layout costosos | Reducir trabajo de render; evitar reflows forzados (`Q-11`) |

**Fixes estructurales:** tareas por debajo de 50 ms, ceder el hilo con
`scheduler.yield()` (Chrome 2024, Firefox desde agosto de 2025; Safari aún no —
usa `setTimeout`/`requestIdleCallback` como respaldo), mover cómputo a un Web
Worker, `content-visibility` en listas largas.

**Y algo que se olvida:** **pinta el feedback inmediato**. INP mide cuándo hay
siguiente *paint*, no cuándo termina el trabajo. Un estado `:active` o un spinner
que aparece en el primer frame mejora la métrica y, sobre todo, la sensación.

---

## 4. CLS: estabilidad visual

`layout shift score = impact fraction × distance fraction`, y la métrica es la
**peor ventana de sesión**: shifts separados por menos de 1 s, con ventana máxima
de 5 s.

Los shifts dentro de los 500 ms posteriores a una interacción (`hadRecentInput`)
se excluyen. Scroll, arrastre y pinza **no** cuentan como interacción reciente.

Mover un elemento con `transform` **no** genera CLS. Tocar `width`, `height`,
`top`, `left` o `margin` **sí**.

| Causa | Fix |
| --- | --- |
| Imágenes e iframes sin dimensiones (`Q-02`) | `width`/`height` explícitos + `aspect-ratio` |
| Fuentes con métricas distintas a la de respaldo (`Q-03`) | `font-display` + `size-adjust` y overrides de métricas |
| Contenido inyectado arriba: banners, cookies, anuncios (`Q-15`) | Reservar espacio con altura fija |
| Animaciones de propiedades de layout (`Q-06`) | Animar solo `transform` y `opacity` |
| Listas largas sin contención (`Q-16`) | `content-visibility: auto` **con** `contain-intrinsic-size` |

⚠️ `content-visibility: auto` **sin** `contain-intrinsic-size` hace que la altura
inicial sea 0 y provoca saltos de scrollbar: el fix sin el complemento es peor
que el problema.

---

## 5. Fuentes web

| `font-display` | Comportamiento | Cuándo |
| --- | --- | --- |
| `swap` | Texto visible de inmediato con la fuente de respaldo; cambia al llegar | Por defecto razonable |
| `optional` | Usa la de respaldo si la web no está en caché | **Cero CLS**; ideal en texto largo |
| `fallback` | Bloqueo mínimo y ventana corta de intercambio | Compromiso |
| `block` | Texto invisible hasta que carga | Solo iconos y display |
| `auto` | Decide el navegador | **Evitar** (`Q-03`) |

`font-display` es Baseline desde enero de 2020.

**CLS de fuentes:** `size-adjust` escala el ancho; `ascent-override`,
`descent-override` y `line-gap-override` igualan las métricas verticales de la
fuente de respaldo local a la fuente web (se calculan desde la tabla OS/2 como
`valor / unitsPerEm`). `size-adjust` es necesario **además**, porque los overrides
no corrigen el ancho de los glifos.

**Otras palancas:** preload con `as="font"` **y `crossorigin`**, subsetting con
`unicode-range` para no descargar alfabetos enteros, woff2 como formato base.
**Variable fonts** reducen el número de ficheros pero pueden pesar más que la
instancia estática que realmente se usa: se mide, no se asume.

---

## 6. Imágenes y medios

- **Formatos:** AVIF primero (widely available desde julio de 2026), WebP como
  respaldo, JPEG/PNG si el pipeline no da más. JPEG XL no es una opción práctica.
- **`sizes` mal escrito anula `srcset`** (`Q-14`). Un `sizes="100vw"` en una
  tarjeta de 320 px hace que se descargue la variante de pantalla completa: es
  peor que no tener `srcset`.
- **Lazy loading:** bajo el pliegue sí; **nunca** en el LCP ni en nada visible en
  la carga inicial (`Q-01`).
- Compresión y dimensiones correctas antes de cualquier otra optimización: un
  `srcset` perfecto con originales de 4000 px sigue desperdiciando bytes.

---

## 7. JavaScript y CSS

**El JavaScript no equivale a una imagen del mismo peso.** Paga descarga + parse
+ compilación + ejecución en el hilo principal, y esa CPU es exactamente la que
produce el *input delay* del INP.

| Palanca | Detalle |
| --- | --- |
| Sin `<script>` sincrónico en `<head>` (`Q-04`) | `defer` o `async`; el bloqueante retrasa el parser y el render |
| División por ruta | Code splitting; no cargar el panel de administración en la landing |
| Tree shaking | Importar la función, no el paquete entero (`Q-18`) |
| Hidratación parcial | Hidratar solo las islas interactivas; hidratar HTML estático es CPU regalada (`Q-17`) |
| Terceros | Inventario, waterfall por dominio y *facade* que carga tras la interacción (`Q-05`) |
| CSS | Purgar, dividir, CSS crítico, `@layer` para la cascada |

**Cuándo NO usar JavaScript:** acordeón con `<details>`, validación nativa de
formularios, scroll snap, `:has()` para estados derivados, `<dialog>` para
modales. Si HTML y CSS resuelven el caso, el JS es deuda.

---

## 8. Rendimiento percibido

| Umbral | Qué se percibe | Qué exige |
| --- | --- | --- |
| **0,1 s** | Reacción instantánea | Base del umbral de INP |
| **1 s** | Se mantiene el foco sin feedback explícito | Base del umbral de LCP |
| **10 s** | Límite de atención antes de abandonar | Progreso y cancelación |

Técnicas: feedback inmediato al input, skeleton con la geometría final, interfaz
optimista **con rollback** (solo en acciones reversibles), y progreso determinista
en operaciones largas.

`Save-Data` es experimental y `prefers-reduced-data` **no lo soporta ningún
navegador** hoy: se usan como mejora hipotética, nunca como única vía de ahorro.

---

## 9. Anti-patrones de rendimiento

| ID | Anti-patrón | Detección | Daño |
| --- | --- | --- | --- |
| Q-01 | `loading="lazy"` en el elemento del LCP | Marcado + posición en el viewport | Retrasa el descubrimiento del recurso más importante |
| Q-02 | Imágenes o iframes sin dimensiones | Marcado y CSS | CLS al cargar |
| Q-03 | `font-display` ausente o `auto` | `@font-face` | Texto invisible (FOIT) y salto al intercambiar |
| Q-04 | `<script>` sincrónico en el `<head>` | Marcado; render-blocking requests | Bloquea parser y render |
| Q-05 | Terceros sin inventario ni control | Waterfall por dominio | CPU y ancho de banda ajenos que retrasan la interacción |
| Q-06 | Animar `width`/`height`/`top`/`left`/`margin` | Transiciones y `@keyframes` | Layout y pintado por frame; CLS |
| Q-07 | Sombras y filtros animados en áreas grandes | CSS | Pintado costoso; caída de FPS |
| Q-08 | Listas o DOM enormes sin virtualizar | Tamaño del DOM | Estilo y layout caros; INP alto |
| Q-09 | `setInterval` decorativo (contadores, polling, carrusel) | Grep de `setInterval` | Tareas largas periódicas |
| Q-10 | CSS sin purgar ni dividir | Coverage | Render blocking innecesario |
| Q-11 | Leer `offsetHeight`/`getBoundingClientRect` en bucle tras escribir estilos | *Forced reflow* en DevTools | Layout síncrono por iteración |
| Q-12 | Listeners de `scroll`/`touchmove`/`wheel` sin `{ passive: true }` | Código | Bloquea el scroll compuesto |
| Q-13 | Handler de `scroll` sin `requestAnimationFrame` ni observador | Código | Trabajo en cada frame |
| Q-14 | `sizes` irreal | Atributos + waterfall | Descarga sobredimensionada |
| Q-15 | Contenido inyectado arriba (banner, cookies, aviso) | Inspección | CLS |
| Q-16 | Listas largas sin `content-visibility` ni contención | CSS | Render inicial evitable |
| Q-17 | Hidratar islas no interactivas | Traza de CPU | CPU en la carga; input delay |
| Q-18 | Importar el paquete completo (iconos, utilidades, fechas) | Bundle analyzer | Peso y parse evitables |
| Q-19 | CSS sin `contain-intrinsic-size` junto a `content-visibility` | CSS | Saltos de scrollbar peores que el problema original |
| Q-20 | Dos frameworks o dos versiones de la misma librería | Bundle analyzer y red | Parse y ejecución duplicados |
| Q-21 | `will-change` permanente en muchos elementos | Grep | Memoria de GPU retenida |
| Q-22 | Sin presupuesto de rendimiento en CI | Proceso | La regresión entra sin que nadie la vea |

---

## 10. Presupuestos de rendimiento

Un presupuesto convierte "debería ir rápido" en algo que se puede romper y por
tanto verificar.

| Qué se presupuesta | Ejemplo |
| --- | --- |
| Métricas de campo | LCP ≤ 2,5 s, INP ≤ 200 ms, CLS ≤ 0,1 en p75 |
| Peso por tipo | JS, CSS, imágenes y fuentes con techo por plantilla |
| Número de peticiones | Terceros incluidos |
| Tamaño del DOM | Nodos máximos por vista |

Se fuerzan en CI con **Lighthouse CI** y su bloque de aserciones (`warn`/`error`),
de modo que una regresión **falla el build**. Un presupuesto que no rompe nada no
es un presupuesto.

---

## 11. Checklist de rendimiento

- [ ] Las tres métricas están medidas en **campo** (p75), no solo en laboratorio.
- [ ] El elemento del LCP está identificado y no lleva `loading="lazy"`.
- [ ] El hero existe en el HTML inicial, no inyectado por JS.
- [ ] Imágenes con `srcset`, `sizes` correcto, dimensiones y `aspect-ratio`.
- [ ] Fuentes con `font-display`, subsetting y overrides de métricas.
- [ ] Ningún `<script>` sincrónico en el `<head>`.
- [ ] Terceros inventariados y diferidos tras la interacción.
- [ ] El trabajo pesado se cede con `scheduler.yield()` o se mueve a un Worker.
- [ ] Nada anima propiedades de layout.
- [ ] Listas largas con virtualización o `content-visibility` +
      `contain-intrinsic-size`.
- [ ] Listeners de scroll y táctiles pasivos y limitados por frame.
- [ ] Sin reflows forzados en bucles.
- [ ] Existe presupuesto y se hace cumplir en CI.
