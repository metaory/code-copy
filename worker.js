const OFF = 'Code Copy — click to activate';
const ON = 'Code Copy (active — click to deactivate)';
const ACTIVE = { active: true };
const LOCAL = /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?(\/|$)/;

const sync = (on) => {
	chrome.action.setBadgeText({ text: on ? '●' : '' });
	chrome.action.setTitle({ title: on ? ON : OFF });
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

chrome.action.setBadgeBackgroundColor({ color: '#6655ff' });

chrome.runtime.onInstalled.addListener(async ({ reason }) => {
	if (reason === 'install') await chrome.storage.session.set({ active: true });
	const { active } = await chrome.storage.session.get(ACTIVE);
	sync(Boolean(active));
});

chrome.storage.session.get(ACTIVE, (data) => sync(Boolean(data?.active ?? true)));

chrome.action.onClicked.addListener(async () => {
	const { active } = await chrome.storage.session.get(ACTIVE);
	const next = !Boolean(active);
	await chrome.storage.session.set({ active: next });
	sync(next);
	await push(next);
});

chrome.tabs.onUpdated.addListener(async (tabId, info, tab) => {
	if (info.status !== 'complete' || !http(tab.url)) return;
	const { active } = await chrome.storage.session.get(ACTIVE);
	await applyTab(tabId, Boolean(active));
});
