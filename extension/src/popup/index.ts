import { CODE_RE, DEFAULT_SETTINGS, type PopupMsg, type Settings, type State, type ToPageMsg } from "../shared/types";

const app = document.getElementById("app") as HTMLElement;

const LOGO =
  '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12l5 5L20 7"/></svg>';
const CHECK_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12l5 5L20 7"/></svg>';

const isMac = /mac/i.test(navigator.userAgent);
const SHORTCUT = isMac ? "<kbd>⌘</kbd> <kbd>⇧</kbd> <kbd>Y</kbd>" : "<kbd>Ctrl</kbd> <kbd>Shift</kbd> <kbd>Y</kbd>";

function send<T = unknown>(msg: PopupMsg): Promise<T | undefined> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(msg, (r: T) => {
      void chrome.runtime.lastError;
      resolve(r);
    });
  });
}

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c);
}

let tick: number | undefined;

async function render(state: State | undefined): Promise<void> {
  if (!state) {
    app.innerHTML = `<div class="card"><div class="title">CodeSafe isn't responding.</div><div class="sub">Try reloading the extension from chrome://extensions.</div></div>`;
    return;
  }
  const stored = (await chrome.storage.sync.get(DEFAULT_SETTINGS)) as Partial<Settings>;
  const settings: Settings = { ...DEFAULT_SETTINGS, ...stored };
  const email = "email" in state ? state.email : "";

  const top = `<div class="top"><div class="brand"><span class="logo">${LOGO}</span>CodeSafe</div><span class="email" title="${esc(email)}">${esc(email)}</span></div>`;

  let body = "";
  switch (state.status) {
    case "signed-out":
      body = `<div class="card"><div class="title">Codes from Gmail, in one tap.</div>
        <div class="sub">Read-only. Nothing leaves your browser.</div></div>
        <button class="btn primary" data-act="signin">Continue with Google</button>`;
      break;
    case "idle":
      body = `<div class="card"><div class="title">No code yet.</div></div>
        <button class="btn primary" data-act="fetch">Check Gmail</button>`;
      break;
    case "searching":
      body = `<div class="card"><div class="spinner"></div><div class="sub">Checking Gmail</div></div>`;
      break;
    case "none":
      body = `<div class="card"><div class="title">No new codes.</div></div>
        <button class="btn primary" data-act="fetch">Check again</button>`;
      break;
    case "error":
      body = `<div class="card"><div class="sub error">${esc(state.message)}</div></div>
        <button class="btn primary" data-act="fetch">Try again</button>`;
      break;
    case "found":
      body = `<button class="card suggestion" data-act="copy" data-code="${esc(state.code.code)}" aria-label="Copy code ${esc(state.code.code)}">
          <span class="from">From ${esc(state.code.sender)}${state.code.verified ? "" : " · unverified sender"}</span>
          <span class="code">${esc(state.code.code)}</span>
          <span class="hint-copy">Click to copy</span>
        </button>`;
      break;
  }

  const rows =
    state.status === "signed-out"
      ? ""
      : `<div class="rows">
      <label class="row"><span>Show on code fields</span>
        <span class="switch"><input type="checkbox" data-set="autoDetect" ${settings.autoDetect ? "checked" : ""}><span></span></span></label>
      <label class="row"><span>Copy automatically</span>
        <span class="switch"><input type="checkbox" data-set="autoCopy" ${settings.autoCopy ? "checked" : ""}><span></span></span></label>
    </div>
    <div class="foot"><a href="#" data-act="signout">Sign out</a><span>${SHORTCUT}</span></div>`;

  app.innerHTML = top + body + rows;

  // Keep "clears in N min" fresh while the popup is open.
  if (tick) window.clearInterval(tick);
  if (state.status === "found") tick = window.setInterval(() => void send<State>({ type: "GET_STATE" }).then(render), 30_000);
}

app.addEventListener("click", async (e) => {
  const el = (e.target as HTMLElement).closest<HTMLElement>("[data-act]");
  if (!el) return;
  e.preventDefault();
  switch (el.dataset.act) {
    case "signin": {
      el.textContent = "Opening Google…";
      (el as HTMLButtonElement).disabled = true;
      await render(await send<State>({ type: "SIGN_IN" }));
      break;
    }
    case "signout":
      await render(await send<State>({ type: "SIGN_OUT" }));
      break;
    case "fetch":
      await render(await send<State>({ type: "FETCH_NOW" }));
      break;
    case "copy": {
      const code = el.dataset.code ?? "";
      if (!CODE_RE.test(code)) break;
      await navigator.clipboard.writeText(code);
      const hint = el.querySelector(".hint-copy");
      if (hint) hint.innerHTML = `${CHECK_ICON}Copied`;
      el.classList.add("copied");
      setTimeout(() => window.close(), 650);
      break;
    }
  }
});

app.addEventListener("change", (e) => {
  const el = e.target as HTMLInputElement;
  const key = el.dataset.set as keyof Settings | undefined;
  if (key) void send({ type: "SET_SETTINGS", payload: { [key]: el.checked } });
});

chrome.runtime.onMessage.addListener((msg: ToPageMsg, sender) => {
  // Only the service worker (an extension context without a tab) may update us.
  if (sender.id !== chrome.runtime.id || sender.tab) return;
  if (msg?.type === "STATE") void render(msg.payload);
});

void send<State>({ type: "GET_STATE" }).then(render);
