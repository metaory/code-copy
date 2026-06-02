# CodeCopy

CodeCopy is a Chrome extension that copies `innerText` from page elements to the clipboard. No popup, no options page — just click.

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