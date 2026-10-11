import type { Msg } from "../shared/types";

// Minimal offscreen document: receives a string and puts it on the clipboard.
chrome.runtime.onMessage.addListener((msg: Msg) => {
  if (msg.type !== "OFFSCREEN_COPY") return;
  const ta = document.createElement("textarea");
  ta.value = msg.payload;
  document.body.append(ta);
  ta.select();
  document.execCommand("copy");
  ta.remove();
});
