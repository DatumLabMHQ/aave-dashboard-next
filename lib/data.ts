// What the kit's frame reads from this dashboard (lib/platform.ts FrameData), plus the loaders the
// pages use. The Aave shapes and loaders live in lib/aave.ts.
import type { FrameData } from './platform';
import { loadAave } from './aave';
export { platformStatus, showKit } from './platform';
export { loadAave, loadMarket, loadReserve } from './aave';

/** Markets and reserves, for the cmd+k palette. */
export const searchItems: FrameData['searchItems'] = async () => {
  const o = await loadAave();
  return [
    ...o.markets.map((m) => ({ label: `${m.label} (${m.version})`, href: `/markets/${m.id}`, hint: m.chain })),
    ...o.reserves.map((r) => ({ label: `${r.symbol} in ${r.marketLabel}`, href: `/reserves/${r.id}`, hint: r.chain })),
  ];
};
/** Counts next to the nav entries. */
export const navBadges: FrameData['navBadges'] = async () => {
  const o = await loadAave();
  return { '/markets': o.markets.length, '/reserves': o.reserves.length, '/chains': o.chains.length };
};
/** Markets, the largest reserves and chains under their pages in the sidebar. */
export const navChildren: FrameData['navChildren'] = async () => {
  const o = await loadAave();
  return {
    '/markets': o.markets.map((m) => ({ label: `${m.label} · ${m.version}`, href: `/markets/${m.id}` })),
    '/reserves': o.reserves.map((r) => ({ label: `${r.symbol} · ${r.marketLabel}`, href: `/reserves/${r.id}` })),
    '/chains': o.chains.map((c) => ({ label: `${c.chain} · ${c.version}`, href: '/chains' })),
  };
};
