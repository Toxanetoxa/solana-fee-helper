type Risk = 'eco' | 'balanced' | 'aggr';
type TxType = 'transfer' | 'swap' | 'mint';

export interface RecoInput {
    risk: Risk;
    txType: TxType;
    cuEstimate?: number; // если не задано — возьмём дефолт
    congestionScore: number; // 0..100 (0 — пусто, 100 — оверлоад)
}

const DEFAULT_CU: Record<TxType, [number, number]> = {
    transfer: [25000, 40000],
    swap: [150000, 250000],
    mint: [300000, 500000]
};

function pickCu(tx: TxType, hint?: number) {
    if (hint) return hint;
    const [lo, hi] = DEFAULT_CU[tx];
    return Math.round((lo + hi) / 2);
}

function cuPriceByRisk(risk: Risk, congestion: number) {
    // примитивная шкала в microLamports/CU: растёт с congestion
    const base = 2000 + Math.round(congestion * 50); // 2k..7k
    const mult = risk === 'eco' ? 1.0 : risk === 'balanced' ? 1.2 : 1.5;
    return Math.round(base * mult); // p75/p85 эмпирически
}

export function recommend(input: RecoInput) {
    const cu = pickCu(input.txType, input.cuEstimate);
    const cuPrice = cuPriceByRisk(input.risk, input.congestionScore);
    const priorityFeeLamports = cu * cuPrice; // microLamports? упрощаем к лампортам для MVP
    // successScore: грубо — чем выше congestion, тем ниже; риск повышает шанс
    let success = 1 - input.congestionScore / 140; // 0..~1
    if (input.risk === 'balanced') success += 0.05;
    if (input.risk === 'aggr') success += 0.1;
    success = Math.max(0, Math.min(0.99, success));
    return {
        cuPrice,
        cuEstimate: cu,
        priorityFeeLamports,
        successScore: Number(success.toFixed(2))
    };
}
