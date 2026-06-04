const OFF = 'Code Copy — click to activate';
const ON = 'Code Copy (active — click to deactivate)';

const sync = (on) => {
	chrome.action.setBadgeText({ text: on ? '●' : '' });
	chrome.action.setBadgeBackgroundColor({ color: '#6655ff' });
	chrome.action.setTitle({ title: on ? ON : OFF });
};

const http = (url) => url?.startsWith('http://') || url?.startsWith('https://');

const applyTab = async (tabId, on) => {
	try {
		await chrome.tabs.sendMessage(tabId, { type: 'active', value: on });
		return;
	} catch {}
	try {
		await chrome.scripting.executeScript({ target: { tabId }, files: ['content.js'] });
		await chrome.scripting.executeScript({
			target: { tabId },
			func: (v) => globalThis.__codecopy?.setOn?.(v),
			args: [on],
		});
	} catch {}
};

const tabs = () => chrome.tabs.query({ url: ['http://*/*', 'https://*/*'] });

const push = async (on) => {
	const all = await tabs();
	await Promise.all(all.map((tab) => tab.id && applyTab(tab.id, on)));
};

chrome.runtime.onInstalled.addListener(({ reason }) => {
	if (reason === 'install') chrome.storage.session.set({ active: true });
	chrome.storage.session.get('active', ({ active = true }) => sync(active));
});

chrome.storage.session.get('active', ({ active = true }) => sync(active));

chrome.action.onClicked.addListener(async () => {
	const { active = true } = await chrome.storage.session.get('active');
	const next = !active;
	await chrome.storage.session.set({ active: next });
	sync(next);
	await push(next);
});

chrome.tabs.onUpdated.addListener(async (tabId, info, tab) => {
	if (info.status !== 'complete' || !http(tab.url)) return;
	const { active = true } = await chrome.storage.session.get('active');
	await applyTab(tabId, active);
});
