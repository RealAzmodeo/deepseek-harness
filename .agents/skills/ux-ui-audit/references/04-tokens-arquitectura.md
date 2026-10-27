# Arquitectura de tokens: un solo lugar

## 1. Qué es un design token (y qué no)

**Definición del DTCG (2025.10, §3.1):** un token es información asociada a un
nombre legible por humanos, como mínimo un par nombre/valor, con propiedades
tipadas: valor, tipo, descripción y metadata de herramienta.

Es un **artefacto de intercambio** en JSON, agnóstico de plataforma. No es un
mecanismo de render. La propiedad que lo define es ser **única fuente de verdad**:
un valor copiado a mano en Figma y en CSS **no es un token**, son dos fuentes que
divergen.

| Concepto | Naturaleza | Qué le falta |
| --- | --- | --- |
| **Design token** | Dato con nombre, `$type`, `$description`, alias, portable | — |
| **CSS custom property** | Mecanismo del navegador (cascada, herencia, `var()`) | Tipo, descripción, metadata, portabilidad |
| **Constante de estilo** (Sass/TS) | Valor compilado, atado a lenguaje y build | Interoperabilidad entre herramientas |
| **Variable de Figma** | Entidad de la herramienta con *modes* y *scopes* | Formato de intercambio (hasta exportar a DTCG) |

En la práctica: el **origen** es un fichero DTCG; el **destino** es CSS custom
properties (y Swift/Kotlin/Compose para otras plataformas); el puente es un
compilador.

---

## 2. La especificación W3C DTCG

**Estado real:** el 28 de octubre de 2025 el Design Tokens Community Group
publicó tres *Final Community Group Reports* versionados **2025.10** — **Format**,
**Color** y **Resolver** — declarados "considered stable" y clasificados como
*Candidate Recommendation* del CG. Con la salvedad literal: *"It is not a W3C
Standard nor is it on the W3C Standards Track"*. Existe además un *preview draft*
posterior marcado **"do not implement"**: no se cita como referencia.

### Formato

- **Token** = objeto con `$value` (obligatorio) y `$type` (obligatorio salvo
  herencia del grupo), más `$description`, `$extensions` y `$deprecated`.
- **Grupo** = objeto **sin** `$value`; admite `$type` heredable, `$description`,
  `$extensions`, `$deprecated`, `$extends` (fusión profunda) y un token raíz
  `$root`.
- **Alias:** `"{group.token}"`, y también `{"$ref": "#/ruta"}` con soporte
  obligatorio.
- Los nombres **no** pueden empezar por `$` ni contener `{`, `}` o `.`.
- Los ficheros son `.tokens` o `.tokens.json`, con MIME
  `application/design-tokens+json`.

### Tipos oficiales

| Primitivos | Compuestos |
| --- | --- |
| `color`, `dimension`, `fontFamily`, `fontWeight`, `duration`, `cubicBezier`, `number` | `strokeStyle`, `border`, `transition`, `shadow`, `gradient`, `typography` |

Un `$type` fuera de esa lista (por ejemplo `string`) es **inválido**.

`color` es un objeto `{colorSpace, components, alpha?, hex?}` con 14 espacios de
color — entre ellos **oklab y oklch**, además de sRGB, hsl, lab, lch,
display-p3, a98-rgb, prophoto-rgb, rec2020 y xyz — y admite `none` para
componentes ausentes. `dimension` y `duration` son `{value, unit}` (`px|rem`,
`ms|s`), nunca cadenas CSS.

### Ecosistema

| Herramienta | Rol |
| --- | --- |
| **Style Dictionary** | Compilador DTCG-first desde la v4. Emite `:root { --color-… }` |
| **Tokens Studio** | Autoría en Figma con export DTCG; alimenta Style Dictionary vía `@tokens-studio/sd-transforms` |
| **Terrazzo** | DTCG-nativo; convierte modos en `@media (prefers-color-scheme: dark)` y `[data-mode="dark"]` |
| **Specify** | Exporta modos de Figma Variables como selectores de atributo |
| **Figma Variables + Modes** | Modela contextos (light/dark/high-contrast); exporta por Plugin API, REST o fichero DTCG |

---

## 3. La arquitectura de tres capas — obligatoria

El propio DTCG nombra las categorías **Base**, **Alias** y **Component**.

