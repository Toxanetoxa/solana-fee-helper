// packages/extension/src/background/index.ts

export {};

const BASE = 'http://localhost:8787';
let risk: 'eco' | 'balanced' | 'aggr' = 'balanced';

async function loadRisk() {
    const s = await chrome.storage.local.get('risk');
    if (s?.risk) risk = s.risk as typeof risk;
}
async function saveRisk(r: typeof risk) {
    risk = r;
    await chrome.storage.local.set({ risk });
}
async function tick() {
    try {
        const url = `${BASE}/api/reco-fee?txType=transfer&risk=${risk}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`status ${res.status}`);
        const data = await res.json();
        await chrome.storage.local.set({ reco: data, recoAt: Date.now(), risk });
    } catch {
    }
}

chrome.runtime.onInstalled.addListener(() => {
    loadRisk().then(() => tick());
});

chrome.commands?.onCommand.addListener(async (cmd) => {
    if (cmd === 'cycle-risk') {
        const order = ['eco', 'balanced', 'aggr'] as const;
        const next = order[(order.indexOf(risk) + 1) % order.length];
        await saveRisk(next);
        tick();
    }
});

const date = new Date().toISOString();
console.log('[Solana Helper] tick', risk, date);

loadRisk().then(() => {
    tick();
    setInterval(tick, 10_000);
});
