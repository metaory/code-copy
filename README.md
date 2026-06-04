<div align="center">
  <img src="icons/icon128.png" width="96" height="96" alt="Code Copy logo">
  <h1>Code Copy</h1>
  <p><strong>Click code to copy.</strong> Hold <kbd>Alt</kbd> to copy text from any element.</p>
  <p>No popup, no options page — only a toolbar toggle.</p>
</div>

---

Chrome extension (Manifest V3) that copies **innerText** to the clipboard. Active by default.

## Usage

### Toolbar

- **On** — badge **●**, tooltip *Code Copy (active — click to deactivate)*.
- **Off** — no badge; click the icon to turn copying back on.
- State is stored for the **browser session** (`chrome.storage.session`): it resets when you quit the browser. New tabs pick up the current on/off state.

### Code blocks

Click a `<code>` element, or a `<pre>` that has **no** nested `<code>` and contains text. Successful copies show a short **Copied** toast and a brief highlight on the block.

### Any element

1. Hold **Alt** — the page shows a copy cursor; elements with text under the pointer are outlined.
2. **Click** while Alt is held — copies that element’s innerText (skips empty nodes and `<html>` / `<body>`).

### Feedback

Centered toast: **Copied** or **Copy failed** (clipboard denied or unavailable).

## Scope

| Runs on | Does not run on |
|--------|------------------|
| `http://` and `https://` pages | `file://`, `chrome://`, Web Store, etc. |
| Most public sites | `localhost`, `127.0.0.1`, `0.0.0.0` (excluded in `manifest.json` for local dev) |

Copies visible text as **innerText** (layout-aware), not HTML source or `textContent` alone.

## Install

**Work in progress** — Chrome Web Store link and ID below are placeholders.

<div align="center">
  <a href="https://chrome.google.com/webstore/detail/codecopy/abcdefghijklmnopqrstuvwxyzabcdef">
    <img src="https://storage.googleapis.com/chrome-gcs-uploader-uploads-developer-tools-chrome-extensions/ChromeWebStore_BadgeWBorder_v2_206x58.png" width="206" height="58" alt="Available in the Chrome Web Store">
  </a>
</div>

### Development

1. Open `chrome://extensions` → enable **Developer mode** → **Load unpacked** → this directory.
2. After code changes, use **Reload** on the extension card (content scripts refresh on the next navigation or tab reload).

To exercise the extension on a machine-local app, either use a non-localhost URL or temporarily remove the `exclude_matches` entries in `manifest.json`.

## License

[MIT](LICENSE)
