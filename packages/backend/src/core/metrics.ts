import { getConnections } from './rpcPool.js';

/** Простейший прокси-индикатор: средняя задержка getSlot и успех getLatestBlockhash */
export async function getCongestionScore(): Promise<number> {
    const conns = getConnections();
    const samples = await Promise.all(conns.map(async (c) => {
        const t0 = Date.now();
        try {
            await c.getLatestBlockhash('finalized');
            const dt = Date.now() - t0; // ms
            // 0..100 — чем дольше, тем больше score
            // const score = Math.max(0, Math.min(100, (dt - 50) / 5)); // 50ms => 0, 550ms => 100
            return Math.max(0, Math.min(100, (dt - 50) / 5));
        } catch {
            return 80; // ошибка RPC ~ высокая нагрузка
        }
    }));
    // усредним по пулу
    return Math.round(samples.reduce((a,b)=>a+b,0)/samples.length);
}
