import Fastify from 'fastify';
import cors from '@fastify/cors';
import { registerRecoFee } from './api/recoFee.js';

const app = Fastify({ logger: true });
await app.register(cors, { origin: true });

await app.register(registerRecoFee);

app.get('/health', async () => ({ ok: true }));

const port = Number(process.env.PORT || 8787);
app.listen({ port, host: '0.0.0.0' }).catch((err) => {
    app.log.error(err);
    process.exit(1);
});
