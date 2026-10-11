export interface FoundCode {
  /** The extracted code, e.g. "482193". Always matches CODE_RE. */
  code: string;
  /** Sender domain only, e.g. "stripe.com". The full address is never kept. */
  sender: string;
  /** True when Gmail reports the sender passed DMARC (or SPF+DKIM aligned). */
  verified: boolean;
  /** Gmail message id, kept so a used code is never offered twice. */
  messageId: string;
  /** Epoch ms the message was received. */
  receivedAt: number;
  /** Epoch ms after which the code is wiped from session storage. */
  expiresAt: number;
}

/** The only shape a code may ever have once it leaves the extractor. */
export const CODE_RE = /^[A-Z0-9]{4,8}$/;

export interface Settings {
  /** Show the pill when an OTP field is focused. */
  autoDetect: boolean;
  /** Copy the code to the clipboard as soon as it is found. */
  autoCopy: boolean;
}

export const DEFAULT_SETTINGS: Settings = { autoDetect: true, autoCopy: false };
export const SETTING_KEYS = Object.keys(DEFAULT_SETTINGS) as (keyof Settings)[];

/** Full state. Only ever sent to extension pages (the popup), never to web pages. */
export type State =
  | { status: "signed-out" }
  | { status: "idle"; email: string }
  | { status: "searching"; email: string }
  | { status: "found"; email: string; code: FoundCode }
  | { status: "none"; email: string; checkedAt: number }
  | { status: "error"; email: string; message: string };

/**
 * What a content script is allowed to know. No email address, and the code
 * only once one has been found for the frame that asked.
 */
export type PillState =
  | { status: "hidden" }
  | { status: "searching" }
  | {
      status: "found";
      code: string;
      sender: string;
      /** Sender's site matches the page's site and the sender is verified. */
      trusted: boolean;
    };

/** Messages from the popup (an extension page) to the service worker. */
export type PopupMsg =
  | { type: "GET_STATE" }
  | { type: "SIGN_IN" }
  | { type: "SIGN_OUT" }
  | { type: "FETCH_NOW" }
  | { type: "SET_SETTINGS"; payload: Partial<Settings> };

/** Messages from a content script to the service worker. */
export type ContentMsg =
  /** explicit: the user pressed the shortcut, so show even if auto-detect is off. */
  | { type: "FIELD_FOCUSED"; explicit?: boolean }
  | { type: "FIELD_BLURRED" }
  /** Sent only after a trusted click on the pill or the keyboard shortcut. */
  | { type: "FILL_REQUEST" };

/** Messages from the service worker to a content script. */
export type ToContentMsg =
  | { type: "PILL_STATE"; payload: PillState }
  /** Shortcut pressed: the focused frame should ask for the code. */
  | { type: "PASTE_REQUEST" };

/** Messages from the service worker to the popup and the offscreen document. */
export type ToPageMsg =
  | { type: "STATE"; payload: State }
  | { type: "OFFSCREEN_COPY"; payload: string };

export interface FillReply {
  code: string | null;
}