| Capa | Ejemplo | Regla |
| --- | --- | --- |
| **1 · Primitivos** (*reference*) | `--prim-blue-600`, `--prim-space-4` | **Nunca** se consumen en un componente |
| **2 · Semánticos** (*alias*) | `--color-action`, `--color-text-muted`, `--color-surface-raised` | Único punto donde se asigna significado |
| **3 · Componente** | `--button-bg: var(--color-action)` | El componente declara sus variables con **fallback al semántico**; el consumidor las sobrescribe en su scope sin tocar el CSS |

### Roles semánticos mínimos

- **Texto:** default, muted, subtle, inverse, disabled, on-action.
- **Superficie:** base, raised, sunken, hover, active, selected, inverse.
- **Borde:** subtle, default, strong, interactive (≥ 3:1), dividers.
- **Acción:** primary + hover/active/disabled/on, secondary, danger.
- **Feedback:** success, warning, danger, info (+ variantes `subtle`, `border`, `text`, `on`).
- **Foco, overlay/scrim, glass.**
- **Elevación**, **movimiento** (duración + easing), **densidad**, **tipografía**.

### Por qué el salto primitivo → componente es el error más común

Sin la capa semántica, el componente queda acoplado a la paleta. Entonces:

- el **modo oscuro** obliga a reescribir reglas, porque no existe un punto donde
  "azul 600" signifique "acción primaria en oscuro";
- la **multi-marca** duplica componentes enteros;
- el **contraste** deja de ser auditable, porque no hay un lugar donde el par
  texto/fondo esté declarado;
- la **densidad** no se puede cambiar sin tocar cada componente.

El **Resolver Module** existe justo para eso: deduplicar valores repetidos entre
contextos sin explotar combinatoriamente.

---

## 4. Nomenclatura y escalas

**Patrón:** `--<categoría>-<rol>-<variante>-<estado>` →
`--color-action-primary-hover`. Alternativa: **CTI** (category-type-item).

| Escala | Regla |
| --- | --- |
| **Espaciado** | Base 4pt, escala cerrada `--space-1…12`; los componentes alinean a una rejilla de 8 |
| **Tipografía** | Escala modular con ratio 1.125 (UI densa), 1.2 (equilibrado) o 1.25 (expresivo). Fluida con `clamp()`; **el máximo debe ser ≥ 2× el mínimo en unidades relativas** para permitir el zoom al 200% |
| **Radios** | Escala cerrada (Material 3: 0 / 4 / 8 / 12 / 16 / 28 / full) |
| **Sombras / elevación** | Niveles nombrados, no valores sueltos |
| **z-index** | Escala nominal: base, dropdown, sticky, overlay, modal, popover, toast, tooltip |
| **Duración y easing** | `fast/base/slow` × curvas nombradas |
| **Densidad** | Altura de control, altura de fila, hueco, padding inline |

### Nombres prohibidos

| Nombre | Por qué |
| --- | --- |
| `--color-blue`, `--red` | No expresa rol: miente en cuanto cambie la marca |
| `--padding-17px` | Nombra el valor, no la decisión |
| `--big-shadow`, `--nice-radius` | Adjetivo sin contrato |
| `--color-1`, `--button-blue-hover-dark-2` | Sin sistema |
| `--danger` cuando ya existe `--error` con el mismo valor | Dos nombres, un rol: divergen |

---

## 5. Theming y multi-marca sin duplicar reglas

Una sola capa de reglas. Cambian los **valores** de la capa 2, reasignados por
scope.

| Mecanismo | Uso |
| --- | --- |
| `color-scheme: light dark` en `:root` | Declara los esquemas soportados; ajusta scrollbars y controles nativos |
| `light-dark()` | Resuelve el par claro/oscuro sin media query. **Requiere** `color-scheme` |
| `@media (prefers-color-scheme: dark)` | Sigue la preferencia del sistema operativo |
| `[data-theme="dark"]` | Override explícito y persistido por el producto |
| `@layer tokens, base, components, utilities` | Fija el orden una vez: a partir de ahí, especificidad y orden de aparición dejan de importar |
| `:where()` | Aporta 0 de especificidad, para scoping sin guerra |
| Contextos DTCG (Resolver: *sets* + *modifiers* + *resolutionOrder*) | Multi-marca y multi-tema sin duplicar tokens |

**Anti-patrón:** duplicar la hoja de estilos para el modo oscuro. Cada regla
nueva se escribe dos veces, y el contraste deriva en silencio.

---

## 6. Color moderno

