const OFF = 'Code Copy — click to activate';
const ON = 'Code Copy (active — click to deactivate)';
const ACTIVE = { active: true };
const LOCAL = /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?(\/|$)/;
const SIZES = [16, 32, 48, 128];
const iconCache = { on: null, off: null };

const readActive = (data) => (data && 'active' in data ? Boolean(data.active) : true);
const msg = (on) => ({ type: 'active', value: on });

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

const http = (url) => (url?.startsWith('http://') || url?.startsWith('https://')) && !LOCAL.test(url ?? '');

const applyTab = async (tabId, on) => {
	const m = msg(on);
	try {
		await chrome.tabs.sendMessage(tabId, m);
		return;
	} catch {}
	await chrome.scripting.executeScript({ target: { tabId }, files: ['content.js'] }).catch(() => {});
	await chrome.tabs.sendMessage(tabId, m).catch(() => {});
};

const tabs = () => chrome.tabs.query({ url: ['http://*/*', 'https://*/*'] }).then((xs) => xs.filter((t) => http(t.url)));

const push = (on) => tabs().then((all) => Promise.all(all.map((tab) => tab.id && applyTab(tab.id, on))));

const refresh = async () => sync(readActive(await chrome.storage.session.get(ACTIVE)));

chrome.action.setBadgeText({ text: '' });

chrome.runtime.onInstalled.addListener(async ({ reason }) => {
	if (reason === 'install') await chrome.storage.session.set({ active: true });
	await refresh();
});

refresh();

chrome.action.onClicked.addListener(async () => {
	const on = !readActive(await chrome.storage.session.get(ACTIVE));
	await chrome.storage.session.set({ active: on });
	await sync(on);
	await push(on);
});

chrome.tabs.onUpdated.addListener(async (tabId, info, tab) => {
	if (info.status !== 'complete' || !http(tab.url)) return;
	await applyTab(tabId, readActive(await chrome.storage.session.get(ACTIVE)));
});
