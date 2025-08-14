import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { recommend } from '../core/recommender.js';
import { redis } from '../utils/redis.js';
import {getCongestionScore} from "../core/metrics.js";

const Query = z.object({
    txType: z.enum(['transfer','swap','mint']).default('transfer'),
    risk: z.enum(['eco','balanced','aggr']).default('balanced')
});

export async function registerRecoFee(app: FastifyInstance) {
    app.get('/api/reco-fee', async (req, reply) => {
        const q = Query.parse((req as any).query);
        const key = `reco:${q.txType}:${q.risk}`;
        const cached = await redis.get(key);

        if (cached) return reply.send(JSON.parse(cached));

        const score = await getCongestionScore();
        const out = recommend({ txType: q.txType, risk: q.risk, congestionScore: score });
        const payload = { mode: q.risk, ...out, recommendedRpc: null, updatedAt: new Date().toISOString(), notes: [] };
        await redis.setex(key, 10, JSON.stringify(payload));
        return reply.send(payload);
    });
}