- **OKLCH / OKLab son perceptuales.** La `L` de `oklch()` es la luminosidad
  percibida, distinta de la `L` de `hsl()`. **HSL miente sobre el contraste**:
  blanco sobre azul saturado se lee; sobre amarillo saturado es ilegible, y HSL
  da valores parecidos en ambos casos.
- **`color-mix()`** usa `oklab` por defecto. Es correcto para derivar hover o
  disabled, **pero si el contraste es crítico el resultado se congela como
  token**: un color calculado en tiempo de render no se puede auditar.
- **Gamut amplio:** `color(display-p3 …)` detectado con
  `@media (color-gamut: p3)`. Los valores fuera de gamut son válidos pero se
  recortan al renderizar: nunca son la única fuente de un par con contraste
  verificado.
- **Escalas perceptuales:** luminosidad fija y barrido de croma y tono en OKLCH.
  Es lo que hace que un paso de la escala se perciba igual en todos los tonos.
- **Contraste:** lo exigible es WCAG 2.2 (4.5:1 texto, 3:1 grande y no textual).
  APCA es beta y **no** tiene valor normativo; WCAG 3 sigue en *Working Draft*
  con el algoritmo de contraste aún por determinar.

### Patrón de fallback para navegadores sin `oklch()`

`oklch()` y `color-mix()` son Baseline 2023. Si la matriz de navegadores del
producto incluye versiones anteriores, el fallback se declara **una vez en la
capa semántica**, no duplicando la hoja:

```css
/* 1. Valor sRGB seguro, siempre válido. */
:root {
  --color-action: #1d4ed8;
}
/* 2. Mejora progresiva: solo donde el motor entiende oklch. */
@supports (color: oklch(50% 0.2 250)) {
  :root {
    --color-action: oklch(55% 0.212 262);
  }
}
```

Los componentes **nunca** ven la diferencia: siguen leyendo `var(--color-action)`.

---

## 7. El pipeline: de Figma a producción

```
Figma Variables ──export DTCG──► tokens/*.tokens.json   (fuente de verdad)
                                        │
                                 Style Dictionary
                                        │
        ┌───────────────────────────────┼───────────────────────────────┐
        ▼                               ▼                               ▼
  tokens.css                    tokens.kt / tokens.swift        tokens.d.ts
  (:root + @layer)              (Compose / SwiftUI)             (tipos)
```

Reglas del pipeline:

1. **Una sola fuente.** Si un valor se edita en dos sitios, el sistema ya está
   roto.
2. **El fichero generado no se edita a mano.** Se regenera; si hace falta
   tocarlo, falta un token.
3. **La revisión ocurre en el origen** (Figma o el JSON), no en el CSS generado.
4. **El paquete de tokens se versiona y se publica** para que las apps lo
   consuman; no se copia el fichero entre repos.

---

## 8. Documentación de un componente (ficha mínima)

Todo componente del sistema documenta:

- **Propósito** en una frase: qué problema resuelve y cuándo **no** usarlo.
- **Props / args** tipadas, con variantes como uniones cerradas.
- **Estados obligatorios:** default, hover, active, focus-visible, disabled,
  loading, error, empty (los que apliquen).
- **Tokens que consume** (capa 3).
- **Requisitos de accesibilidad:** rol, nombre accesible, teclado, contraste.
- **Ejemplos con contenido extremo:** texto larguísimo, 0 y 100 elementos,
  idioma distinto, RTL.

Un componente sin ficha se reimplementa a los tres meses.

---

## 9. Checklist de tokens

- [ ] Existe una única fuente de verdad en formato DTCG.
- [ ] Las tres capas existen y los componentes solo consumen la 2 o la 3.
- [ ] Cero literales (`#hex`, `px`, `ms`, `cubic-bezier`) en componentes.
- [ ] Cero `!important`.
- [ ] z-index dentro de la escala; los conflictos se resuelven con contextos de
      apilamiento, no con números más altos.
- [ ] El modo oscuro reasigna tokens, no reglas.
- [ ] Cada token tiene consumidor; no hay huérfanos.
- [ ] No hay dos tokens con el mismo valor y distinto nombre.
- [ ] Los pares texto/fondo de cada tema están verificados a 4.5:1.
- [ ] La escala tipográfica usa `clamp()` con mínimo y máximo en `rem`.
- [ ] El orden de `@layer` está declarado una vez y es estable.
- [ ] El CSS generado no se edita a mano.
