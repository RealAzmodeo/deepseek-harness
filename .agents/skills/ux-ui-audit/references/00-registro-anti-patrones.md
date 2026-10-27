# Registro de anti-patrones — grabado en piedra

Este fichero es el corazón del agente. Un hallazgo que aparezca aquí **no se
negocia, no se implementa "solo esta vez" y no se maquilla**. El objetivo no es
que el agente opine: es que **reconozca el patrón por su identificador, lo
nombre, explique el daño y no lo reproduzca**.

## Cómo se usa

1. Antes de escribir una sola línea de CSS/HTML/JS, recorre la categoría que
   corresponda al material auditado y busca coincidencias.
2. Cita el identificador (`J-03`, `L-01`, `M-04`…) y la línea real del archivo.
3. Un anti-patrón detectado **no puede aparecer en el "Código Corregido"**. Si
   el código original lo tiene, la corrección lo elimina o lo sustituye; nunca
   se "adapta".
4. Si el usuario pide explícitamente implementar uno, aplica el **Protocolo de
   rechazo** del final de este documento.

## Severidad

| Nivel | Criterio | Efecto |
| --- | --- | --- |
| **Crítico** | Bloquea el uso, pierde datos, es ilegible o inaccesible, o es un dark pattern. | No se implementa nunca. Si ya existe, la corrección es obligatoria. |
| **Alto** | Fricción medible en la tarea principal, inconsistencia de sistema o deuda estructural. | Se corrige en el mismo cambio. |
| **Medio** | Fricción perceptible, pulido ausente, deuda localizada. | Se corrige o se registra con plan. |
| **Bajo** | Detalle de acabado sin impacto funcional. | Se menciona sin inflarlo. |

**No infles.** Una línea de 300px desalineada no es crítica. Un texto que no se
lee sí.

---

## A · Accesibilidad — INNEGOCIABLE

| ID | Anti-patrón | Detección | Daño | Fix |
| --- | --- | --- | --- | --- |
| A-01 | Texto por debajo de 4.5:1 (3:1 si ≥ 24px o ≥ 18.66px bold) | Medir el par real `color`/`background` en cada estado; `#999` sobre `#fff` = 2.85:1 | Ilegible con baja visión, sol, pantallas baratas | Subir el token de texto a un paso de la escala que sí cumpla; nunca "casi pasa" |
| A-02 | Componentes, iconos o bordes por debajo de 3:1 | Bordes de input, iconos de estado, anillo de foco | El control deja de percibirse como control | `--color-border-interactive` con ≥ 3:1 medido |
| A-03 | Foco eliminado (`outline: none`, `outline: 0`) sin sustituto | Buscar `outline` en el CSS | Navegación por teclado imposible | `outline` + `outline-offset` con token de foco |
| A-04 | Foco implementado con `:focus` en vez de `:focus-visible`, o solo con `box-shadow` que recorta `overflow: hidden` | Grep de `:focus` | El foco desaparece en contenedores con overflow o en modos forzados | `:focus-visible` + `outline` |
| A-05 | Modal sin trampa de foco, sin `Escape` y sin devolver el foco al disparador | Abrir el modal y tabular | El usuario de teclado queda atrapado o sale al fondo | `inert` en el fondo, foco al primer elemento, `Escape` cierra, foco de vuelta |
| A-06 | Color como único canal de información | Estados de error/éxito solo por color | Daltonismo (8% de hombres) pierde el mensaje | Añadir icono, texto o patrón además del color |
| A-07 | Tipografía y espaciado en `px` fijo | Grep de `px` en `font-size`, `padding`, `width` de texto | El zoom del navegador no escala | `rem` para todo lo que deba escalar con la preferencia del usuario |
| A-08 | El layout se rompe al 200% de zoom (1.4.4) | Zoom 200% en el navegador | Incumplimiento legal y pérdida de contenido | Layout fluido, sin alturas fijas, sin `overflow: hidden` en el contenedor |
| A-09 | Scroll horizontal a 320px de ancho (1.4.10) | Reducir a 320px | Uso imposible en móvil estrecho | `min-width: 0`, `flex-wrap`, `overflow-wrap: anywhere` |
| A-10 | `div`/`span` clicables sin rol, sin teclado y sin foco | `onClick` sobre elemento no interactivo | Inaccesible por completo | `<button>` real; si no se puede, `role`, `tabindex="0"` y teclado |
| A-11 | Botón de icono sin nombre accesible | `<button><svg/></button>` sin texto ni `aria-label` | El lector anuncia "botón" | `aria-label` o texto visualmente oculto |
| A-12 | Imagen sin `alt`, o `alt="imagen"` / `alt="foto"` | Grep de `alt=` | Contenido perdido o ruido para el lector | `alt` descriptivo, `alt=""` si es decorativa, `alt` con el dato si es un gráfico |
| A-13 | Jerarquía de encabezados rota (`h1` → `h4`, varios `h1` decorativos) | Inspeccionar la secuencia | Navegación por encabezados inútil | Un `h1`, saltos de un nivel |
| A-14 | Control sin `<label>` asociado (`for`/`id`) | Inspeccionar el campo | El lector no dice qué se está pidiendo | `label[for]` o `aria-labelledby` |
| A-15 | `placeholder` como única etiqueta | Campo sin `label`, con `placeholder` | Desaparece al escribir y no lo anuncia el lector | `label` visible permanente |
| A-16 | Error de validación no anunciado | Enviar un formulario inválido con lector | El usuario no sabe que falló | `aria-live="polite"`/`role="alert"` + `aria-describedby` al campo |
| A-17 | Target interactivo por debajo del mínimo | Medir la caja interactiva real, no el icono. **24×24 CSS px** es el mínimo de WCAG 2.2 AA (2.5.8); **44×44** es 2.5.5, nivel AAA, y objetivo de diseño en táctil; Material exige **48×48 dp** | Errores de pulsación; incumplimiento legal en AA | Ampliar el área con padding o pseudo-elemento, sin agrandar el icono |
| A-18 | `aria-*` inventado, contradictorio o que duplica semántica nativa | `aria-hidden` sobre elemento enfocable, `role="button"` sobre `<button>` | Peor que no usar ARIA | Regla de oro: no ARIA es mejor que ARIA malo |
| A-19 | `tabindex` positivo | Grep de `tabindex="[1-9]` | Orden de tabulación impredecible | Solo `0` o `-1` |
| A-20 | Orden de tabulación distinto del orden visual | Tabular por la pantalla | Desorientación | Orden del DOM = orden visual; no reordenar con `order`/`flex-direction` inverso |
| A-21 | `autoplay` con sonido | Grep de `autoplay` sin `muted` | Interrupción agresiva | Nunca; si hay vídeo, silenciado y con control |
| A-22 | Animación sin `prefers-reduced-motion` | Grep de `animation`/`transition` sin media query | Mareo, migraña, trastorno vestibular | Degradar la duración a ~1ms, no eliminar el feedback |
| A-23 | `user-select: none` o `-webkit-user-select: none` global | Grep | Impide copiar, traducir y leer con herramientas de apoyo | Solo en controles, nunca en texto |
| A-24 | Información esencial solo accesible con `hover` | Desconectar el ratón / usar táctil | Inaccesible en táctil y en teclado | Mostrar siempre, o tras foco y click también |
| A-25 | Interacción que exige arrastrar sin alternativa (2.5.7) | Slider, kanban, reorder | Imposible con movilidad reducida | Botones de alternativa (subir/bajar, mover a…) |
| A-26 | Bloqueo del gestor de contraseñas o CAPTCHA cognitivo (3.3.8) | `autocomplete="off"` en login, `paste` bloqueado | Excluye y reduce seguridad real | `autocomplete` correcto, permitir pegar |
| A-27 | Repetición de datos ya introducidos (3.3.7) | Wizard que vuelve a pedir | Fricción evitable y fuente de errores | Redundancia automática o prerrelleno |
| A-28 | Ayuda en una posición distinta en cada pantalla (3.2.6) | Comparar pantallas | El usuario no encuentra la ayuda | Misma ubicación relativa y mismo orden |
| A-29 | Skip link ausente | Tabular desde el principio | Hay que atravesar toda la navegación | Enlace "saltar al contenido" visible al foco |
| A-30 | `lang` ausente o incorrecto | `<html>` sin `lang` | Pronunciación y traducción automática rotas | `lang` en `html` y en los fragmentos en otro idioma |
| A-31 | Scroll horizontal causado por `width: 100vw` con scrollbar visible | Buscar `100vw` | Barra horizontal y CLS | `width: 100%` o `100dvw` con cuidado |
| A-32 | Contenido dinámico que aparece sin región viva | Añadir/quitar elementos sin `aria-live` | El lector no anuncia nada | `role="status"` para información, `role="alert"` para error |

