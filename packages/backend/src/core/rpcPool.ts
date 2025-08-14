import { Connection } from '@solana/web3.js';

const DEFAULT_TIMEOUT_MS = 1500;
const HEALTH_TTL_MS = 5000;

let cached: { at: number; health: RpcHealth[] } | null = null;

export interface RpcHealth {
    url: string;
    latencyMs: number;   // p50 из 3 попыток
    okRatio: number;     // 0..1
    healthy: boolean;
}

function parseEndpoints(): string[] {
    const raw = process.env.RPC_ENDPOINTS || '';
    const list = raw.split(',').map(s => s.trim()).filter(Boolean);
    return list.length ? list : ['https://api.mainnet-beta.solana.com'];
}

async function pingOnce(url: string, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<number | null> {
    // @ts-ignore
    const conn = new Connection(url, 'confirmed', { commitment: 'confirmed' });
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), timeoutMs);
    const t0 = performance.now();
    try {
        // лёгкий вызов; если хочешь ещё легче — getSlot()
        // @ts-ignore
        await conn.getLatestBlockhash('confirmed', { signal: ctl.signal as any });
        return Math.round(performance.now() - t0);
    } catch {
        return null;
    } finally {
        clearTimeout(t);
    }
}

async function probe(url: string): Promise<RpcHealth> {
    const samples: number[] = [];
    let ok = 0;
    for (let i = 0; i < 3; i++) {
        const ms = await pingOnce(url);
        if (ms !== null) { samples.push(ms); ok++; }
    }
    samples.sort((a, b) => a - b);
    const p50 = samples.length ? samples[Math.floor(samples.length / 2)] : Infinity;
    const okRatio = ok / 3;
    return {
        url,
        latencyMs: isFinite(p50) ? p50 : 9999,
        okRatio,
        healthy: okRatio >= 0.67 // >=2 из 3 успешны
    };
}

export async function getRpcHealth(): Promise<RpcHealth[]> {
    const now = Date.now();
    if (cached && now - cached.at < HEALTH_TTL_MS) return cached.health;

    const urls = parseEndpoints();
    const res = await Promise.all(urls.map(probe));
    cached = { at: now, health: res };
    return res;
}

const RPCS = (process.env.RPC_ENDPOINTS || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

export async function pickBestRpc(): Promise<string> {
    const health = await getRpcHealth();
    const healthy = health.filter(h => h.healthy);
    const sorted = (healthy.length ? healthy : health)
        .sort((a, b) => a.latencyMs - b.latencyMs || b.okRatio - a.okRatio);
    return sorted[0]?.url || parseEndpoints()[0];
}

export function getConnections(): Connection[] {
    return parseEndpoints().map((url) => new Connection(url, 'confirmed'));
}
