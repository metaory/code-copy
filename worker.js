const OFF = 'Code Copy (inactive — click to activate)';
const ON = 'Code Copy (active — click to deactivate)';
const TAB_ACTIVE = 'tabActive';
const INJECTED = 'injected';
const LOCAL = /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?(\/|$)/;
const SIZES = [16, 32, 48, 128];
const iconCache = { on: null, off: null };

const injectable = (url) => (url?.startsWith('http://') || url?.startsWith('https://')) && !LOCAL.test(url ?? '');
const tabKey = (id) => String(id);

const maps = () => chrome.storage.session.get([TAB_ACTIVE, INJECTED]).then((d) => ({
	tabActive: d[TAB_ACTIVE] ?? {},
	injected: d[INJECTED] ?? {},
}));

const patchSession = async (patch) => {
	const data = await maps();
	await chrome.storage.session.set({
		[TAB_ACTIVE]: patch.tabActive ?? data.tabActive,
		[INJECTED]: patch.injected ?? data.injected,
	});
};

const tabOn = (m, id) => Boolean(m[tabKey(id)]);

const setTabOn = async (id, on) => {
	const { tabActive } = await maps();
	const k = tabKey(id);
	const next = { ...tabActive };
	if (on) next[k] = true;
	else delete next[k];
	await patchSession({ tabActive: next });
};

const markInjected = async (id) => {
	const { injected } = await maps();
	await patchSession({ injected: { ...injected, [tabKey(id)]: true } });
};

const clearTab = async (id) => {
	const { tabActive, injected } = await maps();
	const k = tabKey(id);
	const nextActive = { ...tabActive };
	const nextInjected = { ...injected };
	delete nextActive[k];
	delete nextInjected[k];
	await patchSession({ tabActive: nextActive, injected: nextInjected });
};

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

const syncIcon = async (on) => {
	chrome.action.setTitle({ title: on ? ON : OFF });
	await chrome.action.setIcon({ imageData: await icons(on) });
};

const setPage = async (tabId, on, toast = false) => {
	try {
		await chrome.scripting.executeScript({
			target: { tabId },
			func: (active, show) => globalThis.__codecopyApply?.(active, show),
			args: [on, toast],
		});
		return true;
	} catch { return false; }
};

const injectTab = async (tabId) => {
	const target = { tabId };
	await chrome.scripting.insertCSS({ target, files: ['content.css'] });
	await chrome.scripting.executeScript({ target, files: ['content.js'] });
	await setPage(tabId, true, true);
};

const activeTab = () => chrome.tabs.query({ active: true, currentWindow: true }).then(([t]) => t);

const refreshIcon = async () => {
	const tab = await activeTab();
	if (!tab?.id || !injectable(tab.url)) return syncIcon(false);
	const { tabActive } = await maps();
	return syncIcon(tabOn(tabActive, tab.id));
};

const onToggle = async () => {
	const tab = await activeTab();
	if (!tab?.id || !injectable(tab.url)) return;
	const { tabActive, injected } = await maps();
	const next = !tabOn(tabActive, tab.id);
	await setTabOn(tab.id, next);
	await syncIcon(next);
	if (next && !tabOn(injected, tab.id)) {
		await injectTab(tab.id);
		return markInjected(tab.id);
	}
	await setPage(tab.id, next, true);
};

chrome.action.setBadgeText({ text: '' });
refreshIcon();

chrome.runtime.onInstalled.addListener(async ({ reason }) => {
	if (reason === 'install') await chrome.windows.create({ url: chrome.runtime.getURL('welcome.html') });
	await refreshIcon();
});

chrome.runtime.onStartup.addListener(refreshIcon);
chrome.action.onClicked.addListener(onToggle);

chrome.commands.onCommand.addListener(async (cmd) => {
	if (cmd !== 'toggle') return;
	await onToggle();
});

chrome.tabs.onActivated.addListener(async ({ tabId }) => {
	const tab = await chrome.tabs.get(tabId).catch(() => null);
	if (!tab || !injectable(tab.url)) return syncIcon(false);
	const { tabActive } = await maps();
	await syncIcon(tabOn(tabActive, tabId));
});

chrome.tabs.onRemoved.addListener((tabId) => clearTab(tabId));

chrome.tabs.onUpdated.addListener(async (tabId, info, tab) => {
	if (info.status !== 'complete' || !injectable(tab.url)) return;
	const { injected } = await maps();
	if (!tabOn(injected, tabId)) return;
	await clearTab(tabId);
	if (tab.active) await syncIcon(false);
});
