const NAME_RE =
  /(otp|one[-_ ]?time|verif|passcode|security[-_ ]?code|auth[-_ ]?code|confirm(ation)?[-_ ]?code|2fa|mfa|totp|\bpin\b|\bcode\b|\bdigit)/i;

const TEXT_TYPES = new Set(["text", "tel", "number", "password", ""]);

/** Reads only the attributes of the input; never its value or the page. */
export function isOtpInput(el: EventTarget | Element | null): el is HTMLInputElement {
  if (!(el instanceof HTMLInputElement)) return false;
  if (!TEXT_TYPES.has(el.type)) return false;
  if (el.disabled || el.readOnly) return false;
  if (el.autocomplete === "one-time-code") return true;

  const label = [
    el.name,
    el.id,
    el.placeholder,
    el.getAttribute("aria-label"),
    el.getAttribute("aria-labelledby") ? labelledByText(el) : "",
    el.getAttribute("data-testid"),
    el.getAttribute("data-test"),
    el.className,
  ]
    .filter(Boolean)
    .join(" ");
  if (NAME_RE.test(label)) return true;

  if (el.inputMode === "numeric" && el.maxLength > 0 && el.maxLength <= 8) return true;
  if (el.maxLength === 1 && (el.inputMode === "numeric" || el.pattern.includes("0-9") || el.type === "tel")) return true;

  const associated = associatedLabelText(el);
  return associated ? NAME_RE.test(associated) : false;
}

function labelledByText(el: HTMLInputElement): string {
  const ids = (el.getAttribute("aria-labelledby") ?? "").split(/\s+/);
  return ids.map((id) => document.getElementById(id)?.textContent ?? "").join(" ");
}

function associatedLabelText(el: HTMLInputElement): string {
  const parts: string[] = [];
  el.labels?.forEach((l) => parts.push(l.textContent ?? ""));
  return parts.join(" ").slice(0, 200);
}

/** If the field is one of N single-character boxes, return the whole group in DOM order. */
export function otpGroup(el: HTMLInputElement): HTMLInputElement[] {
  if (el.maxLength !== 1) return [el];
  const root = el.form ?? el.closest("fieldset, [role=group], div, section") ?? document.body;
  const boxes = Array.from(root.querySelectorAll<HTMLInputElement>("input")).filter(
    (i) => i.maxLength === 1 && TEXT_TYPES.has(i.type) && i.offsetParent !== null,
  );
  if (boxes.length >= 4 && boxes.length <= 8) return boxes;

  // Walk up once more in case the immediate container holds only this box.
  const parent = root.parentElement;
  if (parent) {
    const wider = Array.from(parent.querySelectorAll<HTMLInputElement>("input")).filter(
      (i) => i.maxLength === 1 && TEXT_TYPES.has(i.type) && i.offsetParent !== null,
    );
    if (wider.length >= 4 && wider.length <= 8) return wider;
  }
  return [el];
}
