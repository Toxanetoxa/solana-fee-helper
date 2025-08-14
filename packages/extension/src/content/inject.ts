export {};

let risk: 'eco' | 'balanced' | 'aggr' = 'balanced';
const DEFAULT_API = 'http://localhost:8787';
const REFRESH_MS = 8000;
const STALE_AFTER_MS = REFRESH_MS * 3;

let visible = !document.hidden;
document.addEventListener('visibilitychange', () => { visible = !document.hidden; });

async function getApiBase(): Promise<string> {
    try {
        const s = await chrome.storage.local.get('apiBase');
        return s?.apiBase || DEFAULT_API;
    } catch {
        return DEFAULT_API;
    }
}
async function loadRisk() {
    try {
        const s = await chrome.storage.local.get('risk');
        if (s?.risk) risk = s.risk;
    } catch {}
}

const box = document.createElement('div');
box.style.position = 'fixed';
box.style.zIndex = '2147483647';
box.style.right = '10px';
box.style.bottom = '10px';
box.style.padding = '8px 10px';
box.style.background = '#111';
box.style.color = '#fff';
box.style.borderRadius = '6px';
box.style.font = '18px/1.4 system-ui,sans-serif';
box.style.boxShadow = '0 2px 8px rgba(0,0,0,0.35)';
box.style.whiteSpace = 'nowrap';
box.style.pointerEvents = 'none';
box.style.border = '1px solid #555';
box.textContent = 'Solana Helper: loading…';
document.body.appendChild(box);

function colorFor(pct: number) {
    if (pct >= 90) return '#4caf50';
    if (pct >= 75) return '#ffc107';
    return '#f44336';
}
function fmtTime(d: Date) { return d.toLocaleTimeString([], { hour12: false }); }
function renderError() { box.textContent = 'Solana Helper: error'; box.style.border = '1px solid #f44336'; }

function render(reco: any, updatedAt: number) {
    const success = Math.round((reco?.successScore || 0) * 100);
    const feeSOL = typeof reco?.priorityFeeSOL === 'number'
        ? reco.priorityFeeSOL
        : (() => {
            const micro = Number(reco?.priorityFeeMicroLamports ?? reco?.priorityFeeLamports ?? 0);
            const lamports = micro / 1e6;
            return lamports / 1e9;
        })();
    const lamports = typeof reco?.priorityFeeLamports === 'number'
        ? reco.priorityFeeLamports
        : Number(reco?.priorityFeeMicroLamports ?? 0) / 1e6;

    const age = Date.now() - updatedAt;
    const stale = age > STALE_AFTER_MS;
    const borderColor = stale ? '#888' : colorFor(success);

    box.style.border = `1px solid ${borderColor}`;
    box.innerHTML =
        `<b>mode</b>: ${risk} &nbsp; ` +
        `<b>fee</b>: ${feeSOL.toFixed(9)} SOL <span style="opacity:.8">(${Math.round(lamports)} lamports)</span>` +
        ` &nbsp; <b>success</b>: ${success}%` +
        ` &nbsp; <b>recommendedRpc</b>: ${reco.recommendedRpc}%` +
        ` &nbsp; <span style="opacity:.75">Updated: ${fmtTime(new Date(updatedAt))}${stale ? ' · <span style="color:#ff9800">stale</span>' : ''}</span>`;
}

async function fetchRecoOnce() {
    if (!visible) return; // не бомбим API в фоновой вкладке
    try {
        const API_BASE = await getApiBase();
        const url = `${API_BASE}/api/reco-fee?txType=transfer&risk=${risk}&_=${Date.now()}`;
        const res = await fetch(url, { cache: 'no-store' });

        if (!res.ok) throw new Error(`status ${res.status}`);

        const data = await res.json();
        const updatedAt = data?.updatedAt ? Date.parse(data.updatedAt) : Date.now();
        render(data, isNaN(updatedAt) ? Date.now() : updatedAt);
    } catch { renderError(); }
}

(function start() {
    loadRisk().then(() => { fetchRecoOnce(); setInterval(fetchRecoOnce, REFRESH_MS); });
})();
