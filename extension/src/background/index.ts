import { getToken, getEmail, signOut } from "./auth";
import { findLatestCode } from "./gmail";
import { DEFAULT_SETTINGS, type FoundCode, type Msg, type Settings, type State } from "../shared/types";

const EXPIRE_ALARM = "codesafe-expire-code";

// The service worker can be suspended between events; everything that must
// survive lives in chrome.storage.session. "searching" is the one exception:
// if the worker dies mid-search the search simply stops, which is the safe default.
let searching = false;

async function getSettings(): Promise<Settings> {
  const stored = (await chrome.storage.sync.get(DEFAULT_SETTINGS)) as Partial<Settings>;
  return { ...DEFAULT_SETTINGS, ...stored };
}

async function getState(): Promise<State> {
  const token = await getToken(false);
  if (!token) return { status: "signed-out" };

  const session = (await chrome.storage.session.get(["email", "code", "checkedAt", "error"])) as {
    email?: string;
    code?: FoundCode;
    checkedAt?: number;
    error?: string;
  };
  let email = session.email ?? "";
  if (!email) {
    email = await getEmail(token).catch(() => "");
    if (email) await chrome.storage.session.set({ email });
  }

  if (searching) return { status: "searching", email };
  if (session.code && session.code.expiresAt > Date.now()) {
    return { status: "found", email, code: session.code };
  }
  if (session.error) return { status: "error", email, message: session.error };
  if (session.checkedAt) return { status: "none", email, checkedAt: session.checkedAt };
  return { status: "idle", email };
}

async function broadcast(): Promise<void> {
  const state = await getState();
  const msg: Msg = { type: "STATE", payload: state };
  chrome.runtime.sendMessage(msg).catch(() => undefined);
  const tabs = await chrome.tabs.query({ active: true });
  for (const t of tabs) {
    if (t.id !== undefined) chrome.tabs.sendMessage(t.id, msg).catch(() => undefined);
  }
}

function describeError(e: unknown): string {
  const m = e instanceof Error ? e.message : String(e);
  if (m === "gmail-forbidden") return "Gmail access was denied. Sign out and back in to grant read-only access.";
  if (m === "gmail-rate-limited") return "Gmail is rate-limiting requests. Try again in a minute.";
  return "Couldn't reach Gmail. Check your connection and try again.";
}

/**
 * Poll Gmail for up to `windowMs`, backing off 2s -> 5s between tries.
 * Stops at the first code found. Only ever triggered by a user action
 * (focusing a code field, opening the popup, or the keyboard shortcut).
 */
async function search(windowMs: number): Promise<void> {
  if (searching) return;
  searching = true;
  await chrome.storage.session.remove("error");
  await broadcast();

  const start = Date.now();
  let delay = 2000;
  try {
    while (Date.now() - start < windowMs) {
      const found = await findLatestCode();
      if (found) {
        await chrome.storage.session.set({ code: found, checkedAt: Date.now() });
        chrome.alarms.create(EXPIRE_ALARM, { when: found.expiresAt });
        const { autoCopy } = await getSettings();
        if (autoCopy) await copyViaOffscreen(found.code);
        return;
      }
      await new Promise((r) => setTimeout(r, delay));
      delay = Math.min(delay * 1.5, 5000);
    }
    await chrome.storage.session.set({ checkedAt: Date.now() });
  } catch (e) {
    if (e instanceof Error && e.message === "signed-out") {
      await chrome.storage.session.clear();
    } else {
      await chrome.storage.session.set({ error: describeError(e) });
    }
  } finally {
    searching = false;
    await broadcast();
  }
}

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== EXPIRE_ALARM) return;
  await chrome.storage.session.remove("code");
  await broadcast();
});

chrome.runtime.onMessage.addListener((msg: Msg, _sender, reply: (r: unknown) => void) => {
  (async () => {
    switch (msg.type) {
      case "GET_STATE":
        reply(await getState());
        break;
      case "SIGN_IN": {
        const token = await getToken(true);
        if (token) {
          const email = await getEmail(token).catch(() => "");
          await chrome.storage.session.set({ email });
        }
        reply(await getState());
        await broadcast();
        break;
      }
      case "SIGN_OUT":
        await signOut();
        reply(await getState());
        await broadcast();
        break;
      case "FETCH_NOW":
        void search(30_000);
        // Give the search a tick to flip the "searching" flag before replying.
        await new Promise((r) => setTimeout(r, 0));
        reply(await getState());
        break;
      case "OTP_FIELD_FOCUSED": {
        const { autoDetect } = await getSettings();
        const current = await getState();
        if (autoDetect && current.status !== "signed-out" && current.status !== "found") {
          void search(90_000);
          await new Promise((r) => setTimeout(r, 0));
        }
        reply(autoDetect ? await getState() : { status: "signed-out" });
        break;
      }
      case "SET_SETTINGS":
        await chrome.storage.sync.set(msg.payload);
        reply(true);
        break;
      default:
        reply(undefined);
    }
  })().catch((e) => {
    console.error("[codesafe]", e);
    reply(undefined);
  });
  return true; // keep the channel open for the async reply
});

// Keyboard shortcut: paste the latest code into whatever is focused,
// or start a search if there is no current code.
chrome.commands.onCommand.addListener(async (command) => {
  if (command !== "paste-latest-code") return;
  const state = await getState();
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (state.status === "found" && tab?.id !== undefined) {
    const msg: Msg = { type: "PASTE_CODE", payload: state.code.code };
    chrome.tabs.sendMessage(tab.id, msg).catch(() => undefined);
  } else if (state.status !== "signed-out") {
    void search(30_000);
  }
});

// Writing to the clipboard from a service worker needs an offscreen document.
async function copyViaOffscreen(text: string): Promise<void> {
  try {
    const has = await chrome.offscreen.hasDocument();
    if (!has) {
      await chrome.offscreen.createDocument({
        url: "offscreen.html",
        reasons: [chrome.offscreen.Reason.CLIPBOARD],
        justification: "Copy the verification code to the clipboard",
      });
    }
    const msg: Msg = { type: "OFFSCREEN_COPY", payload: text };
    await chrome.runtime.sendMessage(msg);
  } catch (e) {
    console.warn("[codesafe] clipboard copy failed", e);
  }
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get(DEFAULT_SETTINGS).then((s) => chrome.storage.sync.set({ ...DEFAULT_SETTINGS, ...s }));
});
