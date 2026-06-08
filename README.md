<div align="center">
  <img src="icons/icon128.png" width="96" height="96" alt="Code Copy logo">
  <h1>Code Copy</h1>
  <img src="assets/promo-small.png" />
  <p><strong>Click code to copy.</strong> Hold <kbd>Alt</kbd> to copy text from any element.</p>
  <p>No popup, no options page - only a toolbar toggle.</p>
</div>

---

Chrome extension (Manifest V3) that copies **innerText** to the clipboard.

## Usage

### Enable on a page

Click the **toolbar icon** or press **Alt+Shift+C** once on each page you want to use. After a full navigation, enable again.

**Optional:** on the welcome page, **Enable on all sites** skips the per-page step on every http/https page.

### Toolbar

- **On** — full-color icon; tooltip *Code Copy (active — click to deactivate)*.
- **Off** — grayscale icon; click to turn copying back on.
- State is stored for the **browser session** (`chrome.storage.session`): it resets when you quit the browser.

### Code blocks

Click a `<code>` element, or a `<pre>` that has **no** nested `<code>` and contains text. Successful copies show a short **Copied** toast and a brief highlight on the block.

### Any element

1. Hold **Alt**: the page shows a copy cursor; elements with text under the pointer are outlined.
2. **Click** while Alt is held, copies that element’s innerText (skips empty nodes and `<html>` / `<body>`).

### Feedback

Centered toast: **Copied** or **Copy failed** (clipboard denied or unavailable).

## Scope

| Runs on | Does not run on |
|--------|------------------|
| `http://` and `https://` pages (after enable) | `file://`, `chrome://`, Web Store, etc. |
| Most public sites | `localhost`, `127.0.0.1`, `0.0.0.0` (excluded when always-on is granted) |

Copies visible text as **innerText** (layout-aware), not HTML source or `textContent` alone.

## Install

**Work in progress** ; Chrome Web Store link and ID below are placeholders.

<div align="center">
  <a href="https://chrome.google.com/webstore/detail/codecopy/abcdefghijklmnopqrstuvwxyzabcdef">
    <img src="https://storage.googleapis.com/chrome-gcs-uploader-uploads-developer-tools-chrome-extensions/ChromeWebStore_BadgeWBorder_v2_206x58.png" width="206" height="58" alt="Available in the Chrome Web Store">
  </a>
</div>

### Development

1. Open `chrome://extensions` → enable **Developer mode** → **Load unpacked** → this directory.
2. On first load, a **welcome** tab opens with a short usage guide (`welcome.html`).
3. After code changes, use **Reload** on the extension card, then re-enable on the tab (toolbar click or Alt+Shift+C).

To open the welcome page again: remove the extension and load unpacked, or run `chrome.tabs.create({ url: chrome.runtime.getURL('welcome.html') })` from the service worker console on `chrome://extensions`.

To exercise the extension on a machine-local app, grant always-on from the welcome page and temporarily allow localhost in `worker.js` `EXCLUDE`, or use a non-localhost URL.

## Permissions

| Permission | Why |
|------------|-----|
| `activeTab` | Inject copy handlers on the current tab after toolbar click or Alt+Shift+C |
| `storage` | Session on/off toggle |
| `scripting` | Inject bundled CSS and JS |
| `tabs` | Sync toggle, welcome page on install |
| Optional `http://*/*`, `https://*/*` | User-initiated always-on via welcome page |

## License

[MIT](LICENSE)
