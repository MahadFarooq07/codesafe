import { TOKENS_CSS } from "../shared/tokens";

const CSS = `
${TOKENS_CSS}
:host { all: initial; }
.pill {
  position: fixed;
  z-index: 2147483647;
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  min-width: 96px;
  height: 46px;
  padding: 0 16px;
  margin: 0;
  background: var(--bg);
  color: var(--text);
  border: 0.5px solid rgba(0, 0, 0, 0.12);
  border-radius: 12px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05), 0 6px 20px rgba(0, 0, 0, 0.10);
  font-family: var(--font);
  -webkit-font-smoothing: antialiased;
  cursor: pointer;
  user-select: none;
  white-space: nowrap;
  text-align: center;
  outline: none;
  opacity: 0;
  transform: translateY(4px) scale(0.98);
  transition: opacity 0.18s var(--ease), transform 0.18s var(--ease), background 0.12s var(--ease);
}
.pill.in { opacity: 1; transform: none; }
.pill:hover { background: var(--bg-hover); }
.pill:focus-visible { box-shadow: 0 0 0 3px rgba(10, 132, 255, 0.35); }
.pill.wait { cursor: default; }
.from { font-size: 11px; line-height: 1; font-weight: 500; color: var(--text-2); letter-spacing: 0; max-width: 220px; overflow: hidden; text-overflow: ellipsis; }
.pill.caution .from { color: var(--caution); }
.code { font-size: 17px; line-height: 1.1; font-weight: 600; letter-spacing: 0.06em; font-variant-numeric: tabular-nums; }
.dots { display: inline-flex; gap: 4px; }
.dots i { width: 5px; height: 5px; border-radius: 50%; background: var(--text-2); opacity: 0.3; animation: codesafe-dot 1.1s infinite var(--ease); }
.dots i:nth-child(2) { animation-delay: 0.15s; }
.dots i:nth-child(3) { animation-delay: 0.3s; }
@keyframes codesafe-dot { 0%, 100% { opacity: 0.25 } 40% { opacity: 0.9 } }
@media (prefers-reduced-motion: reduce) {
  .pill { transition: none; }
  .dots i { animation: none; opacity: 0.6; }
}
`;

/** Clicks earlier than this after the pill appears are ignored (anti-clickjacking). */
const MIN_DWELL_MS = 500;
/** A cautionary pill needs a second click at least this long after the first. */
const CONFIRM_DELAY_MS = 600;

/** Styles forced on the host element so the page can't hide or disguise the pill. */
const HOST_STYLE: [string, string][] = [
  ["all", "initial"],
  ["position", "fixed"],
  ["inset", "auto"],
  ["top", "0"],
  ["left", "0"],
  ["width", "0"],
  ["height", "0"],
  ["margin", "0"],
  ["padding", "0"],
  ["border", "0"],
  ["background", "transparent"],
  ["overflow", "visible"],
  ["display", "block"],
  ["visibility", "visible"],
  ["opacity", "1"],
  ["filter", "none"],
  ["transform", "none"],
  ["clip-path", "none"],
  ["mask", "none"],
  ["mix-blend-mode", "normal"],
  ["pointer-events", "auto"],
  ["z-index", "2147483647"],
  ["contain", "none"],
];

let sharedSheet: CSSStyleSheet | null = null;
function sheet(): CSSStyleSheet | null {
  if (sharedSheet) return sharedSheet;
  try {
    sharedSheet = new CSSStyleSheet();
    sharedSheet.replaceSync(CSS);
  } catch {
    sharedSheet = null;
  }
  return sharedSheet;
}

function span(cls: string, text: string): HTMLSpanElement {
  const s = document.createElement("span");
  s.className = cls;
  s.textContent = text;
  return s;
}

/**
 * The Apple-style suggestion pill.
 *
 * Security model (the page is untrusted):
 *  - closed shadow root: the page can't read the code or restyle the pill;
 *  - rendered in the top layer (popover) with !important host styles, and torn
 *    down if the page touches the host element;
 *  - a click only counts if it is a real user click (isTrusted), lands on the
 *    pill with nothing on top of it, happens after the pill has been visible
 *    for a moment, and (where supported) Chrome confirms the pill was
 *    actually visible (IntersectionObserver v2).
 */
export class Pill {
  private host = document.createElement("codesafe-pill");
  private root = this.host.attachShadow({ mode: "closed" });
  private el = document.createElement("button");
  private removed = false;
  private shownAt = 0;
  private visibleToUser: boolean | null = null; // null = browser can't tell us
  private caution = false;
  private confirmedAt = 0;
  private tamperGuard: MutationObserver;
  private visibility: IntersectionObserver | null = null;

