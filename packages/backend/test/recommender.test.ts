import { describe, it, expect } from 'vitest';
import { recommend } from '../src/core/recommender';

describe('recommender', () => {
    it('eco vs aggr yields different fees and success', () => {
        const base = { txType: 'transfer', congestionScore: 70 as const };
        // @ts-ignore
        const eco = recommend({ risk: 'eco', ...base });
        // @ts-ignore
        const aggr = recommend({ risk: 'aggr', ...base });
        expect(aggr.priorityFeeLamports).toBeGreaterThan(eco.priorityFeeLamports);
        expect(aggr.successScore).toBeGreaterThan(eco.successScore);
    });
});
