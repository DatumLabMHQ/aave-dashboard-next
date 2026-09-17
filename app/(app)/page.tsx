// Overview: the question, the one-line answer, then the numbers. Cards, trend, composition and the
// markets table read the Aave shapes from lib/data.ts (the platform, or labelled sample data).
import { config } from '@/datum.config';
import { ChartAreaInteractive } from '@/components/chart-area-interactive';
import { PageHeader } from '@/components/page-header';
import { AaveCards } from '@/components/aave-cards';
import { MarketsTable } from '@/components/aave-tables';
import { AreaChart, DonutChart } from '@/components/charts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { loadAave } from '@/lib/data';
import { count, pct, usd } from '@/lib/format';

export const revalidate = 300;

export default async function Overview() {
  const d = await loadAave();
  const k = d.kpis;
  const lead = d.markets[0];
  return (
    <>
      <PageHeader eyebrow="Overview" question={config.question}
        answer={<>{usd(k.supplied)} is supplied across {count(k.markets)} markets on {count(k.chains)} chains and {pct(k.utilization, 1)} of it is borrowed. {lead ? `${lead.label} alone holds ${usd(lead.supplied)}, ${pct(k.supplied ? (lead.supplied / k.supplied) * 100 : 0, 0)} of the book.` : ''} Aave v4 spokes carry {pct(k.v4Share, 1)} of supplied value. As of {d.asOf}.</>} />
      <AaveCards kpis={k} asOf={d.asOf} />
      <div className="px-4 lg:px-6">
        <ChartAreaInteractive data={d.history} asOf={d.asOf} title="Supplied and borrowed, every market" description={<>Our own sum of every reserve in every market. Supplied is the ceiling, borrowed is the demand; the gap between them is the idle liquidity that sets rates. Daily points from 4 September 2026, as of {d.asOf}.</>} />
      </div>
      <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @4xl/main:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>DefiLlama net TVL, the long view</CardTitle><CardDescription>All Aave versions, every chain, {config.contextDays} days by DefiLlama&apos;s count. Context for the trend above, never the headline.</CardDescription></CardHeader>
          <CardContent className="px-2"><AreaChart data={d.context} series={[{ key: 'tvl', label: 'Net TVL' }]} unit="usd" height={220} /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Supplied by version</CardTitle><CardDescription>v3 markets against v4 spokes. The v4 share is the number to watch through the migration.</CardDescription></CardHeader>
          <CardContent><DonutChart items={d.byVersion} unit="usd" height={220} centerLabel="supplied" /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Supplied by chain</CardTitle><CardDescription>Ethereum carries most of it; the next tier is where new deposits show up first.</CardDescription></CardHeader>
          <CardContent><DonutChart items={d.byChain.slice(0, 8)} unit="usd" height={220} centerLabel="supplied" /></CardContent>
        </Card>
      </div>
      <MarketsTable data={d.markets} title="Markets" pageSize={10}
        caption={<><b className="font-medium text-foreground">Where the money actually is.</b> One row per v3 market or v4 spoke; Aave&apos;s own total sits beside our sum of the reserves, and a yellow figure is a gap above 2%. Every market opens to its reserves.</>} />
      {d.reconciliation ? (
        <p className="px-4 text-sm text-muted-foreground lg:px-6"><b className="font-medium text-foreground">Reconciliation.</b> Our sum of the reserves is {usd(d.reconciliation.ours)}; {d.reconciliation.theirsSource} reports {usd(d.reconciliation.theirs)}. {d.reconciliation.note}</p>
      ) : null}
    </>
  );
}
