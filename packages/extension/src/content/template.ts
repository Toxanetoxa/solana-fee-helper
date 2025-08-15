export function renderTemplate(params: {
    mode: string;
    feeSOL: number;
    lamports: number;
    success: number;
    recommendedRpc: string | null;
    updatedAt: string;
    stale: boolean;
}) {
    const { mode, feeSOL, lamports, success, recommendedRpc, updatedAt, stale } = params;

    return `
    <b>mode</b>: ${mode} &nbsp; 
    <b>fee</b>: ${feeSOL.toFixed(9)} SOL 
      <span style="opacity:.8">(${Math.round(lamports)} lamports)</span>
    &nbsp; <b>success</b>: ${success}%
    &nbsp; <b>recommendedRpc</b>: ${recommendedRpc ?? '—'}
    &nbsp; <span style="opacity:.75">
      Updated: ${updatedAt}${stale ? ' · <span class="stale">stale</span>' : ''}
    </span>
  `;
}
