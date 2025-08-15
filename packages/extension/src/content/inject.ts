import './style.scss';
import { renderTemplate } from './template';

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

function colorFor(pct: number) {
    if (pct >= 90) return '#4caf50';
    if (pct >= 75) return '#ffc107';
    return '#f44336';
}

function fmtTime(d: Date) {
    return d.toLocaleTimeString([], { hour12: false });
}

const box = document.createElement('div');
box.className = 'solana-helper-box';
box.textContent = 'Solana Helper: loading…';
document.body.appendChild(box);

function render(reco: any, updatedAt: number) {
    box.classList.add('updating');
    setTimeout(() => box.classList.remove('updating'), 1000);

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
    box.style.borderColor = borderColor;
    box.style.color = borderColor;

    box.innerHTML = renderTemplate({
        mode: risk,
        feeSOL,
        lamports,
        success,
        recommendedRpc: reco.recommendedRpc,
        updatedAt: fmtTime(new Date(updatedAt)),
        stale
    });
}

function renderError() {
    box.textContent = 'Solana Helper: error';
    box.classList.add('error');
}

async function fetchRecoOnce() {
    if (!visible) return;
    try {
        const API_BASE = await getApiBase();
        const url = `${API_BASE}/api/reco-fee?txType=transfer&risk=${risk}&_=${Date.now()}`;
        const res = await fetch(url, { cache: 'no-store' });

        if (!res.ok) throw new Error(`status ${res.status}`);

        const data = await res.json();
        const updatedAt = data?.updatedAt ? Date.parse(data.updatedAt) : Date.now();
        render(data, isNaN(updatedAt) ? Date.now() : updatedAt);
    } catch {
        renderError();
    }
}

(function start() {
    loadRisk().then(() => {
        fetchRecoOnce();
        setInterval(fetchRecoOnce, REFRESH_MS);
    });
})();
