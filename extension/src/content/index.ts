import { isOtpInput, otpGroup } from "./detect";
import { fillCode } from "./fill";
import { Pill } from "./pill";
import type { Msg, State } from "../shared/types";

interface Active {
  input: HTMLInputElement;
  group: HTMLInputElement[];
  pill: Pill;
}

let active: Active | null = null;

function clear(): void {
  active?.pill.destroy();
  active = null;
}

function render(state: State | undefined): void {
  if (!active || !state) return;
  if (state.status === "searching") active.pill.searching();
  else if (state.status === "found") active.pill.found(state.code.code);
  else clear();
}

function send<T = unknown>(msg: Msg): Promise<T | undefined> {
  return new Promise((resolve) => {
    try {
      chrome.runtime.sendMessage(msg, (r: T) => {
        // Reading lastError clears the "unchecked" warning when the worker is gone.
        void chrome.runtime.lastError;
        resolve(r);
      });
    } catch {
      resolve(undefined);
    }
  });
}

async function pick(): Promise<void> {
  if (!active) return;
  const current = active;
  const state = await send<State>({ type: "GET_STATE" });
  if (state?.status === "found") {
    fillCode(current.input, state.code.code, current.group);
    current.pill.filled();
    active = null;
  }
}

document.addEventListener(
  "focusin",
  (e) => {
    const t = e.target;
    if (!isOtpInput(t)) return;
    if (active && (active.input === t || active.group.includes(t))) return;
    clear();
    const group = otpGroup(t);
    const pill = new Pill(t, () => void pick());
    active = { input: t, group, pill };
    void send<State>({ type: "OTP_FIELD_FOCUSED" }).then(render);
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

chrome.runtime.onMessage.addListener((msg: Msg) => {
  if (msg.type === "STATE") render(msg.payload);
  if (msg.type === "PASTE_CODE") {
    const el = document.activeElement;
    if (el instanceof HTMLInputElement) {
      fillCode(el, msg.payload, otpGroup(el));
      if (active) {
        active.pill.filled();
        active = null;
      }
    }
  }
});
