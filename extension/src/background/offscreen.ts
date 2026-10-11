import { CODE_RE, type ToPageMsg } from "../shared/types";

const EXT_URL = chrome.runtime.getURL("");

// Minimal offscreen document: puts a verification code on the clipboard.
// Only the service worker may ask, and only for something shaped like a code.
chrome.runtime.onMessage.addListener((msg: ToPageMsg, sender, reply) => {
  if (msg?.type !== "OFFSCREEN_COPY") return false;
  if (sender.id !== chrome.runtime.id || sender.tab || !(sender.url ?? "").startsWith(EXT_URL)) return false;
  if (typeof msg.payload !== "string" || !CODE_RE.test(msg.payload)) return false;

  const ta = document.createElement("textarea");
  ta.value = msg.payload;
  document.body.append(ta);
  ta.select();
  document.execCommand("copy");
  ta.value = "";
  ta.remove();
  reply(true);
  return false;
});
