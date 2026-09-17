import { PageHeader } from '@/components/page-header';
import { MarketsTable } from '@/components/aave-tables';
import { BarChart } from '@/components/charts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { loadAave } from '@/lib/data';
import { count, pct, usd } from '@/lib/format';

export const revalidate = 300;
export const metadata = { title: 'Markets' };

export default async function Markets() {
  const d = await loadAave();
  const high = d.markets.filter((m) => m.risk === 'high');
  const gaps = d.markets.filter((m) => m.apiSize != null && Math.abs(m.apiSize / (m.supplied || 1) - 1) > 0.02);
  const compare = d.markets.slice(0, 10).map((m) => ({ name: m.label, ours: m.supplied, aave: m.apiSize ?? 0 }));
  return (
    <>
      <PageHeader eyebrow="Markets" question="Which markets carry the book, and do our sums agree with Aave's?"
        answer={<>{count(d.markets.length)} markets and spokes as of {d.asOf}, aggregate utilisation {pct(d.kpis.utilization, 1)}. {high.length === 0 ? 'No market is above 85% utilisation, the line where withdrawals start to queue.' : `${count(high.length)} ${high.length === 1 ? 'market is' : 'markets are'} above 85% utilisation, where withdrawals start to queue.`} {gaps.length === 0 ? 'Every market\'s Aave API total is within 2% of our sum of its reserves.' : `${count(gaps.length)} ${gaps.length === 1 ? 'market differs' : 'markets differ'} from Aave's own total by more than 2%; the table marks them.`}</>} />
      <div className="px-4 lg:px-6">
        <Card>
          <CardHeader><CardTitle>Our sum beside Aave&apos;s total, ten largest markets</CardTitle><CardDescription>Two bars per market: our sum of its reserves and Aave&apos;s own totalMarketSize. The first-party reconciliation; a visible gap points at a reserve priced differently.</CardDescription></CardHeader>
          <CardContent className="px-2"><BarChart data={compare} x="name" series={[{ key: 'ours', label: 'Our sum' }, { key: 'aave', label: 'Aave API' }]} unit="usd" height={280} legend /></CardContent>
        </Card>
      </div>
      <MarketsTable data={d.markets} title="All markets and spokes" pageSize={20}
        caption={<><b className="font-medium text-foreground">Per-market risk.</b> Utilisation above 85% means suppliers may wait to withdraw; the weighted rates are what the market pays and charges on average. Open a market for its reserves.</>} />
    </>
  );
}
