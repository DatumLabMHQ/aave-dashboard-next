// Loads the Aave shapes the pages read. From the platform when DATUM_API_KEY is set, otherwise from
// lib/sample.ts, labelled as sample on every page. Three resources: aave/markets, aave/reserves, aave/protocols.
import { cache } from 'react';
import { config } from '@/datum.config';
import { hasKey, query } from './datum';
import { count, num, pct, price, usd } from './format';
import { chainLogo } from './chains';
import { sampleAave, sampleMarket, sampleReserve } from './sample';
import type { AaveOverview, ChainRow, Market, MarketDetail, Point, Reserve, ReserveDetail, Risk, Share, Version } from './aave-types';

const R = config.resources;
const risk = (u: number): Risk => (u > 85 ? 'high' : u > 70 ? 'moderate' : 'safe');
const dayOf = (v: unknown) => String(v ?? '').slice(0, 10);
const byDayAsc = (a: { day: string }, b: { day: string }) => a.day.localeCompare(b.day);
const isoDaysAgo = (n: number, from = new Date()) => { const d = new Date(from); d.setUTCDate(d.getUTCDate() - n); return d.toISOString().slice(0, 10); };
const sum = <T,>(xs: T[], f: (x: T) => number) => xs.reduce((a, x) => a + f(x), 0);
const change = (now: number, then: number | undefined) => (then ? (now / then - 1) * 100 : 0);
const shares = (m: Map<string, number>): Share[] => [...m.entries()].map(([name, value]) => ({ name, value })).filter((s) => s.value > 0).sort((a, b) => b.value - a.value);
const title = (s: string) => s.replace(/\b\w/g, (c) => c.toUpperCase());
const LOCAL = new Set(['ethereum', 'base', 'arbitrum', 'optimism', 'avalanche', 'polygon', 'unichain']);
const logoBySlug = (slug: string) => (LOCAL.has(slug) ? `/brand/logos/chain-${slug}.webp` : `https://icons.llamao.fi/icons/chains/rsz_${slug.replace(/ /g, '%20')}.jpg`);

export const marketId = (version: unknown, chain: unknown, key: unknown) => `${version}-${chain}-${String(key).toLowerCase()}`;
/** "AaveV3EthereumHorizon" -> "Ethereum Horizon"; a v4 spoke is named by its chain and key. */
export const marketLabel = (name: string, version: Version, chain: string, key: string) => {
  if (version === 'v4' || /Spoke$/.test(name)) return `${chain} spoke ${key.slice(2, 8)}`;
  const core = name.replace(/^AaveV\d/, '').replace(/([a-z])([A-Z])/g, '$1 $2');
  return core || chain;
};
export function toMarket(r: Record<string, unknown>): Market {
  const version = (String(r.version) === 'v4' ? 'v4' : 'v3') as Version; const chain = String(r.chain_name ?? r.chain_id ?? ''); const key = String(r.market_key ?? '').toLowerCase();
  const supplied = num(r.supply_usd), borrowed = num(r.borrow_usd); const u = supplied ? (borrowed / supplied) * 100 : 0;
  return { id: marketId(version, r.chain_id, key), version, chainId: num(r.chain_id), chain, name: String(r.market_name ?? ''), label: marketLabel(String(r.market_name ?? ''), version, chain, key), key, reserves: num(r.reserves),
    supplied, borrowed, net: r.net_usd != null ? num(r.net_usd) : supplied - borrowed, supplyApy: num(r.supply_apy_weighted), borrowApy: num(r.borrow_apy_weighted), utilization: u, apiSize: r.api_total_market_size_usd == null ? null : num(r.api_total_market_size_usd), risk: risk(u), logo: chainLogo(String(r.chain_id)) };
}
export function toReserve(r: Record<string, unknown>, labels: Map<string, string>): Reserve {
  const version = (String(r.version) === 'v4' ? 'v4' : 'v3') as Version; const mid = marketId(version, r.chain_id, r.market_key); const chain = String(r.chain_name ?? r.chain_id ?? '');
  const supplied = num(r.supply_usd), borrowed = num(r.borrow_usd); const u = r.utilization != null ? num(r.utilization) : supplied ? (borrowed / supplied) * 100 : 0;
  return { id: `${mid}-${String(r.underlying_address ?? r.symbol ?? '').toLowerCase()}`, marketId: mid, marketLabel: labels.get(mid) ?? marketLabel(String(r.market_name ?? ''), version, chain, String(r.market_key ?? '')), version, chainId: num(r.chain_id), chain,
    symbol: String(r.symbol ?? ''), underlying: String(r.underlying_address ?? ''), price: num(r.price_usd), supplied, borrowed, available: Math.max(0, supplied - borrowed), utilization: u,
    supplyApy: num(r.supply_apy), borrowApy: num(r.borrow_apy), liqThreshold: num(r.liquidation_threshold), risk: risk(u), logo: chainLogo(String(r.chain_id)) };
}

