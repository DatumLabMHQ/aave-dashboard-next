import { notFound } from 'next/navigation';
import { loadMarket } from '@/lib/data';
import { count, pct, usd } from '@/lib/format';
import { Badge } from '@/components/ui/badge';
import { PageBreadcrumb } from '@/components/page-breadcrumb';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AssetAvatar } from '@/components/asset-avatar';
import { DonutChart, RadialChart } from '@/components/charts';
import { DetailCharts } from '@/components/detail-charts';
import { MarketDetailLayout } from '@/components/market-detail-layout';
import { MarketFacts } from '@/components/market-facts';
import { ReservesTable } from '@/components/aave-tables';

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const d = await loadMarket(id);
  return { title: d ? `${d.market.label} (${d.market.version})` : 'Market' };
}

const RISK_CLASS = { safe: 'text-(--green)', moderate: 'text-(--yellow)', high: 'text-(--red)' } as const;

export default async function MarketPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const d = await loadMarket(id);
  if (!d) notFound();
  const m = d.market;
  const stat = (label: string, value: string, sub: string) => (
    <Card className="@container/card"><CardHeader><CardDescription>{label}</CardDescription><CardTitle className="text-2xl font-medium tracking-tight tabular-nums">{value}</CardTitle><CardDescription>{sub}</CardDescription></CardHeader></Card>
  );
  const byReserve = d.reserves.slice(0, 8).map((r) => ({ name: r.symbol, value: r.supplied }));
  return (
    <>
      <div className="flex flex-col gap-3 px-4 lg:px-6">
        <PageBreadcrumb items={[{ label: 'Markets', href: '/markets' }, { label: m.label }]} />
        <div className="flex flex-wrap items-center gap-3">
          <AssetAvatar symbol={m.chain} src={m.logo} className="size-9" />
          <div>
            <h1 className="font-serif text-[1.75rem] font-medium leading-tight tracking-tight">{m.label}</h1>
            <p className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span>{m.version === 'v4' ? 'Aave v4 spoke' : 'Aave v3 market'}</span><span>·</span><span>{m.chain}</span><span>·</span><span>{count(m.reserves)} reserves</span>
              <Badge variant="outline" className={RISK_CLASS[m.risk]}><span className="size-1.5 rounded-full bg-current" />{pct(m.utilization, 1)} utilised</Badge>
            </p>
          </div>
        </div>
        <p className="max-w-[72ch] text-sm text-muted-foreground">
          {usd(m.supplied)} supplied, {usd(m.borrowed)} borrowed, {usd(m.supplied - m.borrowed)} idle. {m.apiSize != null ? `Aave's own total for this market is ${usd(m.apiSize)}, ${Math.abs(m.apiSize / (m.supplied || 1) - 1) * 100 < 1 ? 'within 1% of our sum' : `${pct(Math.abs(m.apiSize / (m.supplied || 1) - 1) * 100, 1)} from our sum`}.` : ''} As of {d.asOf}.
        </p>
      </div>
      <MarketDetailLayout
        main={<>
          <div className="grid grid-cols-2 gap-4 @2xl/main:grid-cols-4">
            {stat('Supplied', usd(m.supplied), 'sum of the reserves')}
            {stat('Borrowed', usd(m.borrowed), `${pct(m.utilization, 1)} of supply`)}
            {stat('Supply APY, weighted', pct(m.supplyApy), 'by supplied value')}
            {stat('Borrow APY, weighted', pct(m.borrowApy), 'by borrowed value')}
          </div>
          <DetailCharts asOf={d.asOf} history={d.history} historySeries={[{ key: 'supply', label: 'Supplied' }, { key: 'borrow', label: 'Borrowed' }]}
            historyTitle="Supplied and borrowed" historyDescription="The market's own book, summed over its reserves. Borrowed climbing towards supplied is utilisation rising, and rates with it."
            rates={d.rates} ratesSeries={[{ key: 'supply_apy', label: 'Supply APY' }, { key: 'borrow_apy', label: 'Borrow APY' }]} ratesTitle="Weighted rates" ratesDescription="What suppliers earn and borrowers pay on average across the market, weighted by value." />
          <ReservesTable data={d.reserves} title="Reserves in this market" pageSize={12}
            caption={<><b className="font-medium text-foreground">Every asset this market lends.</b> Utilisation and rates are per reserve; the liquidation threshold is where a borrower against that asset is liquidated.</>} />
        </>}
        aside={<>
          <Card>
            <CardHeader><CardTitle>Utilisation</CardTitle><CardDescription>Against the 85% line where withdrawals start to queue.</CardDescription></CardHeader>
            <CardContent><RadialChart value={m.utilization} label="utilised" height={180} color={m.risk === 'high' ? 'var(--red)' : m.risk === 'moderate' ? 'var(--yellow)' : 'var(--chart-1)'} /></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Supplied by reserve</CardTitle><CardDescription>The eight largest. One asset carrying half the market is the concentration to know about.</CardDescription></CardHeader>
            <CardContent><DonutChart items={byReserve} unit="usd" height={200} centerLabel="supplied" /></CardContent>
          </Card>
          <MarketFacts facts={d.facts} />
        </>}
      />
    </>
  );
}
