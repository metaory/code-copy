const ID = 'codecopy-toast';
const FONT = 'Vintaface-Regular';
const FONT_SRC = chrome.runtime.getURL('assets/Vintaface-Regular.woff2');
const SKIP = new Set(['HTML', 'BODY']);
const SHINE_MS = 200; // matches --cc-shine in content.css
const TOAST = {
	copied: { body: 'Copied', ms: 600 },
	failed: { body: 'Copy failed', ms: 600 },
	off: { body: 'Code Copy Deactivated', ms: 2_000 },
	on: {
		title: 'Code Copy Activated',
		tips: [
			'Single left mouse click on code elements to copy',
			'Hold Alt and left mouse click on any element to copy',
		],
		ms: 4_000,
	},
};
const state = { alt: false, mark: null, on: false };

const pulse = (ms) => {
	let t = 0;
	return (fn) => {
		clearTimeout(t);
		t = setTimeout(fn, ms);
	};
};

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

let toastEl = null;
let hideT = 0;

const renderToast = (root, spec) => {
	root.replaceChildren();
	if (spec.body) {
		root.textContent = spec.body;
		return;
	}
	const title = Object.assign(document.createElement('div'), { className: 'codecopy-toast-title', textContent: spec.title });
	const tips = Object.assign(document.createElement('div'), { className: 'codecopy-toast-tips' });
	tips.replaceChildren(...spec.tips.map((line) => Object.assign(document.createElement('div'), { textContent: `• ${line}` })));
	root.append(title, tips);
};

const showToast = (spec) => {
	fontReady.finally(() => {
		if (!toastEl) toastEl = Object.assign(document.createElement('div'), { id: ID, ariaLive: 'polite' });
		if (!toastEl.isConnected) document.body.append(toastEl);
		renderToast(toastEl, spec);
		toastEl.classList.add('show');
		clearTimeout(hideT);
		hideT = setTimeout(() => toastEl.classList.remove('show'), spec.ms ?? 600);
	});
};

const endShine = pulse(SHINE_MS);
const shine = (el) => {
	el.classList.remove('codecopy-shine');
	void el.offsetWidth;
	el.classList.add('codecopy-shine');
	endShine(() => el.classList.remove('codecopy-shine'));
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
	if (c && hasText(c)) return c;
	const p = n.closest('pre');
	return p && !p.querySelector('code') && hasText(p) ? p : null;
};

const pick = (x, y) => when(document.elementFromPoint(x, y), pickable);
const code = (t) => when(t, (n) => !own(n), codeBlock);
const mod = (e) => state.alt || e.altKey;
const hit = (e) => (mod(e) ? pick(e.clientX, e.clientY) : code(e.target));

const notify = (msg, ok, el) => {
	showToast(msg);
	if (ok && !state.alt && el) shine(el);
	return ok;
};

const copy = (el) => (hasText(el)
	? navigator.clipboard.writeText(el.innerText)
		.then(() => notify(TOAST.copied, true, el))
		.catch(() => notify(TOAST.failed, false))
	: Promise.resolve(false));

const mark = (el) => {
	if (state.mark === el) return;
	state.mark?.classList.remove('codecopy-x');
	state.mark = el;
	el?.classList.add('codecopy-x');
};

const setAlt = (on) => {
	state.alt = on;
	document.documentElement.classList.toggle('codecopy-alt', on);
	if (!on) mark(null);
};

const swallow = (e) => {
	e.preventDefault();
	e.stopPropagation();
};

const onKey = (e, down) => {
	if (!state.on) return;
	if (e.key !== 'Alt') return;
	setAlt(down);
};

const onClick = (e) => {
	if (!state.on) return;
	const el = hit(e);
	if (!el || e.defaultPrevented) return;
	copy(el).then((ok) => ok && swallow(e));
};

const onMove = (e) => {
	if (!state.on || !mod(e)) return;
	mark(hit(e));
};

const listeners = [
	['keydown', (e) => onKey(e, true)],
	['keyup', (e) => onKey(e, false)],
	['blur', () => setAlt(false)],
	['mousemove', onMove],
	['click', onClick, { capture: true }],
];

const setOn = (on) => {
	if (state.on === on) return;
	state.on = on;
	document.documentElement.classList.toggle('codecopy-on', on);
	const op = on ? 'addEventListener' : 'removeEventListener';
	for (const [name, fn, opts] of listeners) window[op](name, fn, opts ?? false);
	if (!on) setAlt(false);
};

const applyPage = (on, toast) => {
	setOn(Boolean(on));
	if (toast) showToast(TOAST[on ? 'on' : 'off']);
};

globalThis.__codecopyApply = applyPage;

const api = (fn) => {
	try { fn(); }
	catch (e) { if (!/invalidated/i.test(String(e))) console.error(e); }
};

if (!globalThis.__codecopyReady) {
	globalThis.__codecopyReady = true;
	api(() => {
		chrome.runtime.onMessage.addListener((m) => {
			if (m?.type !== 'active') return;
			applyPage(m.value, m.toast);
		});
	});
}