/** The overview: latest markets, reserves and chains; our own daily trend; DefiLlama's long view. */
export const loadAave = cache(async (): Promise<AaveOverview> => {
  if (!hasKey()) return sampleAave();
  const since = isoDaysAgo(config.trend.days + 2), csince = isoDaysAgo(config.contextDays);
  const [ms, rs, ps, mh, ph] = await Promise.all([
    query(R.markets.product, R.markets.name, { limit: 500 }),
    query(R.reserves.product, R.reserves.name, { limit: 5000 }),
    query(R.protocols.product, R.protocols.name, { limit: 500 }),
    query(R.markets.product, R.markets.name, { since, limit: 5000 }),
    query(R.protocols.product, R.protocols.name, { since: csince, limit: 5000 }),
  ]);
  const markets = ms.rows.map(toMarket).sort((a, b) => b.supplied - a.supplied);
  const labels = new Map(markets.map((m) => [m.id, m.label]));
  const reserves = rs.rows.map((r) => toReserve(r, labels)).sort((a, b) => b.supplied - a.supplied);
  const chains: ChainRow[] = ps.rows.map((r) => ({ id: `${r.slug}-${String(r.chain).replace(/ /g, '-')}`, chain: title(String(r.chain ?? '')), slug: String(r.slug ?? ''), version: String(r.slug ?? '').replace('aave-', ''), tvlNet: num(r.tvl_net_usd), tvlGross: num(r.tvl_gross_usd), borrowed: num(r.borrowed_usd), logo: logoBySlug(String(r.chain ?? '')) })).filter((c) => c.tvlNet > 0).sort((a, b) => b.tvlNet - a.tvlNet);
  const asOf = dayOf(ms.day ?? new Date().toISOString());
  const days = new Map<string, { supply: number; borrow: number }>();
  mh.rows.forEach((r) => { const d = dayOf(r.day); if (!d) return; const c = days.get(d) ?? { supply: 0, borrow: 0 }; c.supply += num(r.supply_usd); c.borrow += num(r.borrow_usd); days.set(d, c); });
  const history: Point[] = [...days.entries()].map(([day, v]) => ({ day, ...v })).sort(byDayAsc);
  const cdays = new Map<string, number>();
  ph.rows.forEach((r) => { const d = dayOf(r.day); if (d) cdays.set(d, (cdays.get(d) ?? 0) + num(r.tvl_net_usd)); });
  const context: Point[] = [...cdays.entries()].map(([day, tvl]) => ({ day, tvl })).sort(byDayAsc);
  const weekAgo = history.find((p) => p.day === isoDaysAgo(7, new Date(asOf + 'T00:00:00Z')));
  const supplied = sum(markets, (m) => m.supplied), borrowed = sum(markets, (m) => m.borrowed);
  const byVersion = new Map<string, number>(); markets.forEach((m) => byVersion.set(m.version === 'v4' ? 'Aave v4 spokes' : 'Aave v3 markets', (byVersion.get(m.version === 'v4' ? 'Aave v4 spokes' : 'Aave v3 markets') ?? 0) + m.supplied));
  const byChain = new Map<string, number>(); markets.forEach((m) => byChain.set(m.chain, (byChain.get(m.chain) ?? 0) + m.supplied));
  const withApi = markets.filter((m) => m.apiSize);
  const reconciliation: AaveOverview['reconciliation'] = withApi.length ? { ours: sum(withApi, (m) => m.supplied), theirs: sum(withApi, (m) => m.apiSize ?? 0), theirsSource: `Aave API totalMarketSize (${asOf}, ${count(withApi.length)} markets)`, note: 'Aave\'s own total for each market beside our sum of its reserves. They should agree to within a price feed; a wider gap on one market points at a reserve we price differently, and the market page shows which.' } : null;
  return {
    asOf, sample: false,
    kpis: { supplied, borrowed, utilization: supplied ? (borrowed / supplied) * 100 : 0, suppliedChange7d: change(supplied, weekAgo ? num(weekAgo.supply) : undefined), borrowedChange7d: change(borrowed, weekAgo ? num(weekAgo.borrow) : undefined),
      markets: markets.length, reserves: reserves.length, chains: new Set(markets.map((m) => m.chainId)).size, supplyApy: supplied ? sum(markets, (m) => m.supplyApy * m.supplied) / supplied : 0, v4Share: supplied ? (sum(markets.filter((m) => m.version === 'v4'), (m) => m.supplied) / supplied) * 100 : 0 },
    history, context, byVersion: shares(byVersion), byChain: shares(byChain), markets, reserves, chains, reconciliation,
  };
});

