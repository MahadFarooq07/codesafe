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
.pill:active { transform: scale(0.97); }
.pill:focus-visible { box-shadow: 0 0 0 3px rgba(10, 132, 255, 0.35); }
.pill.wait { cursor: default; }
.from { font-size: 11px; line-height: 1; font-weight: 500; color: var(--text-2); letter-spacing: 0; }
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


function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c);
}

/**
 * The Apple-style suggestion pill. Rendered in a closed shadow root so the
 * page can neither restyle it nor read the code out of it.
 */
export class Pill {
  private host = document.createElement("codesafe-pill");
  private root = this.host.attachShadow({ mode: "closed" });
  private el = document.createElement("button");
  private removed = false;

  constructor(
    private anchor: HTMLInputElement,
    private onPick: () => void,
  ) {
    const style = document.createElement("style");
    style.textContent = CSS;
    this.el.className = "pill";
    this.el.type = "button";
    this.el.setAttribute("aria-live", "polite");
    // mousedown.preventDefault keeps focus inside the input so focusout
    // does not tear the pill down before the click lands.
    this.el.addEventListener("mousedown", (e) => e.preventDefault());
    this.el.addEventListener("click", () => this.onPick());
    this.root.append(style, this.el);
    document.documentElement.append(this.host);
    this.position();
    window.addEventListener("scroll", this.position, true);
    window.addEventListener("resize", this.position);
  }

  searching(): void {
    this.el.className = "pill wait";
    this.el.setAttribute("aria-label", "Checking Gmail for a code");
    this.el.innerHTML = `<span class="dots" aria-hidden="true"><i></i><i></i><i></i></span>`;
    this.show();
  }

  found(code: string): void {
    this.el.className = "pill";
    this.el.setAttribute("aria-label", `Paste code ${code} from Gmail`);
    this.el.innerHTML = `<span class="from">From Gmail</span><span class="code">${esc(code)}</span>`;
    this.show();
  }

  filled(): void {
    this.destroy();
  }

  private show(): void {
    requestAnimationFrame(() => this.el.classList.add("in"));
    this.position();
  }

  position = (): void => {
    if (this.removed) return;
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
    window.removeEventListener("scroll", this.position, true);
    window.removeEventListener("resize", this.position);
    this.el.classList.remove("in");
    setTimeout(() => this.host.remove(), 200);
  }
}
