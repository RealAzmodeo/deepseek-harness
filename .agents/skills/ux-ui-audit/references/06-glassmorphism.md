# Glassmorphism y Liquid Glass — reglas y límites

Glass es una **superficie de apoyo**, nunca una superficie de lectura. Toda
auditoría de glass empieza por una pregunta: **¿qué problema resuelve aquí?** Si
la respuesta es "se ve moderno", es decoración y se retira.

## 1. Qué es (mecanismo, no estilo)

Superficie **translúcida** (alpha < 1) sobre contenido que sigue siendo
perceptible, con **blur del backdrop**, **borde claro de 1px**, **sombra suave**
y, en la práctica, un `saturate()` que compensa la pérdida de croma del
desenfoque.

El mecanismo normativo (Filter Effects L2): el navegador copia la *Backdrop Root
Image*, aplica los filtros, **recorta a la border box incluyendo el
`border-radius`** y aplica el `blur()` con `edgeMode="mirror"` en ese borde. De
ahí los artefactos de canto que el borde de 1px tapa.

El efecto **no se ve** si el elemento no es semitransparente.

### Historia y parientes

| Hito | Fecha |
| --- | --- |
| Windows Vista **Aero** (marcos de cristal borroso) | 2007 |
| iOS 7, *frosted glass* | 2013 |
| Término *glassmorphism* acuñado por Michał Malewicz | 2020 |
| Popularización: macOS Big Sur, Windows 11 Mica/Acrylic | 2020–2021 |
| `backdrop-filter` pasa a **Baseline** (Firefox 103 cierra el hueco) | sept 2024 |
| Apple **Liquid Glass** (iOS 26 / macOS 26) | 9 jun 2025 |

**Parientes que no son lo mismo:**

- **Acrylic / Mica / Smoke** son *materials* de Fluent: Acrylic replica vidrio
  esmerilado y Microsoft lo restringe a **superficies transitorias
  light-dismiss**; **Mica es opaco** (se tiñe con el escritorio); Smoke solo
  atenúa bajo modales.
- **Neumorphism** es lo contrario: mismo color de superficie con doble sombra,
  sin translucidez ni blur. Confunde por falso relieve, no por transparencia.
- **Frosted glass** nombra el efecto, no un estilo.

### Dónde SÍ y dónde NO

| Sí | No |
| --- | --- |
| Barras flotantes o sticky sobre contenido scrolleable | Superficies de lectura larga |
| Overlays modales y menús contextuales (transitorios) | Tablas y datos densos |
| HUDs y controles sobre media | Formularios (etiquetas y errores) |
| Navegación corta sobre contenido | La **capa de contenido** |

Apple es explícita en sus HIG: *"Don't use Liquid Glass in the content layer"*,
*"use sparingly"*, y el vidrio **clear** solo sobre fondos ricos con una capa de
oscurecimiento del 35%.

---

## 2. Implementación CSS correcta

```css
.glass {
  background: var(--glass-bg);                 /* translúcido, no 0.5 */
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
  backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
  border: 1px solid var(--glass-border);       /* tapa el bleeding del blur */
  box-shadow:
    inset 0 1px 0 var(--glass-border),         /* brillo de canto */
    var(--elevation-2);                        /* separación real */
}

@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
  .glass { background: var(--glass-fallback-bg); }
}

@media (prefers-reduced-transparency: reduce),
       (prefers-contrast: more),
       (forced-colors: active) {
  .glass {
    background: var(--glass-fallback-bg);
    -webkit-backdrop-filter: none;
    backdrop-filter: none;
  }
}
```

### Reglas del mecanismo que se equivocan siempre

| Creencia | Realidad |
| --- | --- |
| "`isolation: isolate` arregla el glass" | **No crea un backdrop root.** Sirve para aislar `mix-blend-mode`; no arregla ni rompe el glass |
| "Un `transform` en el ancestro rompe el blur" | Un `transform` **no** forma backdrop root (sí crea stacking y containing block) |
| "`will-change` es inocuo" | `will-change: filter`, `opacity` o `backdrop-filter` en un ancestro **sí** crea backdrop root y **trunca** el blur. Es la causa habitual de "el blur no funciona" |
| "`z-index` o `position: fixed` crean el backdrop root" | No lo crean |
| **Triggers reales del backdrop root** | root, `filter`, `opacity < 1`, `mask`/`mask-image`/`mask-border`/`clip-path`, `backdrop-filter`, `mix-blend-mode`, y `will-change` de esos |

### Efectos secundarios que rompen layouts

- Un `backdrop-filter` distinto de `none` crea **stacking context y containing
  block** para descendientes `absolute`/`fixed`. Un `position: fixed` dentro de
  un panel glass se posiciona **respecto al panel**, no al viewport.
- **Glass anidado:** cada nivel es backdrop root del siguiente (el hijo no ve a
  través del padre) y la spec documenta **degradación exponencial** de repintado.
  Es un anti-patrón, no una decisión estética.
