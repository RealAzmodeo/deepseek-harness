# Accesibilidad — WCAG 2.2 AA, de verdad

La accesibilidad no es una sección del informe: es un **filtro previo**. Un
hallazgo de accesibilidad es siempre severidad crítica y pertenece al **nivel 1**
del protocolo de rechazo: no admite excepción documentada.

## 1. Estado real de los estándares (2025)

| Estándar | Estado | Nota |
| --- | --- | --- |
| WCAG 2.0 (2008) | Vigente | Base de Section 508 |
| WCAG 2.1 (junio 2018) | Vigente | Base legal de la UE para sector público y de la regla ADA Título II |
| **WCAG 2.2** | **Recomendación W3C del 5 de octubre de 2023** (actualizada el 12-12-2024) | **Es el objetivo de auditoría** |
| WCAG 3.0 | *Working Draft*, en desarrollo | **No** reemplaza a WCAG 2 y no se sabe cuándo lo hará. No se audita contra él |
| APCA | Beta, sin valor normativo | No sustituye al cálculo de contraste de WCAG 2 |

WCAG 2.2 añade **9 criterios** y **elimina 4.1.1 Parsing** (obsoleto: los
navegadores ya no fallan por ese motivo). No basta con "cumplo 2.1": 2.2 es la
referencia de compra y de mercado.

### Los 9 criterios nuevos de 2.2

| SC | Nombre | Nivel | Qué exige |
| --- | --- | --- | --- |
| 2.4.11 | Focus Not Obscured (Minimum) | **AA** | El elemento enfocado no queda totalmente oculto por contenido pegajoso |
| 2.4.12 | Focus Not Obscured (Enhanced) | AAA | No queda oculto en absoluto |
| 2.4.13 | Focus Appearance | AAA | Área ≥ perímetro de 2px CSS y contraste ≥ 3:1 |
| 2.5.7 | Dragging Movements | **AA** | Toda acción que se hace arrastrando tiene alternativa de un solo puntero |
| 2.5.8 | Target Size (Minimum) | **AA** | Objetivo ≥ **24×24 CSS px** o espaciado suficiente |
| 3.2.6 | Consistent Help | **A** | La ayuda aparece en la misma posición relativa |
| 3.3.7 | Redundant Entry | **A** | No volver a pedir información ya dada en el mismo proceso |
| 3.3.8 | Accessible Authentication (Minimum) | **AA** | No bloquear gestores de contraseñas ni exigir un test cognitivo |
| 3.3.9 | Accessible Authentication (Enhanced) | AAA | Sin excepciones de objeto ni de contenido |

---

## 2. Los criterios AA que se verifican siempre

| SC | Requisito exacto | Cómo se verifica |
| --- | --- | --- |
| **1.4.3** Contraste (mínimo) | Texto normal ≥ **4.5:1**; texto grande ≥ **3:1**. Grande = ≥ 18pt (≈24px) o ≥ 14pt bold (≈18.66px). **No se redondea**: 4.49:1 no pasa | Medir el par real `color`/`background` en cada estado |
| **1.4.11** Contraste no textual | Componentes de UI, iconos con significado y **el indicador de foco** ≥ **3:1** contra el color adyacente | Bordes de input, checkbox, iconos de estado, anillo de foco |
| **2.4.7** Foco visible | Todo elemento operable por teclado tiene indicador visible y no limitado en el tiempo | Tabular la pantalla completa |
| **1.4.4** Redimensionar texto | Hasta **200%** sin pérdida de contenido ni funcionalidad | Zoom del navegador al 200% |
| **1.4.10** Reflow | Sin scroll horizontal a **320 CSS px** de ancho (equivale a 1280px con zoom 400%). Excepción: tablas, mapas, vídeo y editores con barras | Reducir la ventana a 320px |
| **1.4.12** Espaciado de texto | Soportar 1.5 de interlineado, 0.12em de letter-spacing y 0.16em de word-spacing sin recortes | Inyectar el bookmarklet de espaciado |
| **1.4.1** Uso del color | El color no es el único canal | Simular daltonismo |
| **1.3.1** Estructura | Semántica y relaciones programáticas | Inspeccionar encabezados, landmarks y labels |
| **2.1.1** Teclado | Todo operable por teclado | Recorrido solo con teclado |
| **2.4.2** Título de página | Título descriptivo y único | — |
| **3.3.1/3.3.3** Errores | Identificar el error y sugerir la corrección | Forzar errores |
| **4.1.2** Nombre, rol, valor | Todo componente expone los tres | Inspeccionar el árbol de accesibilidad |
| **3.1.1** Idioma | `lang` en `html` y en fragmentos en otro idioma | — |
| **1.2.2/1.2.4** Subtítulos | Vídeo con sonido | — |

