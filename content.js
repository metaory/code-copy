const ID = 'codecopy-toast';
const FONT = 'Vintaface-Regular';
const FONT_SRC = chrome.runtime.getURL('assets/Vintaface-Regular.woff2');
const SKIP = new Set(['HTML', 'BODY']);
const TOAST_MS = 300;
const TOAST = { copied: 'Copied', failed: 'Copy failed' };
const state = { ctrl: false, mark: null };

const injectFace = (url) => {
	const id = 'codecopy-font';
	if (document.getElementById(id)) return;
	const tag = Object.assign(document.createElement('style'), { id });
	tag.textContent = `@font-face{font-family:'${FONT}';src:url("${url}") format("woff2");font-weight:400;font-style:normal;font-display:swap}`;
	document.documentElement.append(tag);
};

const fontReady = fetch(FONT_SRC)
	.then((r) => (r.ok ? r.blob() : Promise.reject(new Error(`font ${r.status}`))))
	.then((blob) => {
		const url = URL.createObjectURL(blob);
		injectFace(url);
		return document.fonts.load(`32px '${FONT}'`);
	})
	.catch(console.error);

const toast = {
	el: null,
	timer: 0,
	show(msg) {
		Promise.resolve(fontReady).finally(() => {
			if (!this.el) this.el = Object.assign(document.createElement('div'), { id: ID, ariaLive: 'polite' });
			if (!this.el.isConnected) document.body.append(this.el);
			this.el.textContent = msg;
			this.el.classList.add('show');
			clearTimeout(this.timer);
			this.timer = setTimeout(() => this.el.classList.remove('show'), TOAST_MS);
		});
	},
};

const own = (el) => el?.closest?.(`#${ID}`);
const hasText = (el) => Boolean(el?.innerText?.trim());

const when = (node, ok, find = (n) => n) => {
	const n = node instanceof Element ? node : null;
	return n && ok(n) ? find(n) || null : null;
};

const pickable = (n) => !own(n) && !SKIP.has(n.tagName) && hasText(n);

const codeBlock = (n) => {
	const c = n.closest('code');
	if (c) return hasText(c) ? c : null;
	const p = n.closest('pre');
	if (!p || p.querySelector('code')) return null;
	return hasText(p) ? p : null;
};

const pick = (x, y) => when(document.elementFromPoint(x, y), pickable);
const code = (t) => when(t, (n) => !own(n), codeBlock);
const hit = (e) => (state.ctrl ? pick(e.clientX, e.clientY) : code(e.target));

const notify = (msg, ok) => { toast.show(msg); return ok; };

const copy = (el) => (hasText(el)
	? navigator.clipboard.writeText(el.innerText)
		.then(() => notify(TOAST.copied, true))
		.catch(() => notify(TOAST.failed, false))
	: Promise.resolve(false));

const mark = (el) => {
	if (state.mark === el) return;
	state.mark?.classList.remove('codecopy-x');
	state.mark = el;
	el?.classList.add('codecopy-x');
};

const setCtrl = (on) => {
	state.ctrl = on;
	document.documentElement.classList.toggle('codecopy-ctrl', on);
	if (!on) mark(null);
};

const swallow = (e) => {
	e.preventDefault();
	e.stopPropagation();
};

const onKey = (e, down) => {
	if (e.key !== 'Control') return;
	setCtrl(down);
};

const onClick = (e) => {
	const el = hit(e);
	if (!el || e.defaultPrevented) return;
	copy(el).then((ok) => ok && swallow(e));
};

const listeners = [
	['keydown', (e) => onKey(e, true)],
	['keyup', (e) => onKey(e, false)],
	['blur', () => setCtrl(false)],
	['mousemove', (e) => state.ctrl && mark(hit(e))],
	['click', onClick, { capture: true }],
];

for (const [name, fn, opts] of listeners) window.addEventListener(name, fn, opts);