---

## B · Color y contraste

| ID | Anti-patrón | Detección | Daño | Fix |
| --- | --- | --- | --- | --- |
| B-01 | Gris "elegante" (`#999`, `#aaa`, `color: gray`) para texto secundario | Medir contraste | No pasa AA y es el defecto más común de los design systems | Token semántico de texto secundario que cumpla 4.5:1 |
| B-02 | Texto sobre imagen sin scrim | Ver la imagen más clara | Ilegible según la imagen | Scrim, `text-shadow` o banda sólida |
| B-03 | Texto sobre gradiente decorativo | Medir el peor punto | Contraste variable | Superficie sólida detrás del texto |
| B-04 | Hex raw en un componente | Grep de `#[0-9a-f]{3,8}` en componentes | El tema no puede recolorear | Token semántico |
| B-05 | Paleta sin roles semánticos (`--color-blue-500` usado como "primario") | Grep de primitivos en componentes | Dark mode y multi-marca rotos | Capa semántica |
| B-06 | Rojo/verde como único indicador de estado | Buscar solo cambio de color | Daltonismo | Icono + texto + color |
| B-07 | Color de marca como texto sobre blanco sin verificar | Medir | Muchas marcas no pasan AA en su tono base | Variante oscura del rol de texto |
| B-08 | `filter: brightness()` / `opacity` para hover | Grep de `brightness` | Contraste impredecible y fuera de tokens | Token de estado explícito (hover/active) |
| B-09 | `opacity: 0.5` global para `disabled` | Grep | Baja el contraste por debajo de AA sin control | Tokens de disabled con pares verificados |
| B-10 | Dark mode con `filter: invert()` | Grep de `invert(` | Colores sucios e imágenes invertidas | Reasignar tokens semánticos |
| B-11 | Gradientes "AI" (violeta→cian) decorativos | Inspección | Ruido sobre la jerarquía | Solo si comunican algo; si no, fuera |
| B-12 | Saturación alta en grandes superficies | Inspección | Fatiga visual | Reservar el color saturado para acentos pequeños |
| B-13 | Tinte de estado que comunica acción por color solo | Inspección | Ambigüedad e inaccesibilidad | Color + texto + icono + forma |

---

## C · Tipografía

| ID | Anti-patrón | Detección | Daño | Fix |
| --- | --- | --- | --- | --- |
| C-01 | Texto de cuerpo por debajo de 16px | Grep de `font-size` | Fatiga y baja legibilidad | `--text-body` ≥ 1rem |
| C-02 | Línea de más de ~90 caracteres | Medir con `ch` | El ojo pierde el salto de línea | `max-width: 68ch` |
| C-03 | `line-height` < 1.4 en cuerpo | Grep | Lectura densa y errores | 1.5 para cuerpo, 1.2–1.3 para títulos |
| C-04 | Más de tres familias tipográficas | Contar `font-family` | Ruido y peso de carga | Una sans + una mono; display solo para display |
| C-05 | Fuente decorativa en UI o en datos | Inspección | Fatiga y mala legibilidad | Reservada a títulos cortos, si acaso |
| C-06 | Texto en mayúsculas sin `letter-spacing` | Grep de `text-transform: uppercase` | Ilegible en tamaños pequeños | `--tracking-wide` |
| C-07 | Texto incrustado en imágenes | Inspección | No escala, no se traduce, no lo lee el lector | Texto real |
| C-08 | Sin `font-display: swap` | Grep de `@font-face` | Texto invisible durante la carga | `swap` + `size-adjust` para evitar CLS |
| C-09 | Escala tipográfica sin sistema (14, 15, 17, 22, 23…) | Listar tamaños | Jerarquía inconsistente | Escala modular en tokens |
| C-10 | `ellipsis` sin acceso al contenido completo | Grep de `text-overflow` | Información inaccesible | `title`, tooltip accesible o 2 líneas con `line-clamp` |
| C-11 | Párrafos largos centrados | Inspección | Perderse al volver de línea | Alineación a la izquierda en lectura larga |
| C-12 | Escala tipográfica que cambia con el viewport sin `clamp()` | Grep de `vw` en `font-size` | Texto microscópico o gigante | `clamp()` con mínimo y máximo en `rem` |

---

## D · Layout, espaciado y principios de Gestalt

