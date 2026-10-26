---
name: Warm Editorial Magenta
colors:
  surface: '#fcf9f6'
  surface-dim: '#dcd9d7'
  surface-bright: '#fcf9f6'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3f1'
  surface-container: '#f0edeb'
  surface-container-high: '#ebe8e5'
  surface-container-highest: '#e5e2e0'
  on-surface: '#1c1c1a'
  on-surface-variant: '#504250'
  inverse-surface: '#31302f'
  inverse-on-surface: '#f3f0ee'
  outline: '#837281'
  outline-variant: '#d4c1d2'
  surface-tint: '#982aab'
  primary: '#6e0081'
  on-primary: '#ffffff'
  primary-container: '#8e1ea2'
  on-primary-container: '#fab3ff'
  inverse-primary: '#f9acff'
  secondary: '#9c2c9c'
  on-secondary: '#ffffff'
  secondary-container: '#ff86f9'
  on-secondary-container: '#7d0380'
  tertiary: '#00483e'
  on-tertiary: '#ffffff'
  tertiary-container: '#006255'
  on-tertiary-container: '#82ddc9'
  error: '#c64545'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffd6fe'
  primary-fixed-dim: '#f9acff'
  on-primary-fixed: '#35003f'
  on-primary-fixed-variant: '#7b0090'
  secondary-fixed: '#ffd7f6'
  secondary-fixed-dim: '#ffaaf6'
  on-secondary-fixed: '#380039'
  on-secondary-fixed-variant: '#7f0682'
  tertiary-fixed: '#98f3e0'
  tertiary-fixed-dim: '#7cd7c4'
  on-tertiary-fixed: '#00201b'
  on-tertiary-fixed-variant: '#005045'
  background: '#fcf9f6'
  on-background: '#1c1c1a'
  surface-variant: '#e5e2e0'
  primary-active: '#C654C3'
  primary-soft: '#ED96D7'
  primary-disabled: '#FFC0DE'
  ink: '#141413'
  body: '#3d3d3a'
  body-strong: '#252523'
  muted: '#6c6a64'
  muted-soft: '#8e8b82'
  hairline: '#e6dfd8'
  hairline-soft: '#ebe6df'
  canvas: '#faf9f5'
  surface-soft: '#f5f0e8'
  surface-card: '#efe9de'
  surface-cream-strong: '#e8e0d2'
  surface-dark: '#181715'
  surface-dark-elevated: '#252320'
  on-dark: '#faf9f5'
  accent-teal: '#5db8a6'
  accent-amber: '#e8a55a'
  success: '#5db872'
  warning: '#d4a017'
typography:
  display-lg:
    fontFamily: Newsreader
    fontSize: 3.5rem
    fontWeight: '600'
    lineHeight: '1.15'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Newsreader
    fontSize: 2.5rem
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.015em
  headline-lg-mobile:
    fontFamily: Newsreader
    fontSize: 2rem
    fontWeight: '600'
    lineHeight: '1.25'
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Newsreader
    fontSize: 1.75rem
    fontWeight: '600'
    lineHeight: '1.3'
  headline-sm:
    fontFamily: Newsreader
    fontSize: 1.375rem
    fontWeight: '400'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Inter
    fontSize: 1.125rem
    fontWeight: '400'
    lineHeight: '1.65'
  body-md:
    fontFamily: Inter
    fontSize: 1rem
    fontWeight: '400'
    lineHeight: '1.6'
  body-sm:
    fontFamily: Inter
    fontSize: 0.875rem
    fontWeight: '400'
    lineHeight: '1.5'
  body-strong:
    fontFamily: Inter
    fontSize: 1rem
    fontWeight: '600'
    lineHeight: '1.6'
  label-lg:
    fontFamily: Inter
    fontSize: 0.875rem
    fontWeight: '500'
    lineHeight: '1.25'
  label-md:
    fontFamily: Inter
    fontSize: 0.75rem
    fontWeight: '500'
    lineHeight: '1.2'
  code-md:
    fontFamily: JetBrains Mono
    fontSize: 0.8125rem
    fontWeight: '400'
    lineHeight: '1.4'
  code-sm:
    fontFamily: JetBrains Mono
    fontSize: 0.6875rem
    fontWeight: '400'
    lineHeight: '1.3'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-mobile: 1rem
  margin: 2rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

# Espiralia — Style Reference
> Interfaz editorial para Espiralia con tipografía y ritmo visual inspirados en Claude. El sistema se apoya en un canvas cálido (`#faf9f5`), titulares display con serif ("Copernicus" / Tiempos Headline / Georgia / serif) y cuerpo sans humanista (StyreneB / Inter / sans-serif). La identidad de marca utiliza la paleta magenta/púrpura (#8E1EA2, #C654C3, #ED96D7, #FFC0DE) para botones, acentos e interacciones clave.

**Theme:** light

## Tokens — Colors

| Name | Value | Token | Role |
| --- | --- | --- | --- |
| primary | `#8E1EA2` | `--color-primary` | primary role (#8E1EA2 / rgb(142, 30, 162)) |
| primary active | `#C654C3` | `--color-primary-active` | primary active/hover role (#C654C3 / rgb(198, 84, 195)) |
| primary soft | `#ED96D7` | `--color-primary-soft` | primary soft accent/badge role (#ED96D7 / rgb(237, 150, 215)) |
| primary disabled | `#FFC0DE` | `--color-primary-disabled` | primary disabled / light tint role (#FFC0DE / rgb(255, 192, 222)) |
| ink | `#141413` | `--color-ink` | ink role |
| body | `#3d3d3a` | `--color-body` | body role |
| body strong | `#252523` | `--color-body-strong` | body strong role |
| muted | `#6c6a64` | `--color-muted` | muted role |
| muted soft | `#8e8b82` | `--color-muted-soft` | muted soft role |
| hairline | `#e6dfd8` | `--color-hairline` | hairline role |
| hairline soft | `#ebe6df` | `--color-hairline-soft` | hairline soft role |
| canvas | `#faf9f5` | `--color-canvas` | canvas role |
| surface soft | `#f5f0e8` | `--color-surface-soft` | surface soft role |
| surface card | `#efe9de` | `--color-surface-card` | surface card role |
| surface cream strong | `#e8e0d2` | `--color-surface-cream-strong` | surface cream strong role |
| surface dark | `#181715` | `--color-surface-dark` | surface dark role |
| surface dark elevated | `#252320` | `--color-surface-dark-elevated` | surface dark elevated role |
| on primary | `#ffffff` | `--color-on-primary` | on primary role |
| on dark | `#faf9f5` | `--color-on-dark` | on dark role |
| accent teal | `#5db8a6` | `--color-accent-teal` | accent teal role |
| accent amber | `#e8a55a` | `--color-accent-amber` | accent amber role |
| success | `#5db872` | `--color-success` | success role |
| warning | `#d4a017` | `--color-warning` | warning role |
| error | `#c64545` | `--color-error` | error role |

## Tokens — Typography

### Copernicus, Tiempos Headline, Georgia, serif · `--font-primary`
- Weights: 400, 600
- Role: Titulares editoriales cálidos y elegantes

### StyreneB, Inter, system-ui, sans-serif · `--font-family-2`
- Weights: 400, 500, 600
- Role: Cuerpo de texto, controles, botones y etiquetas UI

### JetBrains Mono, monospace · `--font-family-3`
- Weights: 400
- Role: Códigos, horas, marcas de tiempo, insignias de estado

## Spacing & Shapes
- Density: comfortable
- Border Radius: md (8px), lg (12px), xl (16px), pill (9999px)
- Canvas: `#faf9f5`
- Max width: 1280px
