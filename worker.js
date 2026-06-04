const OFF = 'Code Copy — click to activate';
const ON = 'Code Copy (active — click to deactivate)';
const ACTIVE = { active: true };
const LOCAL = /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?(\/|$)/;
const SIZES = [16, 32, 48, 128];
const iconCache = { on: null, off: null };

const raster = async (size, gray) => {
	const url = chrome.runtime.getURL(`icons/icon${size}.png`);
	const bmp = await createImageBitmap(await (await fetch(url)).blob());
	const canvas = new OffscreenCanvas(bmp.width, bmp.height);
	const ctx = canvas.getContext('2d');
	ctx.drawImage(bmp, 0, 0);
	if (!gray) return ctx.getImageData(0, 0, bmp.width, bmp.height);
	const img = ctx.getImageData(0, 0, bmp.width, bmp.height);
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
	const pairs = await Promise.all(SIZES.map(async (n) => [n, await raster(n, !on)]));
	iconCache[key] = Object.fromEntries(pairs);
	return iconCache[key];
};

const sync = async (on) => {
	chrome.action.setBadgeText({ text: '' });
	chrome.action.setTitle({ title: on ? ON : OFF });
	await chrome.action.setIcon({ imageData: await icons(on) });
};

const http = (url) => (url?.startsWith('http://') || url?.startsWith('https://')) && !LOCAL.test(url ?? '');

const applyTab = async (tabId, on) => {
	try {
		await chrome.tabs.sendMessage(tabId, { type: 'active', value: on });
		return;
	} catch {}
	await chrome.scripting.executeScript({ target: { tabId }, files: ['content.js'] }).catch(() => {});
	await chrome.tabs.sendMessage(tabId, { type: 'active', value: on }).catch(() => {});
};

const tabs = () => chrome.tabs.query({ url: ['http://*/*', 'https://*/*'] }).then((xs) => xs.filter((t) => http(t.url)));

const push = (on) => tabs().then((all) => Promise.all(all.map((tab) => tab.id && applyTab(tab.id, on))));

chrome.runtime.onInstalled.addListener(async ({ reason }) => {
	if (reason === 'install') await chrome.storage.session.set({ active: true });
	const { active } = await chrome.storage.session.get(ACTIVE);
	await sync(Boolean(active));
});

chrome.storage.session.get(ACTIVE, async (data) => sync(Boolean(data?.active ?? true)));

chrome.action.onClicked.addListener(async () => {
	const { active } = await chrome.storage.session.get(ACTIVE);
	const next = !Boolean(active);
	await chrome.storage.session.set({ active: next });
	await sync(next);
	await push(next);
});

chrome.tabs.onUpdated.addListener(async (tabId, info, tab) => {
	if (info.status !== 'complete' || !http(tab.url)) return;
	const { active } = await chrome.storage.session.get(ACTIVE);
	await applyTab(tabId, Boolean(active));
});
