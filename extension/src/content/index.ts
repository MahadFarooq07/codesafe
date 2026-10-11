import { isFillable, isOtpInput, otpGroup } from "./detect";
import { fillCode } from "./fill";
import { Pill } from "./pill";
import { CODE_RE, type ContentMsg, type FillReply, type PillState, type ToContentMsg } from "../shared/types";

interface Active {
  input: HTMLInputElement;
  group: HTMLInputElement[];
  pill: Pill;
  state: PillState;
}

let active: Active | null = null;

function send<T>(msg: ContentMsg): Promise<T | undefined> {
  return new Promise((resolve) => {
    try {
      chrome.runtime.sendMessage(msg, (r: T) => {
        // Reading lastError clears the "unchecked" warning when the worker is gone.
        void chrome.runtime.lastError;
        resolve(r);
      });
    } catch {
      // Extension was reloaded or removed; this content script is orphaned.
      resolve(undefined);
    }
  });
}

function clear(): void {
  if (!active) return;
  active.pill.destroy();
  active = null;
  void send({ type: "FIELD_BLURRED" });
}

function render(state: PillState | undefined): void {
  if (!active || active.pill.isDestroyed) return;
  if (!state || state.status === "hidden") {
    clear();
    return;
  }
  active.state = state;
  if (state.status === "searching") active.pill.searching();
  else if (CODE_RE.test(state.code)) active.pill.found(state.code, state.sender, state.trusted);
  else clear();
}

/** The field the pill belongs to must still be the one the user is in. */
function stillFocused(a: Active): boolean {
  const el = document.activeElement;
  return el instanceof HTMLInputElement && (el === a.input || a.group.includes(el)) && a.input.isConnected;
}

async function pick(): Promise<void> {
  const current = active;
  if (!current || current.state.status !== "found") return;
  const reply = await send<FillReply>({ type: "FILL_REQUEST" });
  const code = reply?.code;
  if (!code || !CODE_RE.test(code)) return;
  if (active !== current || !stillFocused(current)) return;
  fillCode(current.input, code, current.group);
  current.pill.destroy();
  active = null;
}

function attach(input: HTMLInputElement): Active {
  clear();
  const group = otpGroup(input);
  const pill = new Pill(input, () => void pick());
  active = { input, group, pill, state: { status: "hidden" } };
  return active;
}

document.addEventListener(
  "focusin",
  (e) => {
    const t = e.target;
    if (!isOtpInput(t)) return;
    if (active && !active.pill.isDestroyed && (active.input === t || active.group.includes(t))) return;
    const a = attach(t);
    void send<PillState>({ type: "FIELD_FOCUSED" }).then((s) => {
      if (active === a) render(s);
    });
  },
  true,
);

document.addEventListener(
  "focusout",
  () => {
    // Small delay so a pill click lands before we tear it down.
    setTimeout(() => {
      if (!active) return;
      const el = document.activeElement;
      if (!(el instanceof HTMLInputElement) || !active.group.includes(el)) clear();
    }, 150);
  },
  true,
);

// Leaving the page (or bfcache) drops the pill and the code with it.
window.addEventListener("pagehide", clear);

/** Keyboard shortcut: fill the focused field, going through the same checks as a click. */
async function onPasteRequest(): Promise<void> {
  if (!document.hasFocus()) return; // only the frame the user is typing in
  const el = document.activeElement;
  if (!isFillable(el)) return;
  const a =
    active && !active.pill.isDestroyed && (active.input === el || active.group.includes(el)) ? active : attach(el);
  const state = await send<PillState>({ type: "FIELD_FOCUSED", explicit: true });
  if (active !== a) return;
  render(state);
  // A trusted code is filled straight away; a cautionary one waits for clicks on the pill.
  if (state?.status === "found" && state.trusted) await pick();
}

chrome.runtime.onMessage.addListener((msg: ToContentMsg, sender) => {
  if (sender.id !== chrome.runtime.id || sender.tab) return; // only our service worker
  if (msg?.type === "PILL_STATE") render(msg.payload);
  else if (msg?.type === "PASTE_REQUEST") void onPasteRequest();
});
