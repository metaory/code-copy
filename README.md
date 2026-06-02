<div align="center">
  <img src="icons/icon128.png" width="96" height="96" alt="Live CSS Queries logo">
  <h1>CodeCopy</h1>
  <p>CodeCopy is a Chrome extension</p>
  <p>that <strong>copies `innerText`</strong> from page elements to the clipboard</p>
  <p>No popup, no options page - just click</p>
</div>
  
---

## Modes

### Code Block Copy

Click any `<code>` element, or a bare `<pre>` without a nested `<code>`.

For `<pre><code>…</code></pre>`, the inner `<code>` is copied.

Empty blocks are ignored.

### Element Copy

Hold **Ctrl** and move the mouse — elements with visible text get an outline.

**Ctrl + click** copies that element's `innerText`. Release Ctrl to exit pick mode.

## Feedback

A centered toast confirms **Copied** or **Copy failed**. That is the only UI.

## Install

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select this directory

Reload the extension after code changes.

## Notes

- Runs on all URLs except `localhost` and loopback (see `exclude_matches` in the manifest).
- Clipboard access requires a user click; nothing is sent off-page.
- Enable or disable the extension from Chrome's extension toolbar.


## License
[MIT](LICENSE)
