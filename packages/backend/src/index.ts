import Fastify from 'fastify';
import cors from '@fastify/cors';
import plugin from './api/recoFee.js';

const app = Fastify({ logger: true });
await app.register(cors, {
    origin: (origin, cb) => {
        const allowed = [ 'https://jup.ag', /\.jup\.ag$/ ];
        if (!origin) return cb(null, true);
        const ok = allowed.some((rule) => rule instanceof RegExp ? rule.test(origin) : rule === origin);
        cb(ok ? null : new Error('CORS'), ok);
    }
});

await app.register(plugin);

app.get('/health', async () => ({ ok: true }));

const port = Number(process.env.PORT || 8787);
app.listen({ port, host: '0.0.0.0' }).catch((err) => {
    app.log.error(err);
    process.exit(1);
});
