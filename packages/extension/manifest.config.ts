import { defineManifest } from '@crxjs/vite-plugin';

export default defineManifest({
    manifest_version: 3,
    name: 'Solana Fee & Success Helper',
    version: '0.0.1',
    permissions: ['storage'],
    host_permissions: ['http://localhost:8787/*'],
    background: { service_worker: 'src/background/index.ts' },
    action: { default_popup: 'src/popup/index.html' },
    content_scripts: [
        {
            matches: ['https://jupiter.exchange/*', 'https://phantom.app/*'],
            js: ['src/content/inject.js'],
            run_at: 'document_end'
        }
    ]
});