| ID | Anti-patrón | Detección | Daño | Fix |
| --- | --- | --- | --- | --- |
| D-01 | Espaciado aleatorio (13px, 17px, 22px…) | Listar valores | Sin ritmo; se percibe como descuido | Escala 4/8pt |
| D-02 | Proximidad invertida: la etiqueta está más cerca del campo siguiente que del suyo | Medir las distancias | El usuario rellena el campo equivocado | Relación por espaciado antes que por líneas |
| D-03 | Elementos relacionados separados y no relacionados juntos | Inspección | Lectura errónea del grupo | Proximidad y región común coherentes |
| D-04 | Mismo estilo para funciones distintas (o distintos estilos para la misma) | Comparar | El usuario no puede predecir | Similitud: mismo aspecto = misma función |
| D-05 | Card-itis: todo metido en una tarjeta con borde y sombra | Contar contenedores | Ruido, jerarquía plana | Usar espacio y tipografía antes que cajas |
| D-06 | Figura-fondo plano: todo al mismo nivel visual | Inspección | Nada destaca, la tarea principal se pierde | Un solo foco por pantalla; el resto en segundo plano |
| D-07 | Densidad uniforme sin descanso | Inspección | Carga cognitiva alta | Aire entre grupos, no entre cada elemento |
| D-08 | Tarjetas dentro de tarjetas dentro de tarjetas | Contar anidación | Confusión de contenedores | Máximo un nivel de superficie |
| D-09 | `position: absolute` para maquetar | Grep | Se rompe con texto largo, i18n y zoom | Flujo normal, flex/grid |
| D-10 | Altura fija en `px` sobre contenido variable | Grep de `height:` | Recorta texto y rompe i18n | `min-height` + contenido |
| D-11 | Sin `min-width: 0` en hijos de flex/grid | Inspección de desbordes | El layout desborda en vez de encoger | `min-width: 0` / `min-height: 0` |
| D-12 | Media query de viewport para adaptar un componente | Grep de `@media (max-width` en componente | El componente se rompe en otro contenedor | Container queries |
| D-13 | Breakpoints por dispositivo (375/768/1024) | Grep de breakpoints | No cubre tamaños reales | Breakpoints por contenido |
| D-14 | `100vh` en móvil | Grep | Salto por la barra del navegador | `100dvh` |
| D-15 | `margin` negativo para separar columnas | Grep de `margin: -` | Desbordes y solapamientos | `gap` |
| D-16 | Decoración que empuja la tarea principal bajo el fold | Inspección | El usuario no llega a lo importante | Contenido primero |
| D-17 | Carrusel automático | Grep de `setInterval` con carrusel | Mueve el objetivo y rompe 2.2.2 | Manual, con pausa |
| D-18 | Márgenes `margin` colapsando sin control | Inspección | Espaciado impredecible | `gap` o `flow` con `> * + *` |
| D-19 | Anchos y alturas definidos por número, no por `ch`/`rem`/`%` | Grep | No acompaña al texto | Unidades relativas |
| D-20 | Sin `overflow-wrap` en contenido de usuario | Inspección con texto largo | Cadenas sin espacios rompen el layout | `overflow-wrap: anywhere` + `min-width: 0` |

---

## E · Interacción y estados

| ID | Anti-patrón | Detección | Daño | Fix |
| --- | --- | --- | --- | --- |
| E-01 | Estados incompletos: falta `hover`, `active`, `focus-visible` o `disabled` | Enumerar el CSS del control | El usuario no sabe si el control responde | Los cuatro estados, con tokens |
| E-02 | `disabled` solo con `opacity` o solo con `pointer-events: none` | Grep | Sin semántica ni explicación; el teclado sigue entrando | `disabled` real o `aria-disabled` + guarda + motivo visible |
| E-03 | Elemento clicable sin `cursor: pointer` (o al revés) | Inspección | La affordance se pierde o se miente | Cursor coherente con la interactividad real |
| E-04 | `:active` ausente | Grep | Sin confirmación táctil de la pulsación | Feedback inmediato < 100ms |
| E-05 | Doble envío permitido | Pulsar dos veces | Duplicados y operaciones repetidas | Deshabilitar durante el envío, con estado visible |
| E-06 | Acción destructiva sin confirmación ni deshacer | Inspección | Pérdida de datos irreversible | Confirmación específica + deshacer cuando sea posible |
| E-07 | Diálogo destructivo con "Aceptar/Cancelar" | Inspección | El usuario confirma por inercia | Verbo concreto ("Eliminar 3 elementos") y escape visible |
| E-08 | Acciones de fila que solo aparecen en hover | Desconectar el ratón | Inaccesible en táctil y teclado | Siempre visibles o menú explícito |
| E-09 | Tooltip con información esencial | Inspección | Inaccesible en táctil y teclado | Texto visible |
| E-10 | Select nativo reemplazado por divs, perdiendo teclado | Probar con teclado | Inusable | Componente accesible o nativo estilizado con cuidado |
| E-11 | Deshabilitar el botón sin decir qué falta | Inspección | El usuario no sabe cómo avanzar | Habilitar y explicar el error, o indicar el requisito |
| E-12 | Estado de selección solo visual (fila resaltada) | Inspección con lector | El usuario no sabe qué está seleccionado | `aria-selected` / `aria-checked` |
| E-13 | Interacción que solo funciona con ratón (arrastrar, clic derecho, rueda) | Probar con teclado | Inaccesible | Alternativas por teclado y botones |
| E-14 | Feedback que depende de la posición del cursor | Inspección | Se pierde fuera del ratón | Feedback en el elemento o en región viva |

---

## F · Formularios

| ID | Anti-patrón | Detección | Daño | Fix |
| --- | --- | --- | --- | --- |
| F-01 | Validación solo al enviar | Inspeccionar el handler | El usuario descubre todos los errores al final | Validar en `blur` y en el envío |
| F-02 | Errores agrupados arriba, sin vínculo con el campo | Inspección | Hay que buscarlos | Mensaje junto al campo + `aria-describedby` |
| F-03 | Pérdida de los datos introducidos al fallar | Forzar un error | Frustración y abandono | Conservar siempre el valor |
| F-04 | Mensaje genérico ("Error", "Datos inválidos") | Grep de literales | El usuario no sabe qué corregir | Qué falló, por qué y cómo arreglarlo |
| F-05 | Campos obligatorios solo con `*` sin leyenda | Inspección | Ambigüedad | Palabra "obligatorio" o marcar los opcionales |
| F-06 | Requisitos de formato no indicados antes de fallar | Inspección | Ensayo y error | Pista persistente junto al campo |
| F-07 | `autocomplete` deshabilitado o ausente | Grep | Fricción y peor seguridad | `autocomplete` correcto por campo |
| F-08 | `type` incorrecto (`text` para email o teléfono) | Grep | Sin teclado adecuado ni validación nativa | `type` y `inputmode` correctos |
| F-09 | Máscara que impide pegar o editar | Probar pegado | Bloquea el gestor de contraseñas y el flujo normal | Formatear al perder el foco, no al teclear |
| F-10 | Validación en vivo que marca error mientras se escribe | Inspección | Sensación de regaño | Validar en `blur`, no en cada tecla |
| F-11 | Campo numérico para teléfono o código postal | Grep de `type="number"` | Pierde ceros a la izquierda y muestra flechas inútiles | `type="text" inputmode="numeric"` |
| F-12 | Wizard que pierde el progreso al recargar | Recargar | Repetición de trabajo | Persistir borrador |
| F-13 | Datos ya introducidos vueltos a pedir | Inspección | Fricción evitable (3.3.7) | Prerrellenar |
| F-14 | Layout de formulario en dos columnas con lectura en Z | Inspección | Orden de lectura confuso | Una columna, o columnas por grupo semántico |

---

## G · Estados de datos (los 5 estados)