- **Promoción especulativa** (`transform: translateZ(0)`) cuesta memoria de GPU y
  puede rasterizar a escala incorrecta. Se promociona con medición, no por
  superstición.
- En **Safari 26** el chrome del navegador muestrea `background-color` y
  `backdrop-filter` de elementos `fixed`/`sticky` (ignora `theme-color`, pero
  **lee elementos con `opacity: 0`**), así que un overlay oculto puede teñir la
  barra del sistema. Un overlay cerrado debe ser `display: none`, no
  `opacity: 0`.

### Rendimiento: es un presupuesto, no un gusto

Cada `backdrop-filter` exige una pasada de render extra y puede duplicar tiempo,
memoria y ancho de banda de GPU. El anidamiento lo multiplica.

| Límite operativo | Valor |
| --- | --- |
| Superficies glass concurrentes por viewport | **≤ 3** |
| `blur()` por defecto | **12–16px** |
| `blur()` máximo | 24px, solo en overlay a pantalla completa |
| Animar `backdrop-filter` | **Nunca** |
| Animar en su lugar | `opacity` y `transform` de una capa ya difuminada |

---

## 3. Accesibilidad: el talón de Aquiles

WCAG define el contraste **contra el fondo especificado sobre el que se renderiza
el texto**. En glass el fondo efectivo es la composición `backdrop-filter` +
alpha, **píxel a píxel**. Un panel que da 8:1 sobre una zona oscura puede dar
1.8:1 sobre la zona clara del mismo vídeo; el mismo componente cambia entre
modos, entre posiciones de scroll y según las preferencias del usuario.

**Medir contra un color "nominal" es una medición falsa.**

### Reglas duras

1. Nunca texto de cuerpo sobre glass sin **scrim** sólido o semisólido detrás del
   bloque de texto. Umbral: **4.5:1** normal, **3:1** grande, sin redondeo.
2. El contraste se mide sobre el **peor píxel del peor estado**: el frame más
   claro del vídeo, la imagen más clara del carrusel, **ambos modos**. WCAG lista
   `F83` como *failure* por imágenes de fondo con contraste insuficiente.
3. `text-shadow` o halo **cuentan**: WCAG acepta que un borde alrededor de la
   letra aporte contraste. No sustituye a un scrim en bloques largos.
4. Nunca glass como **única señal de estado**; nunca un estado comunicado **solo
   por el tinte** (falla 1.4.1 y, para bordes e indicadores, 1.4.11 a 3:1).
5. El blur **no es jerarquía**. Si al quitarlo la jerarquía desaparece, la
   jerarquía no existía.

### Preferencias del sistema

| Media query | Estado | Qué hacer |
| --- | --- | --- |
| `prefers-reduced-transparency: reduce` | Experimental / disponibilidad limitada; depende de ajustes del SO | Degradar a superficie sólida |
| `prefers-contrast: more \| custom` | Baseline desde mayo 2022 | Degradar y subir contraste de texto |
| `forced-colors: active` | Implementado en Chromium y Firefox, en camino en WebKit | Forzar `Canvas` / `CanvasText` |

⚠️ La propiedad privada de Apple es **`-apple-visual-effect`** (singular), con
valores experimentales, **deshabilitada** en Safari y en WKWebView salvo un flag
privado. **No existe `-apple-visual-effects`** (plural) y no debe usarse como
detección de capacidades.

---

## 4. Liquid Glass: qué enseña

Apple lo presentó en **WWDC 2025 (9 de junio de 2025)**: un lenguaje unificado
para iOS/iPadOS/macOS 26, tvOS, watchOS y visionOS, con un material dinámico que
refracta el fondo, se adapta al tema y reacciona al movimiento del dispositivo.

**Recepción:** críticas de legibilidad, ruido visual, fatiga y lag por
animaciones. El resumen más citado de la prensa especializada fue *"beautiful and
hard to read"*.

**Apple ajustó, no retiró:** más *frost* en betas de iOS 26, mayor opacidad en
barras, y en **iOS 26.1** un ajuste de usuario con dos opciones — **Clear** vs
**Tinted** ("aumenta la opacidad y añade más contraste") — más *Reduce
Transparency* en Accesibilidad. En 2026 redujo la transparencia por defecto y
añadió un control progresivo claro↔tintado.

**Lección auditable, y la más importante de este documento:**

> Todo material translúcido a escala de producto necesita **techo de transparencia
> por defecto** y **salida de emergencia** (un control de usuario y una
> preferencia de accesibilidad), porque el coste de legibilidad se paga en toda la
> superficie del producto.

Si el diseño auditado pide glass agresivo **sin** conmutador y **sin** respeto a
las preferencias, el hallazgo no es estético: es de accesibilidad.

---

## 5. Glass como tokens

```css
:root {
  --glass-bg: oklch(100% 0 0 / 0.10);
  --glass-bg-strong: oklch(100% 0 0 / 0.18);
  --glass-border: oklch(100% 0 0 / 0.24);
  --glass-blur: 16px;
  --glass-blur-strong: 24px;
  --glass-saturate: 140%;
  --glass-fallback-bg: var(--color-surface-raised);
  --glass-scrim: oklch(0% 0 0 / 0.45);
}

/* Elevación = un único eje de tokens, no valores sueltos por componente. */
[data-elevation='3'] {
  --glass-bg: var(--glass-bg-strong);
  --glass-blur: var(--glass-blur-strong);
}
```

