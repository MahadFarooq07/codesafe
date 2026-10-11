export interface FoundCode {
  /** The extracted code, e.g. "482193". */
  code: string;
  /** Sender domain only, e.g. "stripe.com". The full address is never kept. */
  sender: string;
  /** Subject, trimmed to 60 characters. */
  subject: string;
  /** Epoch ms the message was received. */
  receivedAt: number;
  /** Epoch ms after which the code is wiped from session storage. */
  expiresAt: number;
}

export interface Settings {
  /** Show the pill when an OTP field is focused. */
  autoDetect: boolean;
  /** Copy the code to the clipboard as soon as it is found. */
  autoCopy: boolean;
}

export const DEFAULT_SETTINGS: Settings = { autoDetect: true, autoCopy: false };

export type State =
  | { status: "signed-out" }
  | { status: "idle"; email: string }
  | { status: "searching"; email: string }
  | { status: "found"; email: string; code: FoundCode }
  | { status: "none"; email: string; checkedAt: number }
  | { status: "error"; email: string; message: string };

export type Msg =
  | { type: "OTP_FIELD_FOCUSED" }
  | { type: "FETCH_NOW" }
  | { type: "GET_STATE" }
  | { type: "SIGN_IN" }
  | { type: "SIGN_OUT" }
  | { type: "SET_SETTINGS"; payload: Partial<Settings> }
  | { type: "STATE"; payload: State }
  | { type: "PASTE_CODE"; payload: string }
  | { type: "OFFSCREEN_COPY"; payload: string };