/** One market: its reserves on the latest day and its own daily rows for the trend window. */
export const loadMarket = cache(async (id: string): Promise<MarketDetail | null> => {
  if (!hasKey()) return sampleMarket(id);
  const o = await loadAave();
  const market = o.markets.find((m) => m.id === id.toLowerCase());
  if (!market) return null;
  const h = await query(R.markets.product, R.markets.name, { version: market.version, chain_id: market.chainId, market_key: market.key, since: isoDaysAgo(config.trend.days, new Date(o.asOf + 'T00:00:00Z')), limit: 1000 });
  const rows = h.rows.map((r) => ({ day: dayOf(r.day), supply: num(r.supply_usd), borrow: num(r.borrow_usd), sa: num(r.supply_apy_weighted), ba: num(r.borrow_apy_weighted) })).filter((r) => r.day).sort(byDayAsc);
  return { asOf: o.asOf, sample: false, market, reserves: o.reserves.filter((r) => r.marketId === market.id),
    history: rows.map((r) => ({ day: r.day, supply: r.supply, borrow: r.borrow })), rates: rows.map((r) => ({ day: r.day, supply_apy: r.sa, borrow_apy: r.ba })), facts: marketFacts(market) };
});
export const marketFacts = (m: Market) => [
  { label: 'Version', value: m.version === 'v4' ? 'Aave v4 spoke' : 'Aave v3 market', note: m.version === 'v4' ? 'One lending market attached to the v4 hub' : 'One pool on one chain' },
  { label: 'Reserves', value: count(m.reserves), note: 'Assets that can be supplied or borrowed here' },
  ...(m.apiSize != null ? [{ label: 'Aave API total', value: usd(m.apiSize), note: `${Math.abs(m.apiSize / (m.supplied || 1) - 1) * 100 < 1 ? 'Within 1% of' : `${pct(Math.abs(m.apiSize / (m.supplied || 1) - 1) * 100, 1)} from`} our sum of the reserves` }] : []),
  { label: 'Idle liquidity', value: usd(m.supplied - m.borrowed), note: 'Supplied and not borrowed; what can be withdrawn now' },
  { label: 'Chain', value: m.chain }, { label: 'Market address', value: m.key },
];

/** One reserve: its own daily rows for the trend window. */
export const loadReserve = cache(async (id: string): Promise<ReserveDetail | null> => {
  if (!hasKey()) return sampleReserve(id);
  const o = await loadAave();
  const reserve = o.reserves.find((r) => r.id === id.toLowerCase());
  if (!reserve) return null;
  const h = await query(R.reserves.product, R.reserves.name, { version: reserve.version, chain_id: reserve.chainId, market_key: reserve.marketId.split('-').slice(2).join('-'), symbol: reserve.symbol, since: isoDaysAgo(config.trend.days, new Date(o.asOf + 'T00:00:00Z')), limit: 1000 });
  const rows = h.rows.filter((r) => String(r.underlying_address ?? '').toLowerCase() === reserve.underlying).map((r) => ({ day: dayOf(r.day), supplied: num(r.supply_usd), borrowed: num(r.borrow_usd), sa: num(r.supply_apy), ba: num(r.borrow_apy), u: num(r.utilization) })).filter((r) => r.day).sort(byDayAsc);
  return { asOf: o.asOf, sample: false, reserve, history: rows.map((r) => ({ day: r.day, supplied: r.supplied, borrowed: r.borrowed })), rates: rows.map((r) => ({ day: r.day, supply_apy: r.sa, borrow_apy: r.ba, utilization: r.u })), facts: reserveFacts(reserve) };
});
export const reserveFacts = (r: Reserve) => [
  { label: 'Liquidation threshold', value: pct(r.liqThreshold, 0), note: 'Debt to collateral ratio at which a position here can be liquidated' },
  { label: 'Price', value: price(r.price), note: 'What the platform values one token at' },
  { label: 'Available', value: usd(r.available), note: 'Supplied and not borrowed; what can be withdrawn now' },
  { label: 'Market', value: r.marketLabel }, { label: 'Chain', value: r.chain }, { label: 'Version', value: r.version === 'v4' ? 'Aave v4' : 'Aave v3' },
  { label: 'Underlying address', value: r.underlying },
];