| ID | Anti-patrón | Detección | Daño | Fix |
| --- | --- | --- | --- | --- |
| G-01 | Pantalla en blanco cuando no hay datos | Forzar lista vacía | El usuario cree que está roto | Empty state guiado |
| G-02 | "No hay datos" sin acción | Inspección | El usuario queda sin salida | Explicar por qué está vacío y ofrecer la acción primaria |
| G-03 | Spinner de página completa para una región | Inspección | Bloquea toda la interfaz | Skeleton local, contenido visible conservado |
| G-04 | Skeleton sin reservar el espacio final | Inspeccionar CLS | Salto de layout al cargar | Dimensiones equivalentes al contenido real |
| G-05 | Carga sin texto de estado | Inspección con lector | No se anuncia nada | `role="status"` + texto |
| G-06 | Error sin acción de recuperación | Inspección | Callejón sin salida | Reintentar, volver, o explicar el siguiente paso |
| G-07 | Sin estado de error de red | Desconectar | Pantalla congelada | Estado explícito con reintento |
| G-08 | Tabla vacía sin cabeceras ni contexto | Inspección | No se entiende qué falta | Mantener estructura y explicar |
| G-09 | Lista larga sin paginación ni virtualización | Cargar 10.000 filas | Congelación | Paginación, scroll infinito o virtualización |
| G-10 | Números/distas/fechas sin `Intl` | Grep de concatenación de fechas | Formatos incorrectos por locale | `Intl.NumberFormat` / `DateTimeFormat` |
| G-11 | Sin soporte RTL / i18n | Buscar `margin-left` direccional | Se rompe en árabe/hebreo | Propiedades lógicas (`margin-inline-start`) |
| G-12 | Valores extremos sin formato (9999999, NaN, 00:00) | Probar datos extremos | Parece roto | Formateo, truncado con acceso al valor y `—` para ausente |
| G-13 | Sin estado "cargando más" separado del vacío | Inspección | El usuario no sabe si terminó | Estado distinto y explícito |
| G-14 | Skeleton eterno cuando la petición falla | Inspección | Miente indefinidamente | Timeout con estado de error |

---

## H · Feedback, errores y recuperación

| ID | Anti-patrón | Detección | Daño | Fix |
| --- | --- | --- | --- | --- |
| H-01 | Toast para un error crítico | Inspección | Desaparece antes de leerse y no es accesible | Error persistente en contexto |
| H-02 | Toast sin pausa y sin región viva | Grep de `setTimeout` | El usuario no llega a leerlo | Duración configurable, `role="status"`, pausa al foco |
| H-03 | `alert()` / `confirm()` nativos | Grep | Bloquea, no es estilizable ni consistente | Diálogo del sistema |
| H-04 | Confirmación de éxito antes de que la operación termine | Inspección | El usuario cree que se guardó | Confirmar tras la respuesta, o indicar "en curso" |
| H-05 | Operación > 1s sin indicador de progreso | Medir | El usuario repite la acción | Progreso visible tras 1s |
| H-06 | Operación > 10s sin cancelar | Inspección | El usuario queda atrapado | Cancelación y progreso |
| H-07 | Mensaje que culpa al usuario | Grep de "Has introducido mal" | Vergüenza y abandono | Neutro y orientado a la solución |
| H-08 | Mensaje con códigos internos o trazas | Grep de `Error:` | Incomprensible e inseguro | Traducir a lenguaje humano, registrar el detalle |
| H-09 | Sin estado vacío específico tras filtrar o buscar | Buscar sin resultados | Parece que no hay datos en absoluto | "Sin resultados para X" + limpiar filtros |
| H-10 | Acción sin confirmación perceptible | Inspección | El usuario repite por duda | Confirmación explícita o cambio de estado visible |

---

## I · Movimiento y animación

| ID | Anti-patrón | Detección | Daño | Fix |
| --- | --- | --- | --- | --- |
| I-01 | Duración > 500ms en una interacción | Grep de `transition`/`animation` | Se percibe lento y roto | 150–300ms en interacción; 400ms solo en transiciones de superficie |
| I-02 | Animación de entrada en cada sección al hacer scroll | Inspección | Retrasa el contenido y marea | Sin animación por defecto; opcional y sutil |
| I-03 | Scrolljacking (secuestro del scroll) | Inspección | Rompe la expectativa y el rendimiento | Scroll nativo |
| I-04 | Parallax pesado | Inspección | Mareo y caídas de FPS | Fuera, o muy sutil y con `prefers-reduced-motion` |
| I-05 | Animar `width`, `height`, `top`, `left`, `margin` | Grep | Layout thrashing | Animar `transform` y `opacity` |
| I-06 | Animar `backdrop-filter` | Grep | Recompone el blur en cada frame | Animar solo `opacity` de una capa ya difuminada |
| I-07 | Animación decorativa infinita (`animation-iteration-count: infinite`) | Grep | Distrae y consume batería | Solo si comunica progreso |
| I-08 | Movimiento que bloquea la interacción durante la animación | Inspección | Impaciencia y errores | Permitir interacción inmediata |
| I-09 | `will-change` en todo | Grep | Memoria de GPU desperdiciada | Solo en elementos que realmente animan |
| I-10 | Transición de `display`/`content` sin `@starting-style` | Inspección | Aparece de golpe | `@starting-style` + `transition-behavior: allow-discrete` |
| I-11 | Curvas de easing distintas por componente | Grep de `cubic-bezier` | Movimiento incoherente | Tres curvas de token |
| I-12 | Animación que ignora `prefers-reduced-motion` | Grep | Accesibilidad y confort | Degradar duración |

---

## J · Tokens, CSS y arquitectura de estilos

| ID | Anti-patrón | Detección | Daño | Fix |
| --- | --- | --- | --- | --- |
| J-01 | Valores mágicos fuera de la hoja de tokens | Grep de `px`, `#`, `ms`, `cubic-bezier` en componentes | El sistema no se puede cambiar en un sitio | Tokens |
| J-02 | Estilos en línea (`style="..."` o `style={{...}}`) | Grep de `style=` | Rompe tema, cascada y mantenimiento | Clase + token |
| J-03 | `!important` | Grep | Guerra de especificidad; el tema deja de funcionar | `@layer` y especificidad bien construida |
| J-04 | `z-index: 9999` o valores arbitrarios | Grep de `z-index` | Apilamiento impredecible | Escala de z-index y contextos de apilamiento |
| J-05 | Dark mode duplicando bloques de reglas | Buscar un segundo bloque con los mismos selectores | Doble mantenimiento y divergencia | Reasignar tokens semánticos |
| J-06 | Primitivos consumidos directamente en un componente | Grep de `--prim-` fuera de la capa semántica | Theming roto | Capa semántica |
| J-07 | Token explosion: un token por componente y variante sin semántica | Contar tokens | El sistema deja de ser un sistema | Tres capas y roles reales |
| J-08 | Dos tokens con el mismo valor y distinto nombre | Auditar duplicados | Divergen con el tiempo | Un token, un rol |
| J-09 | Tokens huérfanos nunca usados | Auditar uso | Deuda y confusión | Eliminar |
| J-10 | Nombres por valor (`--padding-17px`, `--color-blue`) | Grep | El nombre miente al cambiar el valor | Nombre por rol |
| J-11 | Falta la capa de componente: todo se sobrescribe desde fuera | Inspección | El consumidor rompe el componente | Variables de componente con fallback |
| J-12 | Reglas globales que imponen layout (`* { margin: 0 }` mal usado, `* { box-sizing }` sin criterio) | Grep de `*` | Efectos colaterales difíciles de rastrear | Reset explícito y acotado |
| J-13 | Anidación de selectores > 3 niveles o clases encadenadas | Grep | Fragilidad | BEM/utility o capas |
| J-14 | CSS duplicado entre componentes | Buscar bloques idénticos | Divergencia visual | Extraer al sistema |
| J-15 | Figma y CSS con valores distintos | Comparar | La implementación nunca coincide con el diseño | Tokens compartidos (DTCG) |
| J-16 | Sin documentación del componente (tokens que consume, props, estados, a11y) | Inspección | Cada uso reinventa el componente | Ficha de componente |
| J-17 | `box-sizing: content-box` por defecto sin reset | Grep | Cálculos de ancho impredecibles | `border-box` |
| J-18 | Unidades mezcladas sin criterio (`px` para texto, `rem` para bordes) | Grep | Escalado inconsistente | `rem` para lo que escala, `px` para bordes de 1px |
| J-19 | Fichero de tokens duplicado por app o por tema | Buscar copias | Deriva entre productos | Un paquete de tokens publicado |

