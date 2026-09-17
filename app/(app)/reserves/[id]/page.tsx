import { notFound } from 'next/navigation';
import { loadReserve } from '@/lib/data';
import { pct, usd } from '@/lib/format';
import { Badge } from '@/components/ui/badge';
import { PageBreadcrumb } from '@/components/page-breadcrumb';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AssetAvatar } from '@/components/asset-avatar';
import { RadialChart } from '@/components/charts';
import { DetailCharts } from '@/components/detail-charts';
import { MarketDetailLayout } from '@/components/market-detail-layout';
import { MarketFacts } from '@/components/market-facts';

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const d = await loadReserve(id);
  return { title: d ? `${d.reserve.symbol} in ${d.reserve.marketLabel}` : 'Reserve' };
}

const RISK_CLASS = { safe: 'text-(--green)', moderate: 'text-(--yellow)', high: 'text-(--red)' } as const;

export default async function ReservePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const d = await loadReserve(id);
  if (!d) notFound();
  const r = d.reserve;
  const stat = (label: string, value: string, sub: string) => (
    <Card className="@container/card"><CardHeader><CardDescription>{label}</CardDescription><CardTitle className="text-2xl font-medium tracking-tight tabular-nums">{value}</CardTitle><CardDescription>{sub}</CardDescription></CardHeader></Card>
  );
  return (
    <>
      <div className="flex flex-col gap-3 px-4 lg:px-6">
        <PageBreadcrumb items={[{ label: 'Reserves', href: '/reserves' }, { label: r.marketLabel, href: `/markets/${r.marketId}` }, { label: r.symbol }]} />
        <div className="flex flex-wrap items-center gap-3">
          <AssetAvatar symbol={r.symbol} className="size-9" />
          <div>
            <h1 className="font-serif text-[1.75rem] font-medium leading-tight tracking-tight">{r.symbol} <span className="text-muted-foreground">in {r.marketLabel}</span></h1>
            <p className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5"><AssetAvatar symbol={r.chain} src={r.logo} className="size-4" />{r.chain}</span><span>·</span><span>Aave {r.version}</span>
              <Badge variant="outline" className={RISK_CLASS[r.risk]}><span className="size-1.5 rounded-full bg-current" />{pct(r.utilization, 1)} utilised</Badge>
            </p>
          </div>
        </div>
        <p className="max-w-[72ch] text-sm text-muted-foreground">
          {usd(r.supplied)} supplied, {usd(r.borrowed)} borrowed, {usd(r.available)} available. {r.risk === 'high' ? 'Utilisation is above 85%, so withdrawals may queue and rates are climbing.' : r.risk === 'moderate' ? 'Utilisation is in the healthy band: demand without a withdrawal queue.' : 'Plenty of idle liquidity, so rates are soft.'} As of {d.asOf}.
        </p>
      </div>
      <MarketDetailLayout
        main={<>
          <div className="grid grid-cols-2 gap-4 @2xl/main:grid-cols-4">
            {stat('Supplied', usd(r.supplied), 'in this reserve')}
            {stat('Borrowed', usd(r.borrowed), `${pct(r.utilization, 1)} of supply`)}
            {stat('Supply APY', pct(r.supplyApy), 'annualised')}
            {stat('Borrow APY', pct(r.borrowApy), 'annualised')}
          </div>
          <DetailCharts asOf={d.asOf} history={d.history} historySeries={[{ key: 'supplied', label: 'Supplied' }, { key: 'borrowed', label: 'Borrowed' }]}
            historyTitle="Supplied and borrowed" historyDescription="The reserve's own book. Borrowed climbing towards supplied is utilisation rising, and rates with it."
            rates={d.rates} ratesSeries={[{ key: 'supply_apy', label: 'Supply APY' }, { key: 'borrow_apy', label: 'Borrow APY' }, { key: 'utilization', label: 'Utilisation' }]}
            ratesTitle="Rates and utilisation" ratesDescription="What suppliers earn, what borrowers pay, and the utilisation that drives both. Above 85% withdrawals start to queue." />
        </>}
        aside={<>
          <Card>
            <CardHeader><CardTitle>Utilisation</CardTitle><CardDescription>Against the 85% line where withdrawals start to queue.</CardDescription></CardHeader>
            <CardContent><RadialChart value={r.utilization} label="utilised" height={180} color={r.risk === 'high' ? 'var(--red)' : r.risk === 'moderate' ? 'var(--yellow)' : 'var(--chart-1)'} /></CardContent>
          </Card>
          <MarketFacts facts={d.facts} />
        </>}
      />
    </>
  );
}
