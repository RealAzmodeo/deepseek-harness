# Material Design 3 y M3 Expressive — reglas actualizadas

**Versión auditada: Material 3 (2021) y Material 3 Expressive (2025).** Material
2 está obsoleto para producto nuevo; mezclar M2 y M3 en el mismo producto es un
hallazgo, no un detalle.

## 1. Línea de versiones

| Versión | Fecha | Qué cambió de verdad | Qué quedó obsoleto |
| --- | --- | --- | --- |
| **MD1** | 25 jun 2014 (Google I/O) | Metáfora de papel: elevación por sombra, color plano audaz, rejilla de 8dp, FAB como acción primaria | La sombra como semántica de jerarquía; el acento único |
| **MD2** | Refresco de 2018 (nunca se llamó oficialmente "Material Design 2": es etiqueta retroactiva) | Material Theming (color/tipografía/forma), más blanco, `colorPrimary` como fuente única de tema | La escala tipográfica M2, los radios fijos, los theme overlays |
| **M3 / Material You** | Anunciado 18 may 2021; estable con Android 12 el 4 oct 2021 | HCT, paletas tonales, *dynamic color* (monet), roles semánticos con pares `on-*`, 15 roles tipográficos, *surface tint*, *state layers* como tokens, escala de forma | La elevación por sombra → tinte tonal; las curvas M2 renombradas literalmente `easing-legacy-*` |
| **M3 Expressive** | Anunciado may 2025; estable en Pixel con Android 16 QPR1 (sep 2025) | *Motion physics* con muelles, tipografía *Emphasized*, *shape morphing*, componentes nuevos (button groups, FAB menu, split button, loading indicator, toolbars flexibles) | La duración+easing como único sistema de movimiento; la escala de forma como único repertorio de forma |

---

## 2. Color

- **HCT** = hue, chroma, tone, derivado de CAM16 × L\*. El *tone* es L\* 0–100.
  Cada paleta tonal fija H y C y recorre el tone.
- **Cinco paletas núcleo:** primary, secondary, tertiary, neutral, neutral-variant,
  más error.
- **Roles semánticos:** `primary`, `on-primary`, `primary-container`,
  `on-primary-container`, `secondary*`, `tertiary*`, `error*`, `surface`,
  `surface-dim/bright`, `surface-container-lowest/low/high/highest`,
  `surface-variant`, `surface-tint`, `inverse-surface/on-surface/primary`,
  `outline`, `outline-variant`, `scrim`, `shadow`, y los `*-fixed` /
  `*-fixed-dim` / `on-*-fixed-variant` para pares estables entre temas.
- **Dynamic color (monet):** el sistema operativo cuantiza el fondo de pantalla y
  genera las paletas. Es implementación del SO, no código de aplicación.
- **Por qué existe `on-*`:** el generador elige los tones del par
  (contenedor / `on-`) **para garantizar contraste**. Cruzar roles —
  `on-surface` sobre `primary-container` — rompe esa garantía: nadie verificó ese
  par. Es el anti-patrón `N-05`.
- **Riesgo real del dynamic color:** aun con el generador, sobrescribir un `on-*`
  con un hex crudo o ignorar los roles puede producir pares por debajo de AA. La
  garantía es de la **generación**, no del uso posterior.

### Nombres de token en CSS

| Nivel | Nombre canónico del spec | Custom property real en `@material/web` |
| --- | --- | --- |
| Referencia | `md.ref.palette.primary40` | **No expuesto** |
| Sistema | `md.sys.color.primary` | `--md-sys-color-primary` |
| Componente | `md.comp.filled-button.container.color` | `--md-filled-button-container-color` |

Dos trampas verificadas: los tokens de componente en CSS **no** llevan el prefijo
`comp`, y Material Web Components **no** expone `--md-ref-palette` ni
`--md-sys-motion`. Cuando el proyecto use Material, el nombre válido es el del
token emitido, no el del spec.

---

## 3. Tipografía

**5 roles × 3 tamaños = 15 roles.** Ejemplos: `display-large` 57/64,
`headline-large` 32/40, `title-large` 22/28, `body-large` 16/24, `label-small`
11/16. `display`, `headline` y `title-large` usan la tipografía *Brand*; `body` y
`label` usan *Plain*.

M3 Expressive añade una variante **Emphasized** por cada uno de los 15 roles
(peso mayor, tracking más cerrado).

**Anti-patrón `N-09`:** usar `display-*` para cuerpo o `label-*` para títulos.
Rompe la legibilidad y la altura de línea.

---

## 4. Elevación: la diferencia que más se ignora

Niveles 0–5, con valores en dp 0 / 1 / 3 / 6 / 8 / 12.

| | Material 2 | Material 3 |
| --- | --- | --- |
| Cómo se eleva | **Sombra proyectada** | **Tinte tonal**: la superficie se tiñe con `surface-tint` según el nivel |
| Consecuencia | El color de superficie es constante | El color de superficie **cambia** con la elevación |

Poner una `box-shadow` de M2 sobre una superficie plana de M3 **mezcla dos
sistemas de profundidad** (`N-02`). En implementaciones recientes el énfasis se
movió además a los roles `surface-container-*`, que es la forma recomendada de
expresar elevación en CSS.

**Elevation inflation (`N-03`):** elevar todo "para que destaque" es lo mismo que
no elevar nada. Solo flota lo que flota de verdad: menús, diálogos, popovers y la
barra de navegación cuando se despega del contenido.

---

## 5. Forma

Escala verificada en los tokens generados: `none 0`, `xs 4`, `s 8`, `m 12`,
`l 16`, `xl 28`, `full 9999` px.

⚠️ La documentación de theming de Material Web declara `corner-medium: 6px`
mientras los tokens emitidos dicen **12px**. Cuando el proyecto usa Material
manda el **token emitido**.

