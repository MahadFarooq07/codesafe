/**
 * Google sign-in. Two paths, both handled entirely by the browser:
 *
 *  1. chrome.identity.getAuthToken: Google Chrome only. Chrome caches and
 *     refreshes the token; we never store it.
 *  2. chrome.identity.launchWebAuthFlow: every Chromium browser (Edge, Brave,
 *     Arc, ...). Used only if a "Web application" client ID was configured at
 *     build time. The short-lived access token is kept in session storage
 *     (memory only, inaccessible to content scripts) and validated against
 *     Google's tokeninfo endpoint before first use.
 *
 * We never see a password, and the only scope ever requested is gmail.readonly.
 */

declare const __CODESAFE_WEB_CLIENT_ID__: string;

const SCOPE = "https://www.googleapis.com/auth/gmail.readonly";
const WEB_CLIENT_ID = typeof __CODESAFE_WEB_CLIENT_ID__ === "string" ? __CODESAFE_WEB_CLIENT_ID__ : "";

interface WebToken {
  token: string;
  expiresAt: number;
}

async function chromeToken(interactive: boolean): Promise<string | null> {
  try {
    const { token, grantedScopes } = await chrome.identity.getAuthToken({ interactive, scopes: [SCOPE] });
    if (!token) return null;
    // Refuse a token that somehow lacks the scope we asked for.
    if (grantedScopes && !grantedScopes.includes(SCOPE)) return null;
    return token;
  } catch {
    // Consent window closed, no Google account in Chrome, getAuthToken not
    // supported by this browser, or the client ID is misconfigured.
    return null;
  }
}

async function readWebToken(): Promise<string | null> {
  const { webToken } = (await chrome.storage.session.get("webToken")) as { webToken?: WebToken };
  // Treat tokens as expired a minute early so a request never races expiry.
  if (webToken && webToken.expiresAt - 60_000 > Date.now()) return webToken.token;
  return null;
}

async function verifyWebToken(token: string): Promise<boolean> {
  const r = await fetch("https://oauth2.googleapis.com/tokeninfo", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ access_token: token }),
  }).catch(() => null);
  if (!r?.ok) return false;
  const info = (await r.json()) as { aud?: string; azp?: string; scope?: string };
  // Defends against token substitution: the token must have been issued to us.
  const audience = info.aud ?? info.azp;
  return audience === WEB_CLIENT_ID && (info.scope ?? "").split(" ").includes(SCOPE);
}

async function webFlowToken(interactive: boolean): Promise<string | null> {
  if (!WEB_CLIENT_ID) return null;
  const cached = await readWebToken();
  if (cached) return cached;

  const state = crypto.randomUUID();
  const auth = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  auth.search = new URLSearchParams({
    client_id: WEB_CLIENT_ID,
    response_type: "token",
    redirect_uri: chrome.identity.getRedirectURL(),
    scope: SCOPE,
    state,
    include_granted_scopes: "false",
    ...(interactive ? { prompt: "select_account" } : { prompt: "none" }),
  }).toString();

  let redirect: string | undefined;
  try {
    redirect = await chrome.identity.launchWebAuthFlow({ url: auth.toString(), interactive });
  } catch {
    return null;
  }
  if (!redirect || !redirect.startsWith(chrome.identity.getRedirectURL())) return null;

  const params = new URLSearchParams(new URL(redirect).hash.slice(1));
  // CSRF protection: the response must carry the state we generated.
  if (params.get("state") !== state) return null;
  const token = params.get("access_token");
  const expiresIn = Number(params.get("expires_in") ?? "0");
  if (!token || !(expiresIn > 0)) return null;
  if (!(await verifyWebToken(token))) return null;

  const webToken: WebToken = { token, expiresAt: Date.now() + expiresIn * 1000 };
  await chrome.storage.session.set({ webToken });
  return token;
}

export async function getToken(interactive: boolean): Promise<string | null> {
  const viaChrome = await chromeToken(interactive);
  if (viaChrome) return viaChrome;
  return webFlowToken(interactive);
}

async function invalidate(token: string): Promise<void> {
  await chrome.identity.removeCachedAuthToken({ token }).catch(() => undefined);
  const { webToken } = (await chrome.storage.session.get("webToken")) as { webToken?: WebToken };
  if (webToken?.token === token) await chrome.storage.session.remove("webToken");
}

async function revoke(token: string): Promise<void> {
  // Token goes in the POST body, never the URL, so it can't end up in logs.
  await fetch("https://oauth2.googleapis.com/revoke", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ token }),
  }).catch(() => undefined);
}

export async function signOut(): Promise<void> {
  const tokens = new Set<string>();
  const chromeTok = await chromeToken(false);
  if (chromeTok) tokens.add(chromeTok);
  const webTok = await readWebToken();
  if (webTok) tokens.add(webTok);

  for (const token of tokens) {
    await invalidate(token);
    // Revoke at Google so CodeSafe disappears from the user's
    // "third-party access" list as well.
    await revoke(token);
  }
  await chrome.identity.clearAllCachedAuthTokens().catch(() => undefined);
  await chrome.storage.session.clear();
}

/** Fetch with the cached token; retry once with a fresh token on 401. */
export async function authedFetch(url: string): Promise<Response> {
  let token = await getToken(false);
  if (!token) throw new Error("signed-out");
  const init = (t: string): RequestInit => ({
    headers: { Authorization: `Bearer ${t}` },
    credentials: "omit",
    cache: "no-store",
    referrerPolicy: "no-referrer",
  });
  let r = await fetch(url, init(token));
  if (r.status === 401) {
    await invalidate(token);
    token = await getToken(false);
    if (!token) throw new Error("signed-out");
    r = await fetch(url, init(token));
  }
  return r;
}

export async function getEmail(): Promise<string> {
  const r = await authedFetch("https://gmail.googleapis.com/gmail/v1/users/me/profile");
  if (!r.ok) throw new Error(`profile ${r.status}`);
  const data = (await r.json()) as { emailAddress?: string };
  return typeof data.emailAddress === "string" ? data.emailAddress.slice(0, 254) : "";
}
