// The shapes the Aave pages read. lib/aave.ts fills them from the platform's three aave resources
// (or lib/sample.ts without a key), so pages never depend on a resource's raw column names.
import type { Point, Share } from './types';
export type { Point, Share, Fact } from './types';

export type Risk = 'safe' | 'moderate' | 'high';
export type Version = 'v3' | 'v4';
export type Market = {
  id: string; version: Version; chainId: number; chain: string; name: string; label: string; key: string; reserves: number;
  supplied: number; borrowed: number; net: number; supplyApy: number; borrowApy: number; utilization: number; apiSize: number | null; risk: Risk; logo?: string;
};
export type Reserve = {
  id: string; marketId: string; marketLabel: string; version: Version; chainId: number; chain: string; symbol: string; underlying: string; price: number;
  supplied: number; borrowed: number; available: number; utilization: number; supplyApy: number; borrowApy: number; liqThreshold: number; risk: Risk; logo?: string;
};
export type ChainRow = { id: string; chain: string; slug: string; version: string; tvlNet: number; tvlGross: number; borrowed: number; logo?: string };
export type AaveOverview = {
  asOf: string; sample: boolean;
  kpis: { supplied: number; borrowed: number; utilization: number; suppliedChange7d: number; borrowedChange7d: number; markets: number; reserves: number; chains: number; supplyApy: number; v4Share: number };
  history: Point[];   // day, supply, borrow (our own count, from markets)
  context: Point[];   // day, tvl (DefiLlama net TVL, all versions)
  byVersion: Share[]; byChain: Share[];
  markets: Market[]; reserves: Reserve[]; chains: ChainRow[];
  reconciliation: { ours: number; theirs: number; theirsSource: string; note: string } | null;
};
export type MarketDetail = { asOf: string; sample: boolean; market: Market; reserves: Reserve[]; history: Point[]; rates: Point[]; facts: import('./types').Fact[] };
export type ReserveDetail = { asOf: string; sample: boolean; reserve: Reserve; history: Point[]; rates: Point[]; facts: import('./types').Fact[] };