### La confusión 24 vs 44 vs 48

| Valor | Origen | Nivel |
| --- | --- | --- |
| **24×24 CSS px** | WCAG 2.2 SC 2.5.8 Target Size (Minimum), con excepción de espaciado: si los objetivos son menores, un círculo de 24px de diámetro centrado en cada uno no puede intersecar otro | **AA — mínimo legal** |
| **44×44 CSS px** | WCAG SC 2.5.5 Target Size (Enhanced) | **AAA — objetivo de diseño** |
| **48×48 dp** | Material Design (`LocalMinimumInteractiveComponentSize`) | Guía de plataforma |

**Regla práctica: 24 es el mínimo legal AA; 44–48 es el objetivo de diseño.**
Un auditor que exige 44 como "AA" está citando mal el estándar. Un auditor que
acepta 18px en escritorio está incumpliendo 2.5.8.

---

## 3. ARIA: reglas y patrones

`Using ARIA` es hoy un **Discontinued Draft**: la guía viva es el **ARIA
Authoring Practices Guide (APG)**. Las cuatro reglas doradas siguen siendo
válidas:

1. **Si existe un elemento HTML nativo con la semántica y el comportamiento,
   úsalo.** No ARIA es mejor que ARIA malo.
2. **No cambies la semántica nativa.** `<button role="tab">` está mal;
   `<div role="tab"><h2>` está bien.
3. **Todo control ARIA interactivo debe ser operable por teclado**, con `Enter`
   **y** `Espacio` si se comporta como botón.
4. **Nunca `role="presentation"` ni `aria-hidden="true"` en un elemento
   enfocable**, ni en un ancestro que contenga algo visible e interactivo.

### Patrones obligatorios

| Patrón | Implementación |
| --- | --- |
| Mensaje no urgente (guardado, resultados) | `aria-live="polite"` + `role="status"` |
| Error crítico | `role="alert"` / `aria-live="assertive"` — y `role="status"` para el resto |
| Error de campo | `aria-describedby` apuntando al `id` del mensaje + `aria-invalid="true"` |
| Acordeón, menú, combobox | `aria-expanded`, `aria-controls` |
| Modal | Foco al primer elemento, trampa de foco, `inert` en el resto del documento, `Escape` cierra, foco devuelto al disparador |
| Pestañas | `role="tablist"/"tab"/"tabpanel"`, `aria-selected`, flechas para navegar |
| Orden de tabulación | Igual al orden visual y de lectura. Nunca `tabindex` > 0 |
| Skip link | Primer elemento enfocable, visible al recibir foco |
| Landmarks | `header`, `nav`, `main`, `footer` únicos y presentes |
| Encabezados | Un `h1`; sin saltos de nivel |

---

## 4. Legislación: por qué esto ya no es opcional

