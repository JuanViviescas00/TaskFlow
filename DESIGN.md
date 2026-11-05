# DESIGN.md — Especificación Visual de TASKFLOW

## 1. Concepto Visual
- **Metáfora estética:** *Flat Enterprise XY Grid* (Centro de comando asíncrono inspirado en Linear, Stripe y Vercel Dashboard).
- **Filosofía:** Superficies planas de alta precisión, cero degradados (`linear-gradient` / `radial-gradient` prohibidos), alineación bidimensional rigurosa en los ejes X e Y con retícula de 8 puntos (`4px` / `8px`), y retroalimentación en tiempo real mediante micro-interacciones sólidas.

---

## 2. Paleta de Colores Funcional (`:root`)

### Fondos y Superficies (Canvas & Layers)
| Token CSS | Valor Hex | Función |
|---|---|---|
| `--bg-app` | `#f8fafc` | Lienzo principal de la aplicación (Slate 50) |
| `--bg-surface` | `#ffffff` | Contenedores elevados, paneles, tablas y tarjetas |
| `--bg-subtle` | `#f1f5f9` | Hover de controles secundarios y cabeceras sutiles |
| `--bg-muted` | `#e2e8f0` | Estados inactivos en barras de progreso |
| Sidebar | `#0f172a` | Navegación lateral profunda de alto contraste |

### Bordes y Divisores (Hairline Rules de `1px`)
| Token CSS | Valor Hex | Función |
|---|---|---|
| `--border-light` | `#f1f5f9` | Divisores internos entre filas de tabla y listas |
| `--border-default` | `#e2e8f0` | Contorno estructural de paneles, tarjetas y encabezados |
| `--border-dark` | `#cbd5e1` | Bordes de inputs, selects y botones secundarios |

### Jerarquía Tipográfica
| Token CSS | Valor Hex | Contraste WCAG | Función |
|---|---|---|---|
| `--text-primary` | `#0f172a` | > 15:1 | Títulos, métricas principales y datos clave |
| `--text-secondary` | `#334155` | > 9:1 | Cuerpo de tablas, descripciones y etiquetas |
| `--text-tertiary` | `#64748b` | > 4.6:1 | Metadatos, fechas, ayudas (`input-hint`) y cabeceras de columna |
| `--text-inverted` | `#ffffff` | > 4.5:1 | Texto sobre acentos primarios y tarjetas en estado `:hover` |

### Acentos Semánticos y Estados del Ciclo de Vida
- **Acento Primario (`--color-primary`):** `#2563eb` (Hover `#1d4ed8`) — Botones de acción principal, foco de inputs, enlaces e indicador activo en sidebar.
- **Pendiente (`--color-warning`):** `#d97706` | Fondo `#fffbeb` | Borde `#fde68a` | Texto `#b45309`
- **En Cola (`--color-info`):** `#0284c7` | Fondo `#f0f9ff` | Borde `#bae6fd` | Texto `#0369a1`
- **Procesando (`--color-purple`):** `#7c3aed` | Fondo `#faf5ff` | Borde `#e9d5ff` | Texto `#6b21a8`
- **Respondida (`--color-success`):** `#16a34a` | Fondo `#f0fdf4` | Borde `#bbf7d0` | Texto `#15803d`
- **Error (`--color-danger`):** `#dc2626` | Fondo `#fef2f2` | Borde `#fecaca` | Texto `#b91c1c`

---

## 3. Tipografía y Geometría

### Familias Tipográficas
- **Display & UI Body:** `'Plus Jakarta Sans', system-ui, -apple-system, sans-serif`
  - Títulos de vista (`h2`): `1.55rem` (`800`, tracking `-0.025em`)
  - Métricas de tarjetas (`.statcard-valor`): `1.95rem` (`800`, tracking `-0.03em`, `font-variant-numeric: tabular-nums`)
  - Cuerpo y tablas: `0.88rem–0.90rem` (`400–600`)
  - Etiquetas superiores y badges: `0.72rem–0.75rem` (`700`, `uppercase`, tracking `0.03em–0.06em`)
- **Monospace (IDs y Telemetría):** `'JetBrains Mono', ui-monospace, SFMono-Regular, Consolas, monospace` (`0.82rem`, `500`)

### Geometría, Sombras y Transiciones
- **Radios de borde:** `--radius-sm: 4px` (badges/pills), `--radius-md: 6px` (inputs/botones), `--radius-lg: 8px` (paneles/tarjetas).
- **Sombras planas:**
  - `--shadow-xs`: `0 1px 2px 0 rgba(15, 23, 42, 0.05)`
  - `--shadow-md`: `0 4px 6px -1px rgba(15, 23, 42, 0.07), 0 2px 4px -2px rgba(15, 23, 42, 0.07)`
- **Micro-interacciones:** Transiciones de `150ms–200ms ease`. Las tarjetas `.statcard` no tienen borde superior de color en reposo y se rellenan completamente de su color semántico en `:hover` con texto e icono SVG en `#ffffff`.

---

## 4. Checklist de Calidad (Regla 3)
- [x] **Cero emojis como iconos:** Toda la iconografía emplea trazos vectoriales SVG limpios (`stroke="currentColor"`).
- [x] **`cursor: pointer` en elementos interactivos:** Aplicado en botones, enlaces, filas interactivas, selects y tarjetas métricas (`.statcard`).
- [x] **Transiciones de hover suaves (150-300ms):** Configuradas en `150ms–200ms ease`.
- [x] **Contraste WCAG mínimo 4.5:1:** Verificado en textos primarios, secundarios, terciarios y badges de estado.
- [x] **Variables exportadas a `:root`:** Definidas en `frontend/src/styles/main.css`.