---

## K · Componentes y su API

| ID | Anti-patrón | Detección | Daño | Fix |
| --- | --- | --- | --- | --- |
| K-01 | Props booleanas explosivas (`isPrimary`, `isLarge`, `isDanger`, `isGhost`…) | Contar props | Estados imposibles e inconsistentes | `variant` / `size` / `tone` como uniones cerradas |
| K-02 | El componente acepta un `color` arbitrario | Grep de `color?: string` | El sistema pierde control del contraste | `tone` semántico |
| K-03 | Variantes que se adivinan por CSS (`:has`, posición, orden) | Inspección | Frágil y opaco | Variante explícita |
| K-04 | Componente sin estados internos (carga, error, vacío) | Inspección | Cada consumidor los reimplementa distinto | Estados en el componente |
| K-05 | Estado derivado duplicado en props y en estado interno | Inspección | Divergencia | Una fuente de verdad |
| K-06 | Composición por configuración en vez de por children/slots | Contar props | El componente crece sin límite | Composición |
| K-07 | Componente gigante que hace de página | Medir el archivo | Imposible de testear y reutilizar | Dividir en moléculas |
| K-08 | Estilos que se filtran del componente al exterior | Inspección | Rompe consumidores | Estilos encapsulados |
| K-09 | Reimplementar un primitivo nativo peor (select, checkbox, dialog) | Inspección | Se pierde accesibilidad gratis | Nativo primero |
| K-10 | Componente sin `forwardRef` / sin reenvío de props al DOM | Inspección | Rompe el consumidor que necesita foco o `id` | Reenvío explícito |
| K-11 | Átomos que conocen el dominio (`<UserAvatarCardWithBadge>`) | Inspección | No reutilizable | Genérico arriba, específico en la molécula |
| K-12 | Dependencia entre componentes hermanos por contexto implícito | Inspección | Acoplamiento oculto | Props explícitas o contexto documentado |

---

## L · Contenido, confianza y dark patterns — INNEGOCIABLE

| ID | Anti-patrón | Detección | Daño | Fix |
| --- | --- | --- | --- | --- |
| L-01 | Roach motel: fácil suscribirse, difícil darse de baja | Recorrer el flujo de baja | Daño directo al usuario; ilegal en varias jurisdicciones | Baja tan fácil como el alta |
| L-02 | Confirmshaming ("No, prefiero seguir pagando de más") | Leer el microcopy | Manipulación | Opciones neutras |
| L-03 | Sneak into basket (añadir productos no pedidos) | Inspección del carrito | Fraude percibido | Consentimiento explícito |
| L-04 | Urgencia falsa (contadores, "3 personas viendo esto") | Grep de temporizadores decorativos | Presión y desconfianza | Solo datos reales |
| L-05 | Privacy zuckering (compartir por defecto) | Inspección de consentimiento | Incumplimiento legal | Opt-in explícito |
| L-06 | Casilla preseleccionada para aceptar o suscribirse | Inspección | Consentimiento inválido | Vacía por defecto |
| L-07 | Botón de cancelar oculto, gris claro o más pequeño | Inspección | Trampa de diseño | Mismo peso visual y tamaño |
| L-08 | Modal de newsletter al entrar | Inspección | Interrupción antes de la tarea | Nunca al entrar; tras valor obtenido |
| L-09 | Cookie wall sin "rechazar todo" equivalente | Inspección | Incumplimiento legal | Rechazar con el mismo esfuerzo |
| L-10 | Microcopy que culpabiliza o mete miedo | Leer textos de error y de baja | Estrés y desconfianza | Neutro y respetuoso |
| L-11 | Texto legal ilegible por diseño (gris claro, 10px) | Medir | Oscurecimiento deliberado | Mismo estándar de legibilidad |
| L-12 | Confirmación destructiva con la opción segura en gris | Inspección | Errores irreversibles | La opción segura es la primaria |
| L-13 | Contadores o pruebas sociales inventadas | Inspección | Fraude | Datos verificables |
| L-14 | Bloquear el botón atrás o la salida | Inspección | Secuestro del navegador | Nunca |

**Regla:** ante un dark pattern no hay "compromiso", no hay "es una decisión de
negocio" y no hay implementación. Se nombra (`L-01`), se explica el daño y el
riesgo legal, y se ofrece la alternativa honesta que consigue el objetivo real.

---

## M · Glassmorphism

| ID | Anti-patrón | Detección | Daño | Fix |
| --- | --- | --- | --- | --- |
| M-01 | Glass inflation: todas las superficies son translúcidas | Contar `backdrop-filter` | Ruido, jerarquía plana, coste de GPU | Glass solo en superficies flotantes sobre contenido |
| M-02 | `blur()` > 24px por estética | Grep de `blur(` | Coste alto y pérdida de contexto | 12–20px según función |
| M-03 | Glass sobre glass | Anidación de `backdrop-filter` | El blur se compone y se ensucia | Una sola capa de glass por zona |
| M-04 | Texto pequeño sobre glass sin scrim | Medir el contraste real | Ilegible sobre fondos claros u oscuros | Scrim o superficie sólida tras el texto |
| M-05 | Glass en tablas, formularios o superficies de lectura | Inspección | Fatiga y contraste inestable | Superficie sólida |
| M-06 | Glass sin fallback | Grep de `backdrop-filter` sin `@supports` | En navegadores sin soporte queda un panel casi transparente | `@supports` con fondo sólido |
| M-07 | Glass sobre fondo variable (vídeo, carrusel, imagen rotativa) | Inspección | El contraste cambia en cada frame | Scrim fijo o superficie sólida |
| M-08 | Glass como indicador de estado (disabled, seleccionado) | Inspección | Ambigüedad y contraste insuficiente | Estados con tokens propios |
| M-09 | Falta `-webkit-backdrop-filter` | Grep | Safari muestra un panel plano y sucio | Ambas propiedades |
| M-10 | Falta el borde de 1px | Inspección | El borde del panel se pierde y flota mal | `--glass-border` |
| M-11 | Animar `backdrop-filter` | Grep de `transition: backdrop-filter` | Recompone el blur cada frame | Animar `opacity`/`transform` |
| M-12 | Sin `prefers-reduced-transparency` ni `prefers-contrast` | Grep del media query | Ignora una preferencia del sistema | Degradar a superficie sólida |
| M-13 | Glass como sustituto de jerarquía | Inspección | Sin profundidad real, solo textura | Jerarquía por elevación y color |
| M-14 | Glass en modo `forced-colors` | Inspección | Contraste destruido | Forzar `Canvas`/`CanvasText` |
| M-15 | Ancestro con `opacity < 1`, `filter`, `mask`, `clip-path` o `will-change` de esos | Grep en el árbol de ancestros del panel | Crea un *backdrop root* y **trunca** el blur: el efecto no se ve | Quitar el trigger del ancestro, no subir el blur |
| M-16 | Promoción especulativa de capa (`transform: translateZ(0)`, `will-change` en todo) | Grep de `translateZ(0)` / `will-change` | Memoria de GPU y rasterizado a escala incorrecta | Promocionar solo con medición |
| M-17 | `backdrop-filter` con descendientes `position: fixed`/`absolute` | Inspección | Crea containing block: el descendiente se posiciona respecto al panel, no al viewport | Sacar el descendiente del subárbol glass |
| M-18 | Overlay oculto con `opacity: 0` que conserva `backdrop-filter` | Grep de `opacity: 0` junto a glass | Safari 26 muestrea los estilos de elementos fixed/sticky y tiñe la barra del navegador | `display: none` real |
| M-19 | `overflow: hidden` en `html`/`body` con cabecera glass fija | Grep | Rompe el viewport y el chrome en iOS | Scroll en el contenedor del shell, no en `body` |

