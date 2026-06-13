const ID = 'codecopy-toast';
const FONTS = [
	['Vintaface-Regular', chrome.runtime.getURL('assets/Vintaface-Regular.woff2'), 400, '26px'],
];
const SKIP = new Set(['HTML', 'BODY']);
const SHINE_MS = 200; // matches --cc-shine in content.css
const TOAST = {
	copied: ['Copied', 600],
	failed: ['Copy failed', 600],
	off: ['Code Copy Deactivated', 2_000],
	on: ['Code Copy Activated', 4_000],
};
const state = { alt: false, mark: null, on: false };

const mk = (tag, props) => Object.assign(document.createElement(tag), props);
const all = (...fs) => (x) => fs.every((f) => f(x));
const when = (node, ok, find = (n) => n) => {
	const n = node instanceof Element ? node : null;
	return n && ok(n) ? find(n) || null : null;
};
const on = (fn) => (...a) => state.on && fn(...a);
const pulse = (ms) => {
	let t = 0;
	return (fn) => { clearTimeout(t); t = setTimeout(fn, ms); };
};

const injectFaces = (urls) => {
	if (document.getElementById('codecopy-font')) return;
	const faces = FONTS.map(([family, , weight], i) =>
		`@font-face{font-family:'${family}';src:url("${urls[i]}") format("woff2");font-weight:${weight};font-style:normal;font-display:swap}`,
	).join('');
	document.documentElement.append(mk('style', { id: 'codecopy-font', textContent: faces }));
};

Promise.all(FONTS.map(([family, src, , size]) =>
	fetch(src)
		.then((r) => (r.ok ? r.blob() : Promise.reject(new Error(`font ${r.status}`))))
		.then((blob) => ({ family, size, url: URL.createObjectURL(blob) })),
))
	.then((loaded) => {
		injectFaces(loaded.map(({ url }) => url));
		return Promise.all(loaded.map(({ family, size }) => document.fonts.load(`${size} '${family}'`)));
	})
	.catch(console.error);

const toast = (() => {
	let el, hideT;
	return ([text, ms]) => {
		el ??= mk('div', { id: ID, ariaLive: 'polite' });
		if (!el.isConnected) document.body.append(el);
		el.textContent = text;
		el.classList.add('show');
		clearTimeout(hideT);
		hideT = setTimeout(() => el.classList.remove('show'), ms);
	};
})();

const endShine = pulse(SHINE_MS);
const shine = (el) => {
	el.classList.remove('codecopy-shine');
	void el.offsetWidth;
	el.classList.add('codecopy-shine');
	endShine(() => el.classList.remove('codecopy-shine'));
};

const own = (el) => el?.closest?.(`#${ID}`);
const hasText = (el) => Boolean(el?.innerText?.trim());
const notOwn = (n) => !own(n);
const barePre = (p) => !p.querySelector('code') && hasText(p);
const pickable = all(notOwn, (n) => !SKIP.has(n.tagName), hasText);
const codeBlock = (n) => when(n.closest('code'), hasText) || when(n.closest('pre'), barePre);

const mod = (e) => state.alt || e.altKey;
const at = (e) => document.elementFromPoint(e.clientX, e.clientY);
const hit = (e) => (mod(e) ? when(at(e), pickable) : when(e.target, notOwn, codeBlock));

const shineIf = (ok, el) => ok && !state.alt && el && shine(el);
const notify = (spec, ok, el) => {
	toast(spec);
	shineIf(ok, el);
	return ok;
};
const copy = (el) => hasText(el)
	? navigator.clipboard.writeText(el.innerText)
		.then(() => notify(TOAST.copied, true, el))
		.catch(() => notify(TOAST.failed, false))
	: Promise.resolve(false);

const cls = (el, name, add) => el?.classList[add ? 'add' : 'remove'](name);
const mark = (el) => {
	if (state.mark === el) return;
	cls(state.mark, 'codecopy-x', false);
	state.mark = el;
	cls(el, 'codecopy-x', true);
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

const isAlt = (e) => e.key === 'Alt';
const altEv = (down) => on((e) => isAlt(e) && setAlt(down));
const onClick = (e) => {
	const el = hit(e);
	if (!el || e.defaultPrevented) return;
	swallow(e);
	copy(el);
};

const listeners = [
	['keydown', altEv(true)],
	['keyup', altEv(false)],
	['blur', on(() => setAlt(false))],
	['mousemove', on((e) => mod(e) && mark(hit(e)))],
	['click', on(onClick), { capture: true }],
];

const wire = (on) => {
	const op = on ? 'addEventListener' : 'removeEventListener';
	for (const [name, fn, opts] of listeners) window[op](name, fn, opts ?? false);
};

const setOn = (on) => {
	if (state.on === on) return;
	state.on = on;
	document.documentElement.classList.toggle('codecopy-on', on);
	wire(on);
	if (!on) setAlt(false);
};

const applyPage = (on, show) => {
	setOn(Boolean(on));
	if (show) toast(TOAST[on ? 'on' : 'off']);
};

globalThis.__codecopyApply = applyPage;

if (!globalThis.__codecopyReady) {
	globalThis.__codecopyReady = true;
	try {
		chrome.runtime.onMessage.addListener((m) => {
			if (m?.type !== 'active') return;
			applyPage(m.value, m.toast);
		});
	} catch (e) {
		if (!/invalidated/i.test(String(e))) console.error(e);
	}
}