**Shape morphing (M3 Expressive):** no es "más radio": es interpolación de
contornos entre formas (`MaterialShapes` expone unas 35 formas y `Morph` interpola
con un progreso animable).

---

## 6. Movimiento: dos sistemas en paralelo

### a) Duración + easing (16 duraciones)

`short1–4` 50–200ms · `medium1–4` 250–400ms · `long1–4` 450–600ms ·
`extra-long1–4` 700–1000ms.

Easings: `emphasized`, `emphasized-accelerate/decelerate`, `standard*`, `linear`
y — prueba dura del reemplazo — **`easing-legacy*`**, que son exactamente las
curvas de M2 (`cubic-bezier(0.4, 0, 0.2, 1)`). Usarlas en M3 es mezclar sistemas.

### b) Motion physics (M3 Expressive)

Muelles con amortiguación y rigidez, en dos familias:

| Familia | Uso | Amortiguación |
| --- | --- | --- |
| **spatial** | Límites y geometría | default 0,8 / rigidez 380; fast 0,6 / 800; slow 0,8 / 200 |
| **effects** | Color y opacidad | **siempre 1,0** (crítico), rigidez 1600 / 3800 / 800 |

**Regla:** un muelle de *effects* aplicado a geometría produce rebote donde no
corresponde; un muelle *spatial* aplicado a color se siente blando. No se
intercambian.

---

## 7. Estados: *state layers*

La capa de estado es una capa translúcida del **color de contenido del propio
componente**, no un color nuevo:

| Estado | Opacidad |
| --- | --- |
| Hover | 8% |
| Focus | 10% |
| Pressed | 10% |
| Dragged | 16% |

⚠️ **Divergencia verificada:** los tokens generados de Material Web (v0.192)
emiten **0,12** para focus y pressed. **Mide el valor efectivo del proyecto, no lo
asumas.**

Cambiar `background-color` en `:hover` (`N-07`) hardcodea color, rompe el modo
oscuro y rompe el contraste: la capa de estado existe precisamente para que el
estado se derive del rol.

---

## 8. Layout

| Ancho | Rango |
| --- | --- |
| compact | < 600 dp |
| medium | 600–839 |
| expanded | 840–1199 |
| large | 1200–1599 |
| extra-large | ≥ 1600 |

Alto: compact < 480, medium 480–899, expanded ≥ 900.

Ojo: `WindowSizeClass` de Compose solo emite Compact/Medium/Expanded (600/840)
por defecto; large y extra-large exigen configuración adicional.

**Canonical layouts:** list-detail, supporting pane, feed. Paneles adaptativos
(fixed / flexible).

---

## 9. Accesibilidad en Material

| Requisito | Valor |
| --- | --- |
| Contraste de texto | 4.5:1 normal, 3:1 grande (mismos umbrales que WCAG) |
| Contraste no textual | 3:1 |
| Target táctil Material | **48×48 dp** (`LocalMinimumInteractiveComponentSize`) |
| Mínimo legal AA | **24×24 CSS px** (WCAG 2.2 SC 2.5.8) |
| Foco | Visible (SC 2.4.7) y no oculto (SC 2.4.11, nuevo en 2.2) |
| Movimiento | `prefers-reduced-motion` debe desactivar lo no esencial — crítico con motion physics |
| Escalado de texto | 200% sin pérdida (SC 1.4.4) |

---

## 10. M3 Expressive: cuándo NO aplicarlo

**Riesgo principal:** productos densos. La expresividad consume altura de fila,
radio, escala tipográfica y tiempo de animación. Cada muelle y cada forma mórfica
cuesta milisegundos de reconocimiento y densidad.

**No aplicar en:** IDE y editores, CAD, herramientas profesionales, paneles de
datos, tablas financieras, consolas de operaciones.

**Regla:**

| Contexto | Configuración |
| --- | --- |
| Producto denso | M3 base, motion `standard()`, escala de forma reducida, densidad compacta |
| Consumo, onboarding, *hero moments* | M3 Expressive completo |
| Producto mixto | M3 base + Expressive acotado a los momentos de celebración, nunca en la ruta crítica |

Un panel de datos que adopta M3E sin recomponer densidad pierde filas visibles y
hace esperar animaciones decorativas. Es el anti-patrón `N-10`.

---

## 11. Anti-patrones Material (resumen operativo)

| ID | Patrón | Detección |
| --- | --- | --- |
| N-01 | Primitivos (`ref.palette`) en vez de roles (`sys.color`) | Grep de `ref.palette` o de hex en componentes |
| N-02 | Sombra M2 sobre superficie M3 | `box-shadow` fija junto a `--md-sys-color-surface` |
| N-03 | Elevation inflation | Contar niveles usados: si hay más de tres, sobra |
| N-04 | FAB destructivo o múltiple | FAB con delete/logout, o dos FAB en pantalla |
| N-05 | `on-surface` sobre `primary-container` | Cruce de roles de texto y contenedor |
| N-06 | Target < 48dp | Medir el hitbox |
| N-07 | `:hover { background: … }` en vez de state layer | Grep de `:hover` con color propio |
| N-08 | Dynamic color con colores fijos | Hex junto a un esquema dinámico |
| N-09 | Tipografía `display-*` para cuerpo | Inspeccionar el mapeo de roles |
| N-10 | M3E en producto denso sin adaptar densidad | Filas > 56dp en tablas o herramientas |
| N-11 | Densidad no adaptada | Tokens táctiles en interfaz de escritorio |
| N-12 | Iconos y patrones de otra plataforma | Inspección |
| N-13 | Snackbar con acción destructiva | Inspección |
| N-14 | Bottom sheet para tareas largas | Inspección |
