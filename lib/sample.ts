// Labelled sample data for the pages when no DATUM_API_KEY is set. Shaped like the platform's
// September 2026 numbers so the dashboard can be judged as is; every page says it is sample data.
import { SAMPLE_AS_OF } from './platform';
import { chainLogo, chainName } from './chains';
import type { AaveOverview, ChainRow, Market, MarketDetail, Point, Reserve, ReserveDetail, Version } from './aave-types';
export { SAMPLE_AS_OF };

const rnd = (seed: number) => () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
const daysBack = (n: number, from = SAMPLE_AS_OF) => Array.from({ length: n + 1 }, (_, i) => { const d = new Date(from + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() - (n - i)); return d.toISOString().slice(0, 10); });
const series = (days: string[], end: number, growth: number, wobble: number, seed: number) => { const r = rnd(seed); const out: number[] = []; let v = end / (1 + growth); days.forEach(() => { v *= 1 + growth / days.length + (r() - 0.5) * wobble; out.push(v); }); const k = end / out[out.length - 1]; return out.map((x) => x * k); };
const risk = (u: number) => (u > 85 ? 'high' : u > 70 ? 'moderate' : 'safe') as Market['risk'];
// version, chain id, label, key tail, reserves, supplied, borrowed, supply APY, borrow APY
const MARKETS: [Version, number, string, string, number, number, number, number, number][] = [
  ['v3', 1, 'Ethereum', '4fa4e2', 67, 24.19e9, 9.68e9, 1.13, 3.27], ['v3', 42161, 'Arbitrum', '814ad', 20, 2.41e9, 1.12e9, 1.9, 3.6], ['v3', 8453, 'Base', '8d1c5', 15, 2.02e9, 1.05e9, 2.4, 3.9],
  ['v3', 43114, 'Avalanche', '5e12', 18, 1.06e9, 0.42e9, 1.4, 3.1], ['v3', 137, 'Polygon', '814ad', 21, 0.62e9, 0.23e9, 1.6, 3.4], ['v3', 1, 'Ethereum Lido', '3c9b1', 6, 0.98e9, 0.61e9, 0.9, 2.8],
  ['v4', 1, 'Ethereum spoke 8f2a1c', '8f2a1c', 12, 1.61e9, 0.74e9, 2.1, 3.8], ['v4', 8453, 'Base spoke 3b7d20', '3b7d20', 9, 0.52e9, 0.21e9, 2.6, 4.2], ['v4', 42161, 'Arbitrum spoke a1c4e9', 'a1c4e9', 8, 0.31e9, 0.13e9, 2.2, 3.9],
];
const markets = (): Market[] => MARKETS.map(([version, chainId, label, tail, reserves, supplied, borrowed, supplyApy, borrowApy]) => { const key = `0x${tail}${'0'.repeat(40 - tail.length)}`; const u = (borrowed / supplied) * 100; return { id: `${version}-${chainId}-${key}`, version, chainId, chain: chainName(chainId), name: `Aave${version.toUpperCase()}${label.replace(/ /g, '')}`, label, key, reserves, supplied, borrowed, net: supplied - borrowed, supplyApy, borrowApy, utilization: u, apiSize: supplied * 1.003, risk: risk(u), logo: chainLogo(chainId) }; });
// market index, symbol, price, supplied, borrowed, supply APY, borrow APY, liquidation threshold
const RESERVES: [number, string, number, number, number, number, number, number][] = [
  [0, 'WETH', 2451, 5.15e9, 4.33e9, 1.48, 2.08, 83], [0, 'wstETH', 2960, 4.92e9, 0.21e9, 0.05, 0.3, 81], [0, 'USDC', 1, 3.41e9, 2.98e9, 3.9, 5.2, 78], [0, 'USDT', 1, 2.86e9, 2.4e9, 3.7, 5.0, 78], [0, 'WBTC', 116300, 3.21e9, 0.14e9, 0.02, 0.4, 78], [0, 'GHO', 1, 0.42e9, 0.39e9, 4.1, 6.3, 0],
  [1, 'WETH', 2451, 0.98e9, 0.71e9, 1.7, 2.6, 83], [1, 'USDC', 1, 0.74e9, 0.6e9, 4.2, 5.6, 78], [2, 'WETH', 2451, 0.91e9, 0.62e9, 1.9, 2.8, 83], [2, 'USDC', 1, 0.83e9, 0.71e9, 4.6, 6.1, 78], [2, 'cbBTC', 116300, 0.28e9, 0.02e9, 0.01, 0.3, 78],
  [6, 'WETH', 2451, 0.7e9, 0.4e9, 2.2, 3.4, 83], [6, 'USDC', 1, 0.61e9, 0.52e9, 4.4, 5.9, 78], [7, 'USDC', 1, 0.3e9, 0.2e9, 4.8, 6.4, 78],
];
const reserves = (ms: Market[]): Reserve[] => RESERVES.map(([mi, symbol, pr, supplied, borrowed, supplyApy, borrowApy, liqThreshold], i) => { const m = ms[mi]; const u = (borrowed / supplied) * 100; const underlying = `0x${(i + 11).toString(16).padStart(4, '0')}${'ab'.repeat(18)}`; return { id: `${m.id}-${underlying}`, marketId: m.id, marketLabel: m.label, version: m.version, chainId: m.chainId, chain: m.chain, symbol, underlying, price: pr, supplied, borrowed, available: supplied - borrowed, utilization: u, supplyApy, borrowApy, liqThreshold, risk: risk(u), logo: m.logo }; });
const chains = (): ChainRow[] => [['aave-v3', 'ethereum', 14.2e9, 24.0e9, 9.8e9], ['aave-v3', 'arbitrum', 1.3e9, 2.4e9, 1.1e9], ['aave-v3', 'base', 0.97e9, 2.0e9, 1.05e9], ['aave-v4', 'ethereum', 0.87e9, 1.6e9, 0.74e9], ['aave-v3', 'avalanche', 0.64e9, 1.06e9, 0.42e9], ['aave-v2', 'ethereum', 0.21e9, 0.3e9, 0.09e9]].map(([slug, chain, n, g, b]) => ({ id: `${slug}-${chain}`, chain: String(chain).replace(/\b\w/g, (c) => c.toUpperCase()), slug: String(slug), version: String(slug).replace('aave-', ''), tvlNet: n as number, tvlGross: g as number, borrowed: b as number, logo: `/brand/logos/chain-${chain}.webp` }));
export function sampleAave(): AaveOverview {
  const ms = markets(), rs = reserves(ms), cs = chains(); const days = daysBack(12); const cdays = daysBack(400);
  const supplied = ms.reduce((a, m) => a + m.supplied, 0), borrowed = ms.reduce((a, m) => a + m.borrowed, 0);
  const s = series(days, supplied, 0.02, 0.006, 3), b = series(days, borrowed, 0.03, 0.01, 5), c = series(cdays, cs.reduce((a, x) => a + x.tvlNet, 0), 0.35, 0.01, 7);
  const share = (key: (m: Market) => string) => { const mm = new Map<string, number>(); ms.forEach((m) => mm.set(key(m), (mm.get(key(m)) ?? 0) + m.supplied)); return [...mm.entries()].map(([name, value]) => ({ name, value })).sort((x, y) => y.value - x.value); };
  const v4 = ms.filter((m) => m.version === 'v4').reduce((a, m) => a + m.supplied, 0);
  return { asOf: SAMPLE_AS_OF, sample: true,
    kpis: { supplied, borrowed, utilization: (borrowed / supplied) * 100, suppliedChange7d: (s[12] / s[5] - 1) * 100, borrowedChange7d: (b[12] / b[5] - 1) * 100, markets: ms.length, reserves: rs.length, chains: new Set(ms.map((m) => m.chainId)).size, supplyApy: ms.reduce((a, m) => a + m.supplyApy * m.supplied, 0) / supplied, v4Share: (v4 / supplied) * 100 },
    history: days.map((day, i) => ({ day, supply: Math.round(s[i]), borrow: Math.round(b[i]) })) as Point[], context: cdays.map((day, i) => ({ day, tvl: Math.round(c[i]) })) as Point[],
    byVersion: share((m) => (m.version === 'v4' ? 'Aave v4 spokes' : 'Aave v3 markets')), byChain: share((m) => m.chain), markets: ms, reserves: rs, chains: cs,
    reconciliation: { ours: supplied, theirs: supplied * 1.003, theirsSource: 'Aave API totalMarketSize (sample)', note: 'Aave\'s own total for each market beside our sum of its reserves; they agree to within a price feed.' } };
}
export function sampleMarket(id: string): MarketDetail | null {
  const ms = markets(); const m = ms.find((x) => x.id === id.toLowerCase()); if (!m) return null;
  const days = daysBack(12); const s = series(days, m.supplied, 0.02, 0.008, 21), b = series(days, m.borrowed, 0.03, 0.012, 23);
  return { asOf: SAMPLE_AS_OF, sample: true, market: m, reserves: reserves(ms).filter((r) => r.marketId === m.id), history: days.map((day, i) => ({ day, supply: Math.round(s[i]), borrow: Math.round(b[i]) })), rates: days.map((day, i) => ({ day, supply_apy: +(m.supplyApy * (0.95 + (i % 4) * 0.02)).toFixed(2), borrow_apy: +(m.borrowApy * (0.95 + (i % 3) * 0.03)).toFixed(2) })),
    facts: [{ label: 'Version', value: m.version === 'v4' ? 'Aave v4 spoke' : 'Aave v3 market' }, { label: 'Reserves', value: String(m.reserves) }, { label: 'Aave API total', value: `$${(m.supplied * 1.003 / 1e9).toFixed(2)}B` }, { label: 'Chain', value: m.chain }, { label: 'Market address', value: m.key }] };
}
export function sampleReserve(id: string): ReserveDetail | null {
  const rs = reserves(markets()); const r = rs.find((x) => x.id === id.toLowerCase()); if (!r) return null;
  const days = daysBack(12); const s = series(days, r.supplied, 0.02, 0.01, 31), b = series(days, r.borrowed || 1, 0.03, 0.015, 37);
  return { asOf: SAMPLE_AS_OF, sample: true, reserve: r, history: days.map((day, i) => ({ day, supplied: Math.round(s[i]), borrowed: Math.round(r.borrowed ? b[i] : 0) })), rates: days.map((day, i) => ({ day, supply_apy: +(r.supplyApy * (0.95 + (i % 4) * 0.02)).toFixed(2), borrow_apy: +(r.borrowApy * (0.95 + (i % 3) * 0.03)).toFixed(2), utilization: +((r.borrowed ? b[i] / s[i] : 0) * 100).toFixed(1) })),
    facts: [{ label: 'Liquidation threshold', value: `${r.liqThreshold}%` }, { label: 'Price', value: `$${r.price}` }, { label: 'Market', value: r.marketLabel }, { label: 'Chain', value: r.chain }, { label: 'Version', value: r.version }, { label: 'Underlying address', value: r.underlying }] };
}
