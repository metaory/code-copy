const OFF = 'click to activate';
const ON = 'click to deactivate';
const ACTIVE = { active: true };
const ORIGINS = ['http://*/*', 'https://*/*'];
const EXCLUDE = ['http://localhost/*', 'http://127.0.0.1/*', 'http://0.0.0.0/*'];
const LOCAL = /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?(\/|$)/;
const SIZES = [16, 32, 48, 128];
const iconCache = { on: null, off: null };

const readActive = (data) => (data && 'active' in data ? Boolean(data.active) : true);
const msg = (on, toast = false) => ({ type: 'active', value: on, toast });
const http = (url) => (url?.startsWith('http://') || url?.startsWith('https://')) && !LOCAL.test(url ?? '');
const alwaysOn = () => chrome.permissions.contains({ origins: ORIGINS });

const raster = async (size, gray) => {
	const url = chrome.runtime.getURL(`icons/icon${size}.png`);
	const bmp = await createImageBitmap(await (await fetch(url)).blob());
	const canvas = new OffscreenCanvas(bmp.width, bmp.height);
	const ctx = canvas.getContext('2d');
	ctx.drawImage(bmp, 0, 0);
	const img = ctx.getImageData(0, 0, bmp.width, bmp.height);
	if (!gray) return img;
	const d = img.data;
	for (let i = 0; i < d.length; i += 4) {
		const g = (d[i] * 77 + d[i + 1] * 150 + d[i + 2] * 29) >> 8;
		d[i] = d[i + 1] = d[i + 2] = g;
	}
	return img;
};

const icons = async (on) => {
	const key = on ? 'on' : 'off';
	if (iconCache[key]) return iconCache[key];
	iconCache[key] = Object.fromEntries(await Promise.all(SIZES.map(async (n) => [n, await raster(n, !on)])));
	return iconCache[key];
};

const sync = async (on) => {
	chrome.action.setTitle({ title: on ? ON : OFF });
	await chrome.action.setIcon({ imageData: await icons(on) });
};

const registerAlwaysOn = async () => {
	if (!(await alwaysOn())) return false;
	try { await chrome.scripting.unregisterContentScripts({ ids: ['codecopy'] }); } catch {}
	await chrome.scripting.registerContentScripts([{
		id: 'codecopy',
		matches: ORIGINS,
		excludeMatches: EXCLUDE,
		js: ['content.js'],
		css: ['content.css'],
		runAt: 'document_idle',
	}]);
	return true;
};

const injectTab = async (tabId, toast = false) => {
	const target = { tabId };
	await chrome.scripting.insertCSS({ target, files: ['content.css'] });
	await chrome.scripting.executeScript({ target, files: ['content.js'] });
	await chrome.tabs.sendMessage(tabId, msg(readActive(await chrome.storage.session.get(ACTIVE)), toast)).catch(() => {});
};

const applyTab = async (tabId, on, toast = false) => {
	await chrome.tabs.sendMessage(tabId, msg(on, toast)).catch(() => {});
};

const tabs = () => chrome.tabs.query({ url: ORIGINS }).then((xs) => xs.filter((t) => http(t.url)));
const push = (on, toastTabId = null) =>
	tabs().then((all) => Promise.all(all.map((tab) => tab.id && applyTab(tab.id, on, tab.id === toastTabId))));

const activeTab = () => chrome.tabs.query({ active: true, currentWindow: true }).then(([t]) => t);
const refresh = async () => sync(readActive(await chrome.storage.session.get(ACTIVE)));
const boot = async () => { await registerAlwaysOn(); await refresh(); };

chrome.action.setBadgeText({ text: '' });
boot();

chrome.runtime.onInstalled.addListener(async ({ reason }) => {
	await registerAlwaysOn();
	if (reason !== 'install') return refresh();
	await chrome.storage.session.set({ active: true });
	await chrome.tabs.create({ url: chrome.runtime.getURL('welcome.html') });
	await refresh();
});

chrome.runtime.onStartup.addListener(boot);

chrome.action.onClicked.addListener(async () => {
	const on = !readActive(await chrome.storage.session.get(ACTIVE));
	await chrome.storage.session.set({ active: on });
	await sync(on);
	const tab = await activeTab();
	if (!tab?.id || !http(tab.url)) return;
	if (await alwaysOn()) return push(on, tab.id);
	if (on) return injectTab(tab.id, true);
	return applyTab(tab.id, false, false);
});

chrome.commands.onCommand.addListener(async (cmd) => {
	if (cmd !== 'activate-tab') return;
	const tab = await activeTab();
	if (!tab?.id || !http(tab.url)) return;
	await chrome.storage.session.set({ active: true });
	await sync(true);
	if (await alwaysOn()) return applyTab(tab.id, true, true);
	return injectTab(tab.id, true);
});

chrome.tabs.onUpdated.addListener(async (tabId, info, tab) => {
	if (info.status !== 'complete' || !http(tab.url)) return;
	await applyTab(tabId, readActive(await chrome.storage.session.get(ACTIVE)));
});

chrome.runtime.onMessage.addListener((m, _s, reply) => {
	if (m?.type !== 'enable-always-on') return;
	chrome.permissions.request({ origins: ORIGINS }).then(async (ok) => {
		if (!ok) return reply({ ok: false });
		await registerAlwaysOn();
		await push(readActive(await chrome.storage.session.get(ACTIVE)));
		reply({ ok: true });
	});
	return true;
});
