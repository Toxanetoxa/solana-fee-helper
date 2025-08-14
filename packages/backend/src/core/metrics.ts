import { getRpcHealth, pickBestRpc } from './rpcPool.js';
import { Connection } from '@solana/web3.js';

export interface NetworkSnapshot {
    congestionScore: number;     // 0..100
    droppedRate: number;         // 0..1 (заглушка, позже заменим на реальные пробы)
    executedFailedRate: number;  // 0..1 (заглушка)
}

export async function getNetworkSnapshot(): Promise<NetworkSnapshot> {
    const health = await getRpcHealth();
    const best = health.find(h => h.healthy) || health.sort((a,b)=>a.latencyMs-b.latencyMs)[0];

    // Простая эвристика: 50ms → ~10, 250ms → ~60, 600ms → ~95
    const l = best?.latencyMs ?? 600;
    const congestionScore = Math.max(0, Math.min(100, Math.round((l - 50) / 5))); // 50ms -> 0, 550ms -> 100

    return {
        congestionScore,
        droppedRate: 0.03,        // TODO: заменить на реальную оценку
        executedFailedRate: 0.06  // TODO: заменить на реальную оценку
    };
}

// оставляем для совместимости, если где-то вызывался напрямую
export async function getCongestionScore(): Promise<number> {
    return (await getNetworkSnapshot()).congestionScore;
}
