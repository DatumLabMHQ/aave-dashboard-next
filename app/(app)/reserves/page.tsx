import { PageHeader } from '@/components/page-header';
import { ReservesTable } from '@/components/aave-tables';
import { BarChart, DonutChart } from '@/components/charts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { loadAave } from '@/lib/data';
import { count, pct, usd } from '@/lib/format';

export const revalidate = 300;
export const metadata = { title: 'Reserves' };

export default async function Reserves() {
  const d = await loadAave();
  const rs = d.reserves;
  const bySymbol = new Map<string, number>(); rs.forEach((r) => bySymbol.set(r.symbol, (bySymbol.get(r.symbol) ?? 0) + r.supplied));
  const assets = [...bySymbol.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8);
  const tight = rs.filter((r) => r.borrowed > 1e6).sort((a, b) => b.utilization - a.utilization).slice(0, 10).map((r) => ({ name: `${r.symbol} · ${r.marketLabel}`, utilization: r.utilization }));
  const high = rs.filter((r) => r.risk === 'high' && r.borrowed > 1e6);
  return (
    <>
      <PageHeader eyebrow="Reserves" question="Which assets does Aave lend, and which reserves are tight?"
        answer={<>{count(rs.length)} reserves across every market as of {d.asOf}; the top asset, {assets[0]?.name ?? ''}, is {usd(assets[0]?.value ?? 0)} of supply. {high.length === 0 ? 'No reserve with real borrowing is above 85% utilisation.' : `${count(high.length)} ${high.length === 1 ? 'reserve with real borrowing is' : 'reserves with real borrowing are'} above 85% utilisation, where withdrawals start to queue.`}</>} />
      <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @4xl/main:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Supplied by asset</CardTitle><CardDescription>Summed across every market and chain. ETH and its staked forms, then dollars, then BTC.</CardDescription></CardHeader>
          <CardContent><DonutChart items={assets} unit="usd" height={220} centerLabel="supplied" /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Tightest reserves</CardTitle><CardDescription>Utilisation of the ten most-borrowed reserves with more than a million borrowed. Above 85% a supplier may wait to withdraw.</CardDescription></CardHeader>
          <CardContent className="px-2"><BarChart data={tight} x="name" series={[{ key: 'utilization', label: 'Utilisation' }]} unit="pct" horizontal labels height={Math.max(220, tight.length * 28)} categoryWidth={150} /></CardContent>
        </Card>
      </div>
      <ReservesTable data={rs} title="All reserves" pageSize={20}
        caption={<><b className="font-medium text-foreground">Per-reserve risk.</b> Utilisation above 85% means suppliers may wait to withdraw; the liquidation threshold is where a borrower against this asset is liquidated. Filter by asset, market or chain; every reserve opens to its history.</>} />
    </>
  );
}