**Presupuesto de rendimiento:** cada `backdrop-filter` cuesta una pasada de render
extra. En la práctica: **≤ 3 superficies glass concurrentes por viewport** y
`blur()` ≤ 12–16px por defecto (24px solo en overlay a pantalla completa).
Superarlo no es "más elegante", es una caída de FPS en gama media.

---

## N · Material Design

| ID | Anti-patrón | Detección | Daño | Fix |
| --- | --- | --- | --- | --- |
| N-01 | Usar la paleta de referencia (`md.ref.palette.primary40`) en vez del rol (`md.sys.color.primary`) | Grep de `ref.palette` en componentes | Dynamic color y temas rotos | Tokens de sistema |
| N-02 | Sombras de M2 sobre superficies de M3 | Mezclar `elevation` de sombra con tintes tonales | Profundidad incoherente | Elevación por tinte tonal en M3 |
| N-03 | Elevation inflation: todo elevado | Contar niveles | Nada destaca; ruido | Solo lo que flota de verdad |
| N-04 | FAB para acciones destructivas, o varios FAB | Inspección | Acción principal ambigua | Un FAB, una acción primaria positiva |
| N-05 | `on-surface` sobre `primary-container` | Inspeccionar el par | Contraste insuficiente | Par `on-*` correspondiente |
| N-06 | Target menor de 48dp | Medir | Errores de pulsación | 48dp (Material) / 44px (WCAG) / 24px mínimo AA |
| N-07 | Ignorar las state layers | Grep de `:hover { background: ... }` con color propio | Estados fuera del sistema | State layer con token de opacidad |
| N-08 | Dynamic color con colores fijos en el componente | Grep de hex | El tema del usuario no se aplica | Roles `md.sys.color.*` |
| N-09 | Tipografía `display` para cuerpo o `label` para títulos | Inspeccionar mapeo | Jerarquía y legibilidad rotas | Rol tipográfico correcto |
| N-10 | M3 Expressive en un producto denso (IDE, tabla, panel financiero) | Inspección | Ruido y pérdida de densidad útil | Contención; densidad adaptada |
| N-11 | Densidad no adaptada: interfaz de escritorio con tokens táctiles | Medir la fila | Desperdicio de espacio y scroll | Tokens de densidad |
| N-12 | Iconos y patrones de otra plataforma mezclados | Inspección | Inconsistencia (Ley de Jakob) | Un solo lenguaje |
| N-13 | Snackbar con acción destructiva o crítica | Inspección | Desaparece antes de decidir | Diálogo |
| N-14 | Bottom sheet para tareas largas o formularios extensos | Inspección | Incómodo y con scroll atrapado | Pantalla completa |

---

## O · Modas y trampas recurrentes

| ID | Anti-patrón | Detección | Daño | Fix |
| --- | --- | --- | --- | --- |
| O-01 | Toda la navegación primaria escondida tras un icono | Inspección | El icono **ya es reconocible** (NN/g, 2025), pero ocultar toda la navegación primaria sigue costando engagement, tasa de éxito y tiempo de tarea (NN/g: 44% de uso frente a 89% con navegación visible o combinada) | Exponer 4–5 opciones de primer nivel y colapsar solo lo secundario |
| O-02 | Neumorphism con bajo contraste | Medir | Controles invisibles | Bordes y contraste reales |
| O-03 | Gradiente que manda sobre la jerarquía | Inspección | El ojo va al color, no a la tarea | Jerarquía tipográfica y espacial |
| O-04 | Emojis como iconos funcionales | Grep | Renderizado inconsistente y sin significado accesible | Set de iconos con `aria-label` |
| O-05 | Librería de animaciones decorativas (`animate.css` y similares) | Grep | Ruido y rendimiento | Movimiento con propósito |
| O-06 | "Mystery meat navigation" (iconos sin etiqueta) | Inspección | Nadie sabe qué hace | Etiqueta o tooltip accesible |
| O-07 | Dashboard que muestra todo a la vez | Contar bloques | No hay foco; nadie lo usa | Una pregunta por pantalla |
| O-08 | Scroll reveal que oculta contenido | Desactivar JS | Contenido invisible | Contenido visible por defecto |
| O-09 | Tipografía gigante que rompe el ritmo de lectura | Medir | El usuario hace más scroll y lee menos | Escala fluida con `clamp()` |
| O-10 | Bento grid sin jerarquía | Inspección | Bloques bonitos sin prioridad | Tamaño proporcional a la importancia |
| O-11 | Personalización por encima de la tarea | Inspección | Complejidad sin valor | Valores por defecto excelentes |
| O-12 | IA generativa como única vía para una tarea determinista | Inspección | Resultado no reproducible | Control directo disponible |
| O-13 | Glass y 3D por moda sin función | Inspección | Coste sin beneficio | Solo si resuelve algo |
| O-14 | Dark mode "porque sí" sin adaptar tokens | Inspección | Contraste roto | Tema real con tokens |
| O-15 | Modales en cascada (modal sobre modal) | Inspección | Desorientación | Navegación en el mismo diálogo |
| O-16 | Placeholder "coming soon" como entrega | Inspección | Promesa vacía | No publicar, o explicar el estado |

---

## P · Responsive, adaptativo y mobile-first

Ver [10-responsive-adaptive-mobile-first.md](10-responsive-adaptive-mobile-first.md)
para los patrones correctos y la matriz de pruebas.