  constructor(
    readonly anchor: HTMLInputElement,
    private onPick: () => void,
  ) {
    const adopted = sheet();
    if (adopted) {
      this.root.adoptedStyleSheets = [adopted];
    } else {
      const style = document.createElement("style");
      style.textContent = CSS;
      this.root.append(style);
    }
    this.el.className = "pill";
    this.el.type = "button";
    this.el.setAttribute("aria-live", "polite");
    // mousedown.preventDefault keeps focus inside the input so focusout
    // does not tear the pill down before the click lands.
    this.el.addEventListener("mousedown", (e) => e.preventDefault());
    this.el.addEventListener("click", this.handleClick);
    this.root.append(this.el);

    this.applyHostStyle();
    this.host.setAttribute("popover", "manual");
    document.documentElement.append(this.host);
    try {
      this.host.showPopover();
    } catch {
      // Older browser or page interference: fall back to a max z-index layer.
    }
    this.host.addEventListener("toggle", (e) => {
      if ((e as ToggleEvent).newState === "closed") this.destroy();
    });

    // Any change the page makes to our host element ends the pill.
    this.tamperGuard = new MutationObserver(() => this.destroy());
    this.tamperGuard.observe(this.host, { attributes: true });

    try {
      this.visibility = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            const v = (e as IntersectionObserverEntry & { isVisible?: boolean }).isVisible;
            this.visibleToUser = typeof v === "boolean" ? v : null;
          }
        },
        { threshold: [1], trackVisibility: true, delay: 100 } as IntersectionObserverInit,
      );
      this.visibility.observe(this.el);
    } catch {
      this.visibility = null;
    }

    this.position();
    window.addEventListener("scroll", this.position, true);
    window.addEventListener("resize", this.position);
  }

  private applyHostStyle(): void {
    for (const [k, v] of HOST_STYLE) this.host.style.setProperty(k, v, "important");
  }

  searching(): void {
    this.caution = false;
    this.el.className = "pill wait";
    this.el.setAttribute("aria-label", "Checking Gmail for a code");
    const dots = document.createElement("span");
    dots.className = "dots";
    dots.setAttribute("aria-hidden", "true");
    dots.append(document.createElement("i"), document.createElement("i"), document.createElement("i"));
    this.el.replaceChildren(dots);
    this.show();
  }

  /**
   * @param trusted the sender's site matches this page and Gmail verified the
   *   sender. Otherwise the pill shows in a cautionary colour and needs two clicks.
   */
  found(code: string, sender: string, trusted: boolean): void {
    const wasVisible = this.el.classList.contains("in") && !this.el.classList.contains("wait");
    this.caution = !trusted;
    this.confirmedAt = 0;
    this.el.className = trusted ? "pill" : "pill caution";
    const from = trusted ? `From ${sender}` : `From ${sender} · not this site`;
    this.el.setAttribute(
      "aria-label",
      trusted ? `Paste code ${code} from ${sender}` : `Code ${code} is from ${sender}, not this site. Click twice to paste.`,
    );
    this.el.replaceChildren(span("from", from), span("code", code));
    if (!wasVisible) this.shownAt = 0; // content changed under the cursor: restart the dwell timer
    this.show();
  }

  private show(): void {
    requestAnimationFrame(() => {
      if (this.removed) return;
      this.el.classList.add("in");
      if (!this.shownAt) this.shownAt = performance.now();
    });
    this.position();
  }

  private handleClick = (e: MouseEvent): void => {
    if (this.removed || !e.isTrusted) return;
    if (this.el.classList.contains("wait")) return;
    const now = performance.now();
    if (!this.shownAt || now - this.shownAt < MIN_DWELL_MS) return;
    if (this.visibleToUser === false) return;
    // Something on top of the pill (an overlay, a later popover)? Ignore.
    if (e.clientX || e.clientY) {
      const hit = document.elementFromPoint(e.clientX, e.clientY);
      if (hit !== this.host) return;
    }
    if (this.caution) {
      if (!this.confirmedAt) {
        this.confirmedAt = now;
        const from = this.el.querySelector(".from");
        if (from) from.textContent = "Not this site · click again to paste";
        return;
      }
      if (now - this.confirmedAt < CONFIRM_DELAY_MS) return;
    }
    this.onPick();
  };

  position = (): void => {
    if (this.removed) return;
    if (!this.anchor.isConnected) {
      this.destroy();
      return;
    }
    const r = this.anchor.getBoundingClientRect();
    const h = 46;
    const gap = 8;
    let top = r.top - h - gap;
    if (top < 8) top = r.bottom + gap; // not enough room above: show below
    const left = Math.max(8, Math.min(r.left, window.innerWidth - 8 - this.el.offsetWidth));
    this.el.style.left = `${left}px`;
    this.el.style.top = `${top}px`;
  };

  destroy(): void {
    if (this.removed) return;
    this.removed = true;
    this.tamperGuard.disconnect();
    this.visibility?.disconnect();
    window.removeEventListener("scroll", this.position, true);
    window.removeEventListener("resize", this.position);
    this.el.classList.remove("in");
    this.el.replaceChildren(); // drop the code from the DOM immediately
    setTimeout(() => this.host.remove(), 200);
  }

  get isDestroyed(): boolean {
    return this.removed;
  }
}