**Por qué el blur debe ser un token:** es un **presupuesto de rendimiento** y un
**parámetro de accesibilidad**, no una preferencia estética. Tokenizado se puede
auditar (cero literales `blur()` en componentes), bajar a 0 en
`prefers-reduced-transparency`, en alto contraste y en móvil de gama media, y
cambiar por breakpoint sin tocar cuarenta archivos.

El conmutador de tema degrada a **superficie sólida**: mismo layout, misma
jerarquía, cero blur. Si al degradar se rompe algo, ese algo dependía del efecto.

---

## 6. Anti-patrones de glass

| ID | Anti-patrón | Detección | Por qué daña |
| --- | --- | --- | --- |
| M-01 | Glass inflation | > 2–3 superficies con `backdrop-filter` por viewport | Anula la jerarquía: todo flota, nada destaca |
| M-02 | `blur()` > 24px por estética | `blur(2[4-9]px)` o más | Coste de GPU alto y contexto de fondo ilegible |
| M-03 | Glass sobre glass | `backdrop-filter` en descendiente de otro | Repintado duplicado por nivel; el hijo no ve a través del padre |
| M-04 | Texto de 12–14px sobre glass sin scrim | `font-size` ≤ 14px + glass en el mismo subárbol | Falla 4.5:1 sobre algún píxel del fondo |
| M-05 | Glass en tablas o formularios | `backdrop-filter` en `table`, `td`, `form` | Lectura densa sobre fondo variable; fatiga |
| M-06 | Glass sin fallback | `backdrop-filter` sin `@supports` | Sin soporte queda texto sobre fondo transparente |
| M-07 | Glass sobre fondos cambiantes | Panel `fixed` sobre `<video>`, carrusel o imagen rotativa | El peor caso de contraste es indeterminable |
| M-08 | Glass como estado | `.is-disabled { backdrop-filter: … }` | No se percibe; confunde "elevado" con "inactivo" |
| M-09 | Falta `-webkit-backdrop-filter` | Grep | WebKit muestra un panel plano y sucio |
| M-10 | Falta el borde de 1px | Grep de `backdrop-filter` sin `border` ni `inset` shadow | Bleeding del blur en los cantos |
| M-11 | Animar `backdrop-filter` | `transition`/`animation` sobre él | Repintado por frame; jank en gama media |
| M-12 | Ignorar las preferencias del sistema | Sin `prefers-reduced-transparency` ni `prefers-contrast` | Ignora una preferencia declarada por el usuario |
| M-13 | Blur como sustituto de jerarquía | Glass en el contenedor de contenido | Al desactivar el blur desaparece la estructura |
| M-14 | Glass en `forced-colors` | Sin bloque de modo forzado | Los colores del sistema quedan ilegibles |
| M-15 | Ancestro con `opacity < 1`, `filter`, `mask`, `clip-path` o `will-change` | Grep del árbol de ancestros | Crea backdrop root y **trunca** el blur |
| M-16 | Promoción especulativa de capa | `translateZ(0)` o `will-change` "por si acaso" | Memoria de GPU y rasterizado incorrecto |
| M-17 | `backdrop-filter` con descendientes `fixed`/`absolute` | Inspección | Containing block inesperado |
| M-18 | Overlay oculto con `opacity: 0` que conserva glass | Grep | Safari 26 lee sus estilos y tiñe la barra del navegador |
| M-19 | `overflow: hidden` en `html`/`body` con cabecera glass | Grep | Rompe el viewport y el chrome en iOS |

---

## 7. Checklist de glass

- [ ] Cada superficie glass responde a una función (¿qué flota sobre qué?).
- [ ] Hay ≤ 3 superficies glass concurrentes por viewport.
- [ ] `blur()` ≤ 16px por defecto, ≤ 24px solo en overlay completo.
- [ ] No hay glass anidado.
- [ ] Toda superficie tiene borde de 1px y doble sombra.
- [ ] Ambas propiedades, `backdrop-filter` y `-webkit-backdrop-filter`.
- [ ] Existe fallback opaco en `@supports not`.
- [ ] Se degrada a sólido con `prefers-reduced-transparency`,
      `prefers-contrast: more` y `forced-colors: active`.
- [ ] Ningún texto de cuerpo descansa sobre glass sin scrim.
- [ ] El contraste se ha medido sobre el peor fondo del peor estado.
- [ ] No se anima `backdrop-filter`.
- [ ] No hay ancestros con `opacity < 1` ni `will-change` sobre el panel.
- [ ] Ningún descendiente `fixed`/`absolute` depende del viewport dentro del panel.
- [ ] Ningún overlay cerrado conserva `backdrop-filter` con `opacity: 0`.
- [ ] Los valores de blur, alpha, borde y scrim son tokens.
