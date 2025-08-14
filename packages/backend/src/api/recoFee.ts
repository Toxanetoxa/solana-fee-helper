import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { recommend } from '../core/recommender.js';
import { redis } from '../utils/redis.js';
import { getCongestionScore } from '../core/metrics.js';
import { pickBestRpc } from '../core/rpcPool.js';

const Query = z.object({
    txType: z.enum(['transfer', 'swap', 'mint']).default('transfer'),
    risk:   z.enum(['eco', 'balanced', 'aggr']).default('balanced')
});

const plugin: FastifyPluginAsync = async (app) => {
    app.get('/api/reco-fee', async (req, reply) => {
        const parsed = Query.safeParse((req as any).query);
        if (!parsed.success) {
            return reply.code(400).send({ error: parsed.error.flatten() });
        }
        const q = parsed.data;
        const key = `reco:${q.txType}:${q.risk}`;

        try {
            // 1) Верни кэш, если он совсем свежий
            const cached = await redis?.get(key);
            if (cached) {
                const obj = JSON.parse(cached);
                return reply.send(obj);
            }

            // 2) Получаем «напряжённость» сети и считаем рекомендацию
            const score = await getCongestionScore(); // может бросить
            const out = recommend({
                txType: q.txType,
                risk: q.risk,
                congestionScore: score
            });

            // производные единицы
            const priorityFeeLamports = out.priorityFeeLamports; // лампорты
            const priorityFeeSOL = priorityFeeLamports / 1e9;    // SOL
            const bestRpc = await pickBestRpc();

            const payload = {
                mode: q.risk,
                cuPrice: out.cuPrice,
                cuEstimate: out.cuEstimate,
                priorityFeeLamports,
                priorityFeeSOL,
                successScore: out.successScore,
                recommendedRpc: bestRpc,
                updatedAt: new Date().toISOString(),
                notes: [`congestionScore=${score}`]
            };

            // 3) Кэшируем на 10 сек
            await redis?.setex(key, 5, JSON.stringify(payload));
            return reply.send(payload);

        } catch (e) {
            // 4) При сбое — вернуть последний кэш, если он есть
            const cached = await redis?.get(key);
            if (cached) {
                const obj = JSON.parse(cached);
                obj.notes = [...(obj.notes || []), 'stale: rpc/metrics error'];
                return reply.send(obj); // 200 со stale
            }
            app.log.error(e, 'reco-fee failed and no cache');
            return reply.code(503).send({ error: 'unavailable' });
        }
    });
};

export default plugin;
