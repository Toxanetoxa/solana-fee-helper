export type Risk = 'eco' | 'balanced' | 'aggr';
export type TxType = 'transfer' | 'swap' | 'mint';

export interface RecoInput {
    risk: Risk;
    txType: TxType;
    congestionScore: number; // 0..100 (0 — пусто, 100 — перегруз)
    cuEstimate?: number;     // если не задано — возьмём дефолт
}

export interface RecoOutput {
    cuPrice: number;               // microLamports per CU
    cuEstimate: number;            // CUs
    priorityFeeLamports: number;   // лампорты (см. note ниже)
    successScore: number;          // 0..1
}

/**
 * NOTE про единицы:
 *  - cuPrice — в µlamports/CU
 *  - priorityFeeLamports — мы считаем как (cuPrice * CU) / 1e6, то есть приводим к лампортам,
 *    чтобы фронту было проще показывать (а затем делить на 1e9 для SOL).
 */

const DEFAULT_CU: Record<TxType, [number, number]> = {
    transfer: [25_000, 40_000],
    swap:     [150_000, 250_000],
    mint:     [300_000, 500_000]
};

function pickCu(tx: TxType, hint?: number) {
    if (hint) return hint;
    const [lo, hi] = DEFAULT_CU[tx];
    return Math.round((lo + hi) / 2);
}

function cuPriceByRisk(risk: Risk, congestion: number) {
    // примитивная шкала в microLamports/CU: растёт с congestion
    const base = 2_000 + Math.round(congestion * 50); // ~ 2k..7k
    const mult = risk === 'eco' ? 1.0 : risk === 'balanced' ? 1.2 : 1.5;
    return Math.round(base * mult); // p75/p85 эмпирически
}

export function recommend(input: RecoInput): RecoOutput {
    const cu = pickCu(input.txType, input.cuEstimate);
    const cuPrice = cuPriceByRisk(input.risk, input.congestionScore); // µlamports per CU

    // priorityFee в лампортах: µlamports * CU → делим на 1e6
    const priorityFeeLamports = Math.round((cuPrice * cu) / 1e6);

    // успех: мягче штрафуем за congestion, сильнее учитываем режим
    let success = 0.92 - input.congestionScore * 0.003; // 0..1
    if (input.risk === 'balanced') success += 0.04;
    if (input.risk === 'aggr')     success += 0.09;
    success = Math.max(0.55, Math.min(0.995, success));

    return {
        cuPrice,
        cuEstimate: cu,
        priorityFeeLamports,
        successScore: Number(success.toFixed(2))
    };
}
