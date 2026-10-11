/**
 * CodeSafe design tokens. Shared by the popup stylesheet (via build-time
 * substitution) and the content-script pill (injected into its shadow root).
 */
export const TOKENS_CSS = `
:host, :root {
  --bg: #ffffff;
  --bg-page: #fbfdff;
  --bg-hover: #f5f5f7;
  --text: #1b1c1d;
  --text-2: #6e6e73;
  --hairline: rgba(0, 0, 0, 0.08);
  --accent: #0a84ff;
  --success: #34c759;
  --danger: #ff3b30;
  --r-input: 12px;
  --r-card: 16px;
  --r-pill: 999px;
  --shadow-float: 0 1px 2px rgba(0, 0, 0, 0.04), 0 8px 24px rgba(0, 0, 0, 0.08);
  --ease: cubic-bezier(0.2, 0.8, 0.2, 1);
  --font: -apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Helvetica Neue", Inter, "Segoe UI", Roboto, sans-serif;
}
`;
