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

export function fillCode(target: HTMLInputElement, code: string, group: HTMLInputElement[]): void {
  if (group.length > 1) {
    const chars = code.split("");
    group.forEach((box, i) => {
      if (i < chars.length) fillBox(box, chars[i]);
    });
    const last = group[Math.min(chars.length, group.length) - 1];
    last?.focus();
    return;
  }
  target.focus();
  setValue(target, code);
  target.setSelectionRange?.(code.length, code.length);
}
