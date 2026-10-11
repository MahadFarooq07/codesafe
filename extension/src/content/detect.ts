/** Unambiguous verification-code wording. */
const STRONG_RE =
  /(otp|one[-_ ]?time|verif|passcode|security[-_ ]?code|auth[-_ ]?code|confirm(ation)?[-_ ]?code|2fa|mfa|totp)/i;
/** Wording that is often, but not always, a verification code. */
const WEAK_RE = /(\bpin\b|\bcode\b|\bdigit)/i;

/** Fields that say "code" but are not verification codes. */
const NOT_OTP_RE =
  /(promo|coupon|discount|voucher|gift|referral|invite|zip|postal|post[-_ ]?code|country|area[-_ ]?code|cvv|cvc|csc|iban|swift|sort[-_ ]?code|captcha|search)/i;

const TEXT_TYPES = new Set(["text", "tel", "number", "password"]);

/** True when the element is actually rendered and big enough to be a real field. */
export function isVisible(el: HTMLElement): boolean {
  if (!el.isConnected) return false;
  const r = el.getBoundingClientRect();
  if (r.width < 8 || r.height < 8) return false;
  if (typeof el.checkVisibility === "function") {
    return el.checkVisibility({ opacityProperty: true, visibilityProperty: true, contentVisibilityAuto: true });
  }
  const cs = getComputedStyle(el);
  return cs.visibility !== "hidden" && cs.display !== "none" && Number(cs.opacity) > 0.1;
}

/** A plain text-like input the user can type into. */
export function isFillable(el: EventTarget | Element | null): el is HTMLInputElement {
  return (
    el instanceof HTMLInputElement &&
    TEXT_TYPES.has(el.type) &&
    !el.disabled &&
    !el.readOnly &&
    isVisible(el)
  );
}

/** Reads only the attributes of the input; never its value or the page. */
export function isOtpInput(el: EventTarget | Element | null): el is HTMLInputElement {
  if (!isFillable(el)) return false;
  if (el.autocomplete === "one-time-code") return true;

  const label = [
    el.name,
    el.id,
    el.placeholder,
    el.getAttribute("aria-label"),
    el.getAttribute("aria-labelledby") ? labelledByText(el) : "",
    el.getAttribute("data-testid"),
    el.getAttribute("data-test"),
    typeof el.className === "string" ? el.className : "",
  ]
    .filter(Boolean)
    .join(" ")
    .slice(0, 500);
  const associated = associatedLabelText(el);
  if (STRONG_RE.test(label)) return true;
  if (el.autocomplete && /\b(postal-code|tel|cc-|email|username|current-password|new-password)/.test(el.autocomplete)) return false;
  if (NOT_OTP_RE.test(label) || NOT_OTP_RE.test(associated)) return false;

  if (WEAK_RE.test(label)) return true;
  if (el.inputMode === "numeric" && el.maxLength >= 4 && el.maxLength <= 8) return true;
  if (el.maxLength === 1 && (el.inputMode === "numeric" || el.pattern.includes("0-9") || el.type === "tel")) {
    return otpGroup(el).length >= 4;
  }
  return associated ? STRONG_RE.test(associated) || WEAK_RE.test(associated) : false;
}

function labelledByText(el: HTMLInputElement): string {
  const ids = (el.getAttribute("aria-labelledby") ?? "").split(/\s+/).slice(0, 5);
  return ids.map((id) => document.getElementById(id)?.textContent ?? "").join(" ").slice(0, 200);
}

function associatedLabelText(el: HTMLInputElement): string {
  const parts: string[] = [];
  el.labels?.forEach((l) => parts.push(l.textContent ?? ""));
  return parts.join(" ").slice(0, 200);
}

function singleBoxes(root: ParentNode): HTMLInputElement[] {
  return Array.from(root.querySelectorAll<HTMLInputElement>("input")).filter(
    (i) => i.maxLength === 1 && TEXT_TYPES.has(i.type) && !i.disabled && isVisible(i),
  );
}

/** If the field is one of N single-character boxes, return the whole group in DOM order. */
export function otpGroup(el: HTMLInputElement): HTMLInputElement[] {
  if (el.maxLength !== 1) return [el];
  const root = el.form ?? el.closest("fieldset, [role=group], div, section") ?? document.body;
  const boxes = singleBoxes(root);
  if (boxes.length >= 4 && boxes.length <= 8 && boxes.includes(el)) return boxes;

  // Walk up once more in case the immediate container holds only this box.
  const parent = root.parentElement;
  if (parent) {
    const wider = singleBoxes(parent);
    if (wider.length >= 4 && wider.length <= 8 && wider.includes(el)) return wider;
  }
  return [el];
}
