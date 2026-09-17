import { PageHeader } from '@/components/page-header';
import { ChainsTable } from '@/components/aave-tables';
import { BarChart, DonutChart } from '@/components/charts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { loadAave } from '@/lib/data';
import { count, pct, usd } from '@/lib/format';

export const revalidate = 300;
export const metadata = { title: 'Chains' };

export default async function Chains() {
  const d = await loadAave();
  const cs = d.chains;
  const total = cs.reduce((a, c) => a + c.tvlNet, 0);
  const byChain = new Map<string, number>(); cs.forEach((c) => byChain.set(c.chain, (byChain.get(c.chain) ?? 0) + c.tvlNet));
  const chains = [...byChain.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  const byVersion = new Map<string, number>(); cs.forEach((c) => byVersion.set(`aave ${c.version}`, (byVersion.get(`aave ${c.version}`) ?? 0) + c.tvlNet));
  const versions = [...byVersion.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  const eth = byChain.get('Ethereum') ?? 0;
  return (
    <>
      <PageHeader eyebrow="Chains" question="Where is Aave's money by chain and version, in DefiLlama's count?"
        answer={<>By DefiLlama&apos;s count Aave holds {usd(total)} of net TVL across {count(chains.length)} chains as of {d.asOf}; Ethereum is {pct(total ? (eth / total) * 100 : 0, 0)} of it. {versions[0] ? `${versions[0].name} carries ${pct(total ? (versions[0].value / total) * 100 : 0, 0)}.` : ''} This page is DefiLlama&apos;s view; the Markets page is ours.</>} />
      <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @4xl/main:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Net TVL by chain</CardTitle><CardDescription>DefiLlama&apos;s net figure per chain, all versions together.</CardDescription></CardHeader>
          <CardContent><DonutChart items={chains.slice(0, 10)} unit="usd" height={240} centerLabel="net TVL" /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Net TVL by version</CardTitle><CardDescription>v2 is winding down, v3 is the book, v4 is the migration to watch.</CardDescription></CardHeader>
          <CardContent className="px-2"><BarChart data={versions} x="name" series={[{ key: 'value', label: 'Net TVL' }]} unit="usd" horizontal labels height={200} categoryWidth={90} /></CardContent>
        </Card>
      </div>
      <ChainsTable data={cs} title="Aave by chain and version"
        caption={<><b className="font-medium text-foreground">DefiLlama&apos;s view, one row per chain and version.</b> Gross TVL counts collateral posted; net takes borrowed out. Our own per-market sums are on the Markets page.</>} />
    </>
  );
}
