// Use the prototype setter so React/Vue/Svelte controlled inputs notice the change.
const nativeSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;

function setValue(input: HTMLInputElement, value: string): void {
  if (nativeSetter) nativeSetter.call(input, value);
  else input.value = value;
  input.dispatchEvent(new InputEvent("input", { bubbles: true, data: value, inputType: "insertText" }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

/** Simulate a keystroke for each digit so split-box UIs that auto-advance on keyup behave. */
function fillBox(box: HTMLInputElement, ch: string): void {
  box.focus();
  box.dispatchEvent(new KeyboardEvent("keydown", { key: ch, bubbles: true }));
  setValue(box, ch);
  box.dispatchEvent(new KeyboardEvent("keyup", { key: ch, bubbles: true }));
}

/** Fills only the given field (or its split-box group); never anything else on the page. */
export function fillCode(target: HTMLInputElement, code: string, group: HTMLInputElement[]): void {
  if (!target.isConnected) return;
  if (group.length > 1) {
    const chars = code.split("");
    group.forEach((box, i) => {
      if (i < chars.length && box.isConnected) fillBox(box, chars[i]);
    });
    const last = group[Math.min(chars.length, group.length) - 1];
    last?.focus();
    return;
  }
  target.focus();
  // Respect maxlength so we never overflow into a neighbouring field.
  const value = target.maxLength > 0 ? code.slice(0, target.maxLength) : code;
  setValue(target, value);
  try {
    target.setSelectionRange(value.length, value.length);
  } catch {
    // type="number" inputs don't support selection ranges.
  }
}
