import { getToken, getEmail, signOut } from "./auth";
import { findLatestCode } from "./gmail";
import { hostOf, sameSite } from "../shared/site";
import {
  CODE_RE,
  DEFAULT_SETTINGS,
  SETTING_KEYS,
  type ContentMsg,
  type FillReply,
  type FoundCode,
  type PillState,
  type PopupMsg,
  type Settings,
  type State,
  type ToContentMsg,
  type ToPageMsg,
} from "../shared/types";

const EXPIRE_ALARM = "codesafe-expire-code";
const EXT_URL = chrome.runtime.getURL("");

/** Content scripts may start at most one Gmail search per this interval. */
const CONTENT_SEARCH_COOLDOWN_MS = 20_000;
/** A focus record older than this can't be used to fill. */
const FOCUS_TTL_MS = 10 * 60 * 1000;
/** Remember this many used message ids so a code is never offered twice. */
const MAX_USED_IDS = 50;

// Session storage lives in memory only. Make sure content scripts (which run
// inside web pages) can never read it, even if Chrome's default changes.
void chrome.storage.session.setAccessLevel({ accessLevel: "TRUSTED_CONTEXTS" }).catch(() => undefined);

/** The one frame currently showing a pill. Only this frame ever receives the code. */
interface Focus {
  tabId: number;
  frameId: number;
  frameHost: string;
  topHost: string;
  at: number;
}

interface Session {
  email?: string;
  code?: FoundCode;
  checkedAt?: number;
  error?: string;
  usedIds?: string[];
  focus?: Focus;
}

// The service worker can be suspended between events; everything that must
// survive lives in chrome.storage.session. "searching" is the one exception:
// if the worker dies mid-search the search simply stops, which is the safe default.
let searching = false;
let lastContentSearch = 0;

async function session(): Promise<Session> {
  return (await chrome.storage.session.get(["email", "code", "checkedAt", "error", "usedIds", "focus"])) as Session;
}

async function getSettings(): Promise<Settings> {
  const stored = (await chrome.storage.sync.get(DEFAULT_SETTINGS)) as Partial<Settings>;
  return {
    autoDetect: typeof stored.autoDetect === "boolean" ? stored.autoDetect : DEFAULT_SETTINGS.autoDetect,
    autoCopy: typeof stored.autoCopy === "boolean" ? stored.autoCopy : DEFAULT_SETTINGS.autoCopy,
  };
}

function liveCode(s: Session): FoundCode | null {
  const c = s.code;
  return c && c.expiresAt > Date.now() && CODE_RE.test(c.code) ? c : null;
}

async function getState(): Promise<State> {
  const token = await getToken(false);
  if (!token) return { status: "signed-out" };

  const s = await session();
  let email = s.email ?? "";
  if (!email) {
    email = await getEmail().catch(() => "");
    if (email) await chrome.storage.session.set({ email });
  }

  if (searching) return { status: "searching", email };
  const code = liveCode(s);
  if (code) return { status: "found", email, code };
  if (s.error) return { status: "error", email, message: s.error };
  if (s.checkedAt) return { status: "none", email, checkedAt: s.checkedAt };
  return { status: "idle", email };
}

function trustedFor(code: FoundCode, focus: Focus): boolean {
  if (!code.verified) return false;
  if (!sameSite(code.sender, focus.frameHost)) return false;
  return !focus.topHost || sameSite(code.sender, focus.topHost);
}

async function pillStateFor(focus: Focus | undefined): Promise<PillState> {
  if (!focus) return { status: "hidden" };
  if (searching) return { status: "searching" };
  const code = liveCode(await session());
  if (!code) return { status: "hidden" };
  return { status: "found", code: code.code, sender: code.sender, trusted: trustedFor(code, focus) };
}

