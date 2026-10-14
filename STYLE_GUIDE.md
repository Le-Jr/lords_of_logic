# Style Guide — Lords of Logic

Visual direction spec. This is a design brief, not an implementation —
the goal is for opencode to read this and write the CSS/components
from it, not for you to copy something ready-made.

## Direction

Monochrome MS-DOS terminal. The game is dev trivia, so the visual
reference comes from computing history itself, not generic retro
aesthetics. There are two arcade motifs, each with one fixed job, and
never both on the same screen:

- **Pong** — the signature element outside a match: a ball bouncing
  between two paddles, as hero decoration or a loading indicator.
- **Invaders** — the progress indicator inside a match (see Component
  patterns). It replaces Pong there; it never appears outside a match.

## Color

Strict grayscale, no hue (no phosphor green, no amber).

| Role | Approximate value | Use |
|---|---|---|
| Background | pure black | always the background, no exceptions |
| Primary text | slightly off-white (not pure `#fff` — avoids glare on black) | body text, headings |
| Secondary text | mid gray | captions, disabled state, supporting text |
| Borders/decoration | dark gray | dividers, ASCII-style frames |
| Active/hover/focus state | full inversion (background and text swap) | never introduce a new color to signal state |

If error/success needs to be distinguished, do it with type weight or
explicit text (`ERROR:`, `OK:`), never with color — that's what keeps
the product genuinely monochrome.

## Typography

- **Display** (large headings, h1, boot prompt): a CRT/bitmap terminal
  face — e.g. VT323 from Google Fonts. Large sizes only; illegible in
  running body text.
- **Body and UI** (paragraphs, buttons, labels, menus): a readable
  monospace — e.g. IBM Plex Mono. Everything that isn't a large
  heading uses this.
- A clear size scale with defined steps (caption → body → h3 → h2 →
  h1), no loose values scattered through the code.

## Layout

- Corners are always square — zero `border-radius` on any element.
  Square frames, like a DOS window.
- Main content centered at a "terminal" width (not a marketing-site
  width — narrower, evoking an 80-column terminal).
- Dividers as a dashed rule, not a bare unstyled `<hr>`.

## Component patterns (behavior, not code)

- **Prompt line**: used as a header/breadcrumb on every page (e.g.
  `C:\LORDS_OF_LOGIC\PLAY>`), with a blinking block cursor at the end.
- **Menu item**: any list of actions or primary navigation follows the
  DOS boot-menu pattern — a marker (`>`) to the left of the text,
  uppercase text for navigation commands. On hover or keyboard focus,
  colors invert (background and text swap) instead of changing hue.
- **Command menu**: a menu of navigation commands is a keyboard-roving
  widget — TAB enters the menu once (a single tab stop, no per-item
  tabbing), ARROW UP/DOWN moves the active command, HOME/END jump to
  first/last, and ENTER runs it. Only the active command is in the tab
  order. Focus and hover share the same inversion treatment, so the
  selected command is always visibly inverted.
- **Content box**: container with a square 2px border, no shadow, no
  gradient.
- **Ranking list**: tabular data rendered as a content-box `<table>`.
  Uppercase secondary-text column headers, dashed rule under the
  header row, body rows in `text-sm`; numeric columns (rank, XP,
  matches) right-aligned with `tabular-nums` so figures line up like
  terminal output.
- **Invaders (match progress)**: a content box with one 1978-style
  bitmap invader per question in a row at the top and a cannon at the
  bottom, under the current question's invader. A correct answer fires
  a shot and leaves that invader as dimmed debris (secondary color); a
  wrong answer or timeout leaves it standing, one row lower. Sprites are
  pixel bitmaps in the primary color, square pixels, no anti-aliasing.
  Decorative (`aria-hidden`): the question counter carries the same
  information as text.
- **Keyboard focus cursor**: same visual treatment as hover — a solid
  block inverting colors. This replaces the browser's default outline
  and should never be removed without that substitute.

Before creating a new component, check whether one of the patterns
above already solves it. If a genuinely new component is needed,
document the pattern here after building it, so future sessions reuse
it instead of reinventing it.

## Motion

- One continuous animation per screen at most — the Pong ball, or the
  invaders' two-frame stepped march inside a match (plus the blinking
  cursor, which is nearly static). The Invaders shot/explosion is a
  one-off event reaction, not a continuous animation. Don't stack multiple
  decorative animations on the same screen.
- No soft "ease-in-out" decorative easing. Movement is linear or
  stepped, like a real terminal — not like a modern smooth interface.
- All animation must respect the user's reduced-motion OS preference.
  This should be configured globally once, not repeated per component.

## Copy

- English is the default and first-built language for every feature.
  Navigation commands in UPPERCASE (`PLAY`, `LOGIN`, `RANKING`);
  running text in normal lowercase.
- A Portuguese (pt-BR) language toggle is a planned future feature —
  see `AGENTS.md`. Don't hardcode English strings directly inside
  components; keep UI copy in a single place (e.g. a strings/constants
  module) so adding the toggle later doesn't require touching every
  component.
- Decorative comments/captions can use a code-comment style (`//
  text`) to reinforce the command-line aesthetic.
- Error or empty-state messages: direct, in a system's voice
  (`ERROR: MATCH NOT FOUND`), never in an apologetic human voice.

## Accessibility — non-negotiable

- High contrast is natural in this scheme (black/white), but any text
  carrying essential information uses the primary text color, never
  the secondary one.
- Keyboard focus always visible, with the same treatment as hover.
- Reduced motion always respected.