| ID | Anti-patrón | Detección | Daño | Fix |
| --- | --- | --- | --- | --- |
| P-01 | `user-scalable=no` o `maximum-scale=1` en el viewport | Grep del `<meta name="viewport">` | Impide ampliar; falla 1.4.4 | `width=device-width, initial-scale=1` |
| P-02 | Breakpoints copiados de un framework (375/768/1024) | Grep de media queries | No corresponden a dónde se rompe el contenido | Breakpoints por contenido |
| P-03 | Estrategia desktop-first con `max-width` | Grep | El móvil hereda la complejidad del escritorio | `min-width` y mobile-first |
| P-04 | `100vh` | Grep | Salto por la barra del navegador móvil | `100dvh` o `100svh` |
| P-05 | Contenido esencial oculto en móvil con `display: none` | Grep dentro de media queries | Funcionalidad perdida en el dispositivo más usado | Reorganizar, no esconder |
| P-06 | Tabla de datos sin estrategia responsive | Inspección | Scroll horizontal o filas ilegibles | Patrón elegido y documentado |
| P-07 | `:hover` sin guarda de puntero | Grep de `:hover` fuera de `@media (hover: hover)` | Estados que se quedan pegados en táctil | Envolver en `@media (hover: hover)` |
| P-08 | Hover como única señal de interactividad en táctil | Inspección en dispositivo | Información inaccesible | Estado persistente, o foco y clic |
| P-09 | Imagen sin `srcset`/`sizes`, o `sizes` incorrecto | Grep de `<img>` | Se descarga la resolución de escritorio en móvil | `srcset` + `sizes` coherentes |
| P-10 | `position: fixed` que depende del viewport | Inspección con el teclado abierto | El elemento salta o queda oculto | Anclar al contenedor de scroll |
| P-11 | Control con `font-size` menor de 16px | Grep | La letra queda pequeña para el dedo y muchos navegadores móviles amplían la página al enfocar el campo (comportamiento ampliamente observado, **no** documentado por Apple) | ≥ 1rem en controles |
| P-12 | Sin `env(safe-area-inset-*)` | Grep | Contenido bajo el notch o la barra de gestos | `viewport-fit=cover` + padding con `env()` |
| P-13 | Bloquear la orientación | Grep o manifiesto | Impide usar el dispositivo en horizontal | Soportar ambas orientaciones |
| P-14 | Media queries redundantes o duplicadas | Grep | Mantenimiento y peso | Un conjunto único y ordenado |
| P-15 | `width: 100vw` | Grep | Scroll horizontal por la barra de desplazamiento | `width: 100%` |
| P-16 | `overflow: hidden` en `html`/`body` | Grep | Rompe el scroll y el viewport en iOS | Scroll en el contenedor del shell |
| P-17 | Servir layout distinto según el user-agent | Grep | Frágil y condenado a fallar | Feature queries y container queries |
| P-18 | Alturas fijas en contenedores de texto | Grep de `height:` | Recorta con el escalado de texto del sistema o el zoom | `min-height` + contenido |
| P-19 | Interacción disponible solo por gesto | Inspección | Inaccesible con movilidad reducida (SC 2.5.7) | Alternativa por botón |
| P-20 | No comprobar reflow a 320px ni zoom al 200% | Proceso | Reflow roto (SC 1.4.10) | Prueba obligatoria |
| P-21 | Ocultar el desbordamiento con `overflow-x: hidden` | Grep | Esconde el síntoma y también el contenido | Arreglar la causa |
| P-22 | Validar solo con emulación de escritorio | Proceso | No detecta safe areas, teclado virtual ni gestos | Matriz de pruebas real |
| P-23 | `font-size` en `vw` sin `clamp()` | Grep de `vw` en `font-size` | Técnica de fallo **F94** de WCAG 1.4.4: el texto no responde al zoom | `clamp()` con mínimo y máximo en `rem` |
| P-24 | Breakpoints en `px` sobre un sistema en `rem` | Grep de media queries | El zoom del usuario cruza el corte por sorpresa | Mismo sistema de unidades |

---

## Q · Rendimiento y Core Web Vitals

Ver [11-rendimiento-y-core-web-vitals.md](11-rendimiento-y-core-web-vitals.md)
para los umbrales, los subcomponentes de cada métrica y los fixes.

| ID | Anti-patrón | Detección | Daño | Fix |
| --- | --- | --- | --- | --- |
| Q-01 | `loading="lazy"` en el elemento del LCP | Marcado y posición en el viewport | Retrasa el descubrimiento del recurso más importante | Lazy solo bajo el pliegue |
| Q-02 | Imágenes o iframes sin dimensiones | Marcado y CSS | CLS al cargar | `width`/`height` + `aspect-ratio` |
| Q-03 | `font-display` ausente o `auto` | `@font-face` | Texto invisible (FOIT) y salto al intercambiar | `swap` u `optional` + overrides de métricas |
| Q-04 | `<script>` sincrónico en el `<head>` | Marcado; render-blocking requests | Bloquea el parser y el render | `defer` o `async` |
| Q-05 | Terceros sin inventario ni control | Waterfall por dominio | CPU y ancho de banda ajenos que retrasan la interacción | Inventario, *facade* tras la interacción |
| Q-06 | Animar `width`/`height`/`top`/`left`/`margin` | Transiciones y `@keyframes` | Layout y pintado por frame; CLS | Animar `transform` y `opacity` |
| Q-07 | Sombras y filtros animados en áreas grandes | CSS | Pintado costoso; caída de FPS | Animar una capa ya compuesta |
| Q-08 | Listas o DOM enormes sin virtualizar | Tamaño del DOM | Estilo y layout caros; INP alto | Virtualización |
| Q-09 | `setInterval` decorativo (contadores, polling, carrusel) | Grep de `setInterval` | Tareas largas periódicas | Eliminar, o pausar cuando no se ve |
| Q-10 | CSS sin purgar ni dividir | Coverage | Render blocking innecesario | Purgar, dividir, CSS crítico |
| Q-11 | Leer `offsetHeight`/`getBoundingClientRect` en bucle tras escribir estilos | *Forced reflow* en DevTools | Layout síncrono por iteración | Agrupar lecturas y escrituras |
| Q-12 | Listeners de `scroll`/`touchmove`/`wheel` sin `{ passive: true }` | Código | Bloquea el scroll compuesto | `{ passive: true }` |
| Q-13 | Handler de `scroll` sin `requestAnimationFrame` ni observador | Código | Trabajo en cada frame | rAF, throttle o `IntersectionObserver` |
| Q-14 | `sizes` irreal | Atributos y waterfall | Descarga sobredimensionada; anula el `srcset` | `sizes` que describa el ancho real |
| Q-15 | Contenido inyectado arriba (banner, cookies, aviso) | Inspección | CLS | Reservar el espacio por adelantado |
| Q-16 | Listas largas sin `content-visibility` ni contención | CSS | Render inicial evitable | `content-visibility: auto` |
| Q-17 | Hidratar islas no interactivas | Traza de CPU | CPU en la carga; *input delay* | Hidratación parcial |
| Q-18 | Importar el paquete completo (iconos, utilidades, fechas) | Bundle analyzer | Peso y parse evitables | Importaciones específicas |
| Q-19 | `content-visibility` sin `contain-intrinsic-size` | CSS | Saltos de scrollbar peores que el problema | Añadir `contain-intrinsic-size` |
| Q-20 | Dos frameworks o dos versiones de la misma librería | Bundle analyzer y red | Parse y ejecución duplicados | Una sola versión |
| Q-21 | `will-change` permanente en muchos elementos | Grep | Memoria de GPU retenida | Solo durante la animación |
| Q-22 | Sin presupuesto de rendimiento en CI | Proceso | La regresión entra sin que nadie la vea | Lighthouse CI con aserciones |

