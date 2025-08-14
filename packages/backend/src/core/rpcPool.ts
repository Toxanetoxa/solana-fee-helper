import { Connection } from '@solana/web3.js';

export function getConnections(): Connection[] {
    const list = (process.env.RPC_ENDPOINTS || '').split(',').map(s => s.trim()).filter(Boolean);
    if (list.length === 0) throw new Error('RPC_ENDPOINTS empty');
    return list.map((url) => new Connection(url, 'confirmed'));
}
