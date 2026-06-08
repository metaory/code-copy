# Privacy Policy — Code Copy

Last updated: June 7, 2026

## Summary

Code Copy does not collect, sell, or transmit personal data or browsing history. The extension runs locally in your browser. Text is copied to your clipboard only when you click a code block or Alt-click an element.

## Data We Store

The extension stores one preference on your device:

| Data | Where | Purpose | Retention |
|------|-------|---------|-----------|
| Active/inactive toggle state | `chrome.storage.session` | Remember whether copying is enabled for the current browser session | Cleared when you quit the browser |

This data never leaves your device and is not synced to your Google account.

## Data We Do Not Collect

Code Copy does not:

- Log or store the text you copy
- Record URLs, page titles, or browsing history
- Send data to any server
- Use analytics, telemetry, or third-party services
- Use cookies

## How the Extension Uses Page Access

Code Copy requests access to web pages only after you click the toolbar icon, press Alt+Shift+C, or optionally grant always-on from the welcome page. It can:

- Detect clicks on `<code>` and `<pre>` elements
- Copy visible text (`innerText`) to your clipboard when you choose to copy
- Show on-page feedback (toast and highlight) after a copy

The extension reads page content only in response to your clicks. It does not scan, index, or upload page content in the background.

Local development URLs (`localhost`, `127.0.0.1`, `0.0.0.0`) are excluded by default.

## Permissions

| Permission | Why |
|------------|-----|
| `activeTab` | Inject copy handlers on the current tab after toolbar click or Alt+Shift+C |
| `storage` | Save the on/off toggle for the current browser session |
| `scripting` | Inject bundled CSS and JS on user gesture or after optional always-on |
| `tabs` | Find open tabs and read tab URLs to sync the toggle state |
| Optional host (`http://*/*`, `https://*/*`) | User-initiated always-on; auto-inject on pages without per-tab enable |

## Third-Party Services

This extension does not use third-party services. The only network requests are for the extension’s own packaged assets (icons and fonts).

## Data Sharing

We do not share any data with third parties. There is no data to share.

## Your Controls

- **Stop copying:** Click the toolbar icon to deactivate the extension.
- **Clear stored state:** Quit the browser (session storage is cleared automatically).
- **Remove the extension:** Uninstall from `chrome://extensions` to remove all extension data.

## Children

Code Copy is not directed at children under 13 and does not knowingly collect information from anyone.

## Changes

If this policy changes, the updated version will be published in this repository with a revised “Last updated” date.

## Contact

Privacy questions: [metaory@gmail.com](mailto:metaory@gmail.com)