---

## R · Técnica: HTML, CSS y JavaScript

Ver [12-revision-tecnica-html-css-js.md](12-revision-tecnica-html-css-js.md) para
el detalle y los patrones correctos.

| ID | Anti-patrón | Detección | Daño | Fix |
| --- | --- | --- | --- | --- |
| R-01 | `div`/`span` donde existe el elemento nativo | Inspección del marcado | Sin rol, sin teclado, sin semántica | Elemento nativo (`button`, `a`, `details`, `dialog`, `table`) |
| R-02 | `<a href="#">` como botón, o `<button>` que navega | Grep | Menú contextual, teclado y comportamiento inesperados | `<a>` navega; `<button>` actúa |
| R-03 | Landmarks ausentes o duplicados | Inspección | Navegación por regiones rota | `header`/`nav`/`main`/`footer` únicos |
| R-04 | Tabla sin `caption`, sin `scope` ni `<th>` | Inspección | El lector no asocia celda y cabecera | `<caption>` + `scope="col\|row"` |
| R-05 | Grupo de controles sin `fieldset`/`legend` | Inspección | El grupo no se anuncia | `<fieldset>` + `<legend>` |
| R-06 | `innerHTML` o `dangerouslySetInnerHTML` con datos del usuario | Grep | XSS | `textContent`, o saneado explícito |
| R-07 | `target="_blank"` sin `rel="noopener noreferrer"` | Grep | La página destino controla `window.opener` | Añadir `rel` |
| R-08 | Listener, timer u observador huérfano | Grep de `addEventListener`/`setInterval`/`*Observer` sin su baja | Fugas de memoria y handlers sobre nodos muertos | `AbortController`, `clear*`, `disconnect()` |
| R-09 | `fetch` sin `AbortController` | Grep | Respuestas tardías que pisan estado nuevo | Abortar al desmontar |
| R-10 | Condición de carrera en la carga de datos | Dos peticiones que pueden resolverse en cualquier orden | Se muestra el dato equivocado | Cancelar la anterior, o "la última gana" |
| R-11 | `catch` vacío o error silenciado | Grep de `catch {}` | Interfaz congelada sin diagnóstico | Manejar o propagar |
| R-12 | Anidación de selectores mayor de 3 niveles | Grep | Selector frágil y difícil de sobrescribir | BEM, utilidades o `@layer` |
| R-13 | Especificidad innecesaria, sin `@layer` | Inspección | Guerra de especificidad; el tema no se puede sobrescribir | `@layer` + `:where()` |
| R-14 | Reglas globales que imponen layout | Grep de `* { }` o selectores de elemento | Efectos colaterales difíciles de rastrear | Reset acotado y estilos por componente |
| R-15 | Textos concatenados para i18n | Grep de `+` con literales visibles | Traducción imposible o gramática rota | Diccionario con claves y `Intl` |
| R-16 | Propiedades físicas en vez de lógicas | Grep de `margin-left`/`margin-right` en layout | RTL roto | `margin-inline-start`/`end` |
| R-17 | Contenido esencial que depende de JavaScript | Desactivar JS | Página en blanco | Renderizado en servidor o HTML real |
| R-18 | Sin `lang` o sin `dir` | Inspección | Pronunciación y traducción automática rotas | `lang` en `html` |
| R-19 | Lógica duplicada entre componentes | Buscar bloques casi idénticos | Divergen con el tiempo | Extraer al sistema |

---

## Protocolo de rechazo

Cuando el material auditado — o una instrucción directa del usuario — pide uno
de estos patrones, el agente **no lo implementa en silencio y no lo implementa
"un poco"**. Actúa así:

### Paso 1 · Nombrar

Cita el identificador y el daño en una línea: *"Esto es `J-03` (`!important`) y
`B-01` (gris #999 sobre blanco, 2.85:1). Rompe el tema y no pasa AA."*

### Paso 2 · Clasificar la resistencia

| Nivel | Qué entra | Comportamiento |
| --- | --- | --- |
| **1 · Innegociable** | Categoría **A** (accesibilidad) — incluida **P-01** (`user-scalable=no`) y **P-20** (reflow y zoom) —, categoría **L** (dark patterns), pérdida de datos, seguridad (**R-06**, **R-07**) y cualquier cosa que incumpla WCAG 2.2 AA / EAA | **No se implementa.** Ni con excepción, ni con mitigación, ni con una nota. Se explica y se ofrece la alternativa. Si el usuario insiste, se detiene y lo dice con claridad. |
| **2 · Rechazo firme** | Categorías **B** y **M** en lo que afecta a legibilidad, **F-03**, **H-01**, **K-01**, **J-01/02/03/04**, **P-03/P-04/P-05/P-09/P-11**, **Q-01/Q-02/Q-03/Q-04**, **R-08/R-09/R-17** | Se explica el daño y **se entrega la alternativa correcta ya implementada**. Solo se implementa el anti-patrón si el usuario, tras la explicación, lo decide como dueño del producto **y** se cumplen las tres condiciones de la excepción. |
| **3 · Preferencia** | Modas (categoría **O**), pulido, decisiones estéticas sin impacto medible | Se señala con su coste, se recomienda, y se implementa si el usuario lo decide. Sin sermón. |

### Paso 3 · Ofrecer la alternativa

Toda negativa trae el camino que consigue **la intención real** del usuario (que
el panel destaque, que el botón se sienta moderno, que el formulario sea corto).
Una negativa sin alternativa es una obstrucción, no una auditoría.

### Paso 4 · Excepción documentada (solo niveles 2 y 3)

Cuando el dueño del producto decide mantener el patrón, la excepción debe
cumplir **las tres** condiciones:

1. **Registrada** en el informe, con su ID y su severidad, marcada como deuda
   consciente. Nunca desaparece del informe por haber sido aceptada.
2. **Mitigada** con lo mínimo que reduzca el daño (fallback, texto adicional,
   `aria-label`, contraste corregido, `prefers-reduced-motion`).
3. **Marcada en el código**, junto al valor, con el motivo y la fecha:

```css
/* ux-ui-audit: excepción M-02 (blur 32px) — decisión de producto 2025-01-30.
   Mitigación: scrim sólido bajo el texto y fallback opaco en @supports. */
```

El nivel 1 **no tiene paso 4**. No existe una excepción documentada para un
contraste que no se lee, un foco eliminado o un dark pattern.

### Paso 5 · No fingir neutralidad

El agente no escribe "por un lado… por otro lado…". Escribe el veredicto: qué
está mal, cuánto duele, qué se hace. La cortesía está en la precisión, no en la
ambigüedad.

---

## Lo que este registro NO es

- No es una lista de gustos. Cada entrada tiene una consecuencia observable.
- No es un catálogo para vomitar en el informe: se citan **solo los hallazgos
  presentes en el material auditado**, con archivo y línea.
- No sustituye al juicio: una excepción bien razonada y mitigada se registra, no
  se dramatiza. Un patrón de nivel 1 no se negocia nunca.
