const ID = 'codecopy-toast';
const SKIP = new Set(['HTML', 'BODY']);
const state = { ctrl: false, mark: null };

const mount = (t) => {
	if (!t.el) t.el = Object.assign(document.createElement('div'), { id: ID, ariaLive: 'polite' });
	if (!t.el.isConnected) document.body.append(t.el);
	return t.el;
};

const toast = new Proxy({ el: null, timer: 0 }, {
	get(t, k) {
		if (k !== 'show') return t[k];
		return (msg) => {
			const el = mount(t);
			Object.assign(el, { textContent: msg });
			el.classList.add('show');
			clearTimeout(t.timer);
			t.timer = setTimeout(() => el.classList.remove('show'), 1_200);
		};
	},
});

const own = (el) => el?.closest?.(`#${ID}`);
const free = (n) => !own(n);

const when = (t, ok, find = (n) => n) => {
	const n = t instanceof Element ? t : null;
	if (!n || !ok(n)) return null;
	return find(n) || null;
};

const pick = (x, y) => when(document.elementFromPoint(x, y), (n) => free(n) && !SKIP.has(n.tagName) && n.innerText);
const code = (t) => when(t, free, (n) => n.closest('code') || n.closest('pre'));
const target = (e) => state.ctrl ? pick(e.clientX, e.clientY) : code(e.target);

const show_success = () => toast.show('Copied');
const show_failure = () => toast.show('Copy failed');

const copy = (el) => {
	if (!el?.innerText) return false;
	navigator.clipboard.writeText(el.innerText).then(show_success).catch(show_failure);
	return true;
};

const mark = (el) => {
	if (state.mark === el) return;
	state.mark?.classList.remove('codecopy-x');
	state.mark = el;
	el?.classList.add('codecopy-x');
};

const ctrlOff = () => {
	state.ctrl = false;
	mark(null);
};

const swallow = (e) => {
	e.preventDefault();
	e.stopPropagation();
};

const onKey = (e, down) => {
	if (e.key !== 'Control') return;
	state.ctrl = down;
	if (!down) mark(null);
};

[
	['keydown', (e) => onKey(e, true)],
	['keyup', (e) => onKey(e, false)],
	['blur', ctrlOff],
	['mousemove', (e) => state.ctrl && mark(pick(e.clientX, e.clientY))],
	['click', (e) => {
		const el = target(e);
		if (!el || e.defaultPrevented || !copy(el)) return;
		swallow(e);
	}, { capture: true }],
].map(([name, fn, opts]) => window.addEventListener(name, fn, opts));
