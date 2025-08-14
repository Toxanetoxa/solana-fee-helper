import { defineManifest } from '@crxjs/vite-plugin';

export default defineManifest({
    manifest_version: 3,
    name: 'Solana Fee & Success Helper',
    version: '1.0.0',
    permissions: ['storage'],
    host_permissions: ['http://localhost:8787/*', 'https://jup.ag/*', 'https://*.jup.ag/*'],
    background: { service_worker: 'src/background/index.ts', type: 'module' }, // можно оставить пустым файлом
    content_scripts: [
        {
            matches: ['https://jup.ag/*', 'https://*.jup.ag/*'],
            js: ['src/content/inject.ts'],
            run_at: 'document_idle'
        }
    ]
});