/** Popup gets the full state; only the focused frame gets the pill state. */
async function broadcast(): Promise<void> {
  const toPopup: ToPageMsg = { type: "STATE", payload: await getState() };
  chrome.runtime.sendMessage(toPopup).catch(() => undefined);

  const { focus } = await session();
  if (!focus) return;
  const toFrame: ToContentMsg = { type: "PILL_STATE", payload: await pillStateFor(focus) };
  chrome.tabs.sendMessage(focus.tabId, toFrame, { frameId: focus.frameId }).catch(() => undefined);
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
      const { usedIds = [] } = await session();
      const found = await findLatestCode(new Set(usedIds));
      if (found) {
        await chrome.storage.session.set({ code: found, checkedAt: Date.now() });
        await chrome.alarms.create(EXPIRE_ALARM, { when: found.expiresAt });
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

/** Mark the current code as used: it is wiped and its email never offered again. */
async function consumeCode(code: FoundCode): Promise<void> {
  const { usedIds = [] } = await session();
  const next = [code.messageId, ...usedIds.filter((id) => id !== code.messageId)].slice(0, MAX_USED_IDS);
  await chrome.storage.session.set({ usedIds: next });
  await chrome.storage.session.remove(["code", "checkedAt"]);
  await chrome.alarms.clear(EXPIRE_ALARM);
}

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== EXPIRE_ALARM) return;
  await chrome.storage.session.remove("code");
  await broadcast();
});

// ---------------------------------------------------------------------------
// Message handling. Every sender is checked: web pages can't message us at all
// (no externally_connectable), content scripts get a small, rate-limited API,
// and only extension pages (the popup) can sign in/out or change settings.
// ---------------------------------------------------------------------------

function isExtensionPage(s: chrome.runtime.MessageSender): boolean {
  return s.id === chrome.runtime.id && typeof s.url === "string" && s.url.startsWith(EXT_URL);
}

function isContentScript(s: chrome.runtime.MessageSender): s is chrome.runtime.MessageSender & { tab: chrome.tabs.Tab & { id: number }; frameId: number } {
  return (
    s.id === chrome.runtime.id &&
    typeof s.tab?.id === "number" &&
    typeof s.frameId === "number" &&
    !(s.url ?? "").startsWith(EXT_URL)
  );
}

function isMsg(m: unknown): m is { type: string; payload?: unknown } {
  return typeof m === "object" && m !== null && typeof (m as { type?: unknown }).type === "string";
}

function sanitizeSettings(p: unknown): Partial<Settings> {
  const out: Partial<Settings> = {};
  if (typeof p !== "object" || p === null) return out;
  for (const k of SETTING_KEYS) {
    const v = (p as Record<string, unknown>)[k];
    if (typeof v === "boolean") out[k] = v;
  }
  return out;
}

async function handlePopup(msg: PopupMsg): Promise<unknown> {
  switch (msg.type) {
    case "GET_STATE":
      return getState();
    case "SIGN_IN": {
      const token = await getToken(true);
      if (token) {
        const email = await getEmail().catch(() => "");
        await chrome.storage.session.set({ email });
      }
      void broadcast();
      return getState();
    }
    case "SIGN_OUT":
      await signOut();
      await chrome.alarms.clear(EXPIRE_ALARM);
      void broadcast();
      return getState();
    case "FETCH_NOW":
      void search(30_000);
      // Give the search a tick to flip the "searching" flag before replying.
      await new Promise((r) => setTimeout(r, 0));
      return getState();
    case "SET_SETTINGS":
      await chrome.storage.sync.set(sanitizeSettings(msg.payload));
      return true;
    default:
      return undefined;
  }
}

