/**
 * Google sign-in through Chrome's identity API. We never see a password and
 * never store the token ourselves; Chrome caches it.
 */

export async function getToken(interactive: boolean): Promise<string | null> {
  try {
    const { token } = await chrome.identity.getAuthToken({ interactive });
    return token ?? null;
  } catch {
    // User closed the consent window, no Google account in Chrome, or
    // the client ID is misconfigured. All are "not signed in" from our view.
    return null;
  }
}

export async function getEmail(token: string): Promise<string> {
  const r = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/profile", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!r.ok) throw new Error(`profile ${r.status}`);
  const data = (await r.json()) as { emailAddress?: string };
  return data.emailAddress ?? "";
}

export async function signOut(): Promise<void> {
  let token: string | undefined;
  try {
    token = (await chrome.identity.getAuthToken({ interactive: false })).token;
  } catch {
    token = undefined;
  }
  if (token) {
    await chrome.identity.removeCachedAuthToken({ token });
    // Revoke at Google so CodeSafe disappears from the user's
    // "third-party access" list as well.
    await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(token)}`, {
      method: "POST",
    }).catch(() => undefined);
  }
  await chrome.identity.clearAllCachedAuthTokens();
  await chrome.storage.session.clear();
}

/** Fetch with the cached token; retry once with a fresh token on 401. */
export async function authedFetch(url: string): Promise<Response> {
  let token = await getToken(false);
  if (!token) throw new Error("signed-out");
  let r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (r.status === 401) {
    await chrome.identity.removeCachedAuthToken({ token });
    token = await getToken(false);
    if (!token) throw new Error("signed-out");
    r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  }
  return r;
}