| Norma | Ámbito | Exigencia | Fecha |
| --- | --- | --- | --- |
| **European Accessibility Act** — Directiva (UE) 2019/882 | Productos y servicios privados: e-commerce, banca, transporte, telecomunicaciones, libros electrónicos | Armonizada con **WCAG 2.2** | **Aplicable desde el 28 de junio de 2025** |
| Directiva (UE) 2016/2102 + EN 301 549 | Sector público europeo | WCAG 2.1 AA | Vigente |
| ADA Título II (regla de 2024) | Gobiernos estatales y locales de EE. UU. | **WCAG 2.1 AA** | Plazos ampliados a 26-04-2027 (≥50.000 hab.) y 26-04-2028 (<50.000) |
| Section 508 (Rehabilitation Act) | Agencias federales de EE. UU. | Revised 508 Standards, armonizados con WCAG 2.0 AA | Vigente desde 2018 |

**Consecuencia para el informe:** un defecto de accesibilidad AA no es "una
mejora pendiente"; es un **riesgo legal** en la UE desde el 28 de junio de 2025.
Se dice así, con el criterio concreto, sin dramatizar y sin inventar cifras de
sanción.

---

## 5. Cómo se prueba (y qué no se puede automatizar)

**Automatizable** (axe, Lighthouse, Pa11y): contraste en pares simples,
`alt` ausente, `label` ausente, jerarquía de encabezados, `lang`, duplicados de
`id`, algunos roles y nombres. Es rápido, repetible e imprescindible en CI.

**No automatizable** — y por eso las herramientas dan **falsos negativos**:

- Si el orden de tabulación es lógico.
- Si el texto alternativo es **pertinente** (no solo si existe).
- Si los mensajes de error son **comprensibles**.
- Si la trampa de foco funciona.
- El orden de lectura que anuncia el lector de pantalla.
- Si el significado depende solo del color cuando el par pasa el contraste.
- El contraste real sobre imágenes, gradientes, transparencias y estados
  (`:hover`, `:focus`, `:disabled`, `:visited`).

Las herramientas de W3C "no pueden comprobar todos los aspectos" y "pueden
producir resultados falsos o engañosos; no determinan la accesibilidad". Un
informe limpio de axe **no** significa que la interfaz sea accesible. Nunca se
declara "accesible" a partir de un informe automático.

**Pruebas manuales mínimas (todas, siempre):**

1. Recorrido completo **solo con teclado**: ¿se llega a todo? ¿se ve el foco?
   ¿el orden tiene sentido? ¿se puede salir de cada trampa?
2. **Lector de pantalla** (NVDA, VoiceOver): ¿se anuncia lo que importa?
3. **Zoom 200%** y **reflow a 320px**.
4. **Simulación de daltonismo** en los estados críticos.
5. **`prefers-reduced-motion`** activado.
6. **Contraste manual** en cada estado, no solo en reposo.

---

## 6. Checklist de accesibilidad para el informe

- [ ] Contraste de texto ≥ 4.5:1 (3:1 en grande) medido en **todos** los estados.
- [ ] Contraste no textual ≥ 3:1 en bordes, iconos con significado y anillo de foco.
- [ ] Foco visible con `:focus-visible` y `outline` (no recortado por `overflow`).
- [ ] Navegación completa por teclado, sin trampas, con orden lógico.
- [ ] Nombres accesibles en todo control, incluidos los de solo icono.
- [ ] `label` asociado en todos los campos; errores con `aria-describedby`.
- [ ] Modal con trampa de foco, `Escape` y devolución del foco.
- [ ] Regiones vivas para los cambios dinámicos relevantes.
- [ ] Zoom 200% y reflow a 320px sin pérdida.
- [ ] `prefers-reduced-motion` respetado.
- [ ] El color nunca es el único canal.
- [ ] Escalado de texto y espaciado sin recortes (1.4.12).
- [ ] Objetivos ≥ 24×24 CSS px, con 44×44 como objetivo táctil.
- [ ] `lang`, título de página y jerarquía de encabezados correctos.
- [ ] Sin bloqueo del gestor de contraseñas ni repetición de datos (3.3.7/3.3.8).