async function handleContent(
  msg: ContentMsg,
  sender: chrome.runtime.MessageSender & { tab: chrome.tabs.Tab & { id: number }; frameId: number },
): Promise<PillState | FillReply | undefined> {
  const tabId = sender.tab.id;
  const frameId = sender.frameId;

  switch (msg.type) {
    case "FIELD_FOCUSED": {
      const { autoDetect } = await getSettings();
      if (!autoDetect && msg.explicit !== true) return { status: "hidden" };
      if (!(await getToken(false))) return { status: "hidden" };

      const focus: Focus = {
        tabId,
        frameId,
        frameHost: hostOf(sender.url) || hostOf(sender.origin),
        topHost: hostOf(sender.tab.url),
        at: Date.now(),
      };
      // Never offer codes on non-web pages (file://, data:, etc).
      if (!focus.frameHost) return { status: "hidden" };
      await chrome.storage.session.set({ focus });

      const s = await session();
      if (!liveCode(s) && !searching && Date.now() - lastContentSearch > CONTENT_SEARCH_COOLDOWN_MS) {
        lastContentSearch = Date.now();
        void search(90_000);
        await new Promise((r) => setTimeout(r, 0));
      }
      return pillStateFor(focus);
    }

    case "FIELD_BLURRED": {
      const { focus } = await session();
      if (focus && focus.tabId === tabId && focus.frameId === frameId) {
        await chrome.storage.session.remove("focus");
      }
      return undefined;
    }

    case "FILL_REQUEST": {
      const s = await session();
      const focus = s.focus;
      // Only the frame that registered the focused field, recently, may fill.
      if (!focus || focus.tabId !== tabId || focus.frameId !== frameId) return { code: null };
      if (Date.now() - focus.at > FOCUS_TTL_MS) return { code: null };
      const code = liveCode(s);
      if (!code) return { code: null };
      await consumeCode(code);
      await chrome.storage.session.remove("focus");
      void broadcast();
      return { code: code.code };
    }

    default:
      return undefined;
  }
}

const POPUP_TYPES = new Set(["GET_STATE", "SIGN_IN", "SIGN_OUT", "FETCH_NOW", "SET_SETTINGS"]);
const CONTENT_TYPES = new Set(["FIELD_FOCUSED", "FIELD_BLURRED", "FILL_REQUEST"]);

chrome.runtime.onMessage.addListener((msg: unknown, sender, reply: (r: unknown) => void) => {
  if (!isMsg(msg)) return false;

  let work: Promise<unknown> | null = null;
  if (isExtensionPage(sender) && POPUP_TYPES.has(msg.type)) {
    work = handlePopup(msg as PopupMsg);
  } else if (isContentScript(sender) && CONTENT_TYPES.has(msg.type)) {
    work = handleContent(msg as ContentMsg, sender);
  }
  if (!work) return false; // unknown or unauthorised: ignore silently

  work.then(reply, (e) => {
    console.error("[codesafe]", e);
    reply(undefined);
  });
  return true; // keep the channel open for the async reply
});

// Nobody outside this extension may talk to it.
chrome.runtime.onMessageExternal?.addListener(() => false);
chrome.runtime.onConnectExternal?.addListener((port) => port.disconnect());

chrome.tabs.onRemoved.addListener(async (tabId) => {
  const { focus } = await session();
  if (focus?.tabId === tabId) await chrome.storage.session.remove("focus");
});

// Keyboard shortcut: ask the focused frame of the active tab to fill (it goes
// through the same FIELD_FOCUSED / FILL_REQUEST checks as a pill click).
chrome.commands.onCommand.addListener(async (command) => {
  if (command !== "paste-latest-code") return;
  if (!(await getToken(false))) return;
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id === undefined) return;
  const msg: ToContentMsg = { type: "PASTE_REQUEST" };
  chrome.tabs.sendMessage(tab.id, msg).catch(() => undefined);
  if (!liveCode(await session())) void search(30_000);
});

// Writing to the clipboard from a service worker needs an offscreen document.
async function copyViaOffscreen(text: string): Promise<void> {
  if (!CODE_RE.test(text)) return;
  try {
    const has = await chrome.offscreen.hasDocument();
    if (!has) {
      await chrome.offscreen.createDocument({
        url: "offscreen.html",
        reasons: [chrome.offscreen.Reason.CLIPBOARD],
        justification: "Copy the verification code to the clipboard",
      });
    }
    const msg: ToPageMsg = { type: "OFFSCREEN_COPY", payload: text };
    await chrome.runtime.sendMessage(msg);
  } catch (e) {
    console.warn("[codesafe] clipboard copy failed", e);
  } finally {
    await chrome.offscreen.closeDocument().catch(() => undefined);
  }
}

chrome.runtime.onInstalled.addListener(async () => {
  const s = await getSettings();
  await chrome.storage.sync.set(s);
});
