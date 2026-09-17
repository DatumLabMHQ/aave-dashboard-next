'use client';
// Markets, reserves and chains on the kit's DataTable. Dashboard file: the columns belong to this product.
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { AssetAvatar } from '@/components/asset-avatar';
import { DataTable, defineColumns, SortHeader } from '@/components/data-table';
import { count, pct, usd } from '@/lib/format';
import type { ChainRow, Market, Reserve } from '@/lib/aave-types';

type Caption = React.ReactNode;
const riskClass = (u: number) => (u > 85 ? 'text-(--red)' : u > 70 ? 'text-(--yellow)' : 'text-(--green)');
const NA = <span className="text-muted-foreground">n/a</span>;
const Chain = ({ chain, logo }: { chain: string; logo?: string }) => <span className="inline-flex items-center gap-1.5 text-muted-foreground"><AssetAvatar symbol={chain} src={logo} className="size-4" />{chain}</span>;
const Util = ({ value }: { value: number }) => <Badge variant="outline" className={`px-1.5 tabular-nums ${riskClass(value)}`}><span className="size-1.5 rounded-full bg-current" />{pct(value, 1)}</Badge>;

const marketColumns = defineColumns<Market>((col) => [
  col.accessor('label', { header: 'Market', enableHiding: false, cell: ({ row }) => (
    <Link href={`/markets/${row.original.id}`} className="flex items-center gap-2.5 outline-none focus-visible:underline"><AssetAvatar symbol={row.original.chain} src={row.original.logo} /><span className="leading-tight"><span className="block font-medium">{row.original.label}</span><span className="block text-xs text-muted-foreground">{count(row.original.reserves)} reserves</span></span></Link>) }),
  col.accessor('version', { header: 'Version', cell: ({ row }) => <Badge variant={row.original.version === 'v4' ? 'secondary' : 'outline'} className="px-1.5">{row.original.version === 'v4' ? 'v4 spoke' : 'v3'}</Badge> }),
  col.accessor('chain', { header: 'Chain', cell: ({ row }) => <Chain chain={row.original.chain} logo={row.original.logo} /> }),
  col.accessor('supplied', { header: ({ column }) => <SortHeader column={column} label="Supplied" />, cell: ({ row }) => <span className="tabular-nums">{usd(row.original.supplied)}</span> }),
  col.accessor('borrowed', { header: ({ column }) => <SortHeader column={column} label="Borrowed" />, cell: ({ row }) => <span className="tabular-nums">{usd(row.original.borrowed)}</span> }),
  col.accessor('utilization', { header: ({ column }) => <SortHeader column={column} label="Utilisation" />, cell: ({ row }) => <Util value={row.original.utilization} /> }),
  col.accessor('supplyApy', { header: ({ column }) => <SortHeader column={column} label="Supply APY" />, cell: ({ row }) => <span className="tabular-nums">{pct(row.original.supplyApy)}</span> }),
  col.accessor('borrowApy', { header: ({ column }) => <SortHeader column={column} label="Borrow APY" />, cell: ({ row }) => <span className="tabular-nums">{pct(row.original.borrowApy)}</span> }),
  col.accessor('apiSize', { header: 'Aave API total', cell: ({ row }) => (row.original.apiSize == null ? NA : <span className={`tabular-nums ${Math.abs(row.original.apiSize / (row.original.supplied || 1) - 1) > 0.02 ? 'text-(--yellow)' : 'text-muted-foreground'}`}>{usd(row.original.apiSize)}</span>) }),
]);
export function MarketsTable({ data, title, caption, pageSize = 12 }: { data: Market[]; title: string; caption: Caption; pageSize?: number }) {
  return <DataTable<Market> rows={data} columns={marketColumns} title={title} caption={caption} getRowId={(m) => m.id} rowHref={(m) => `/markets/${m.id}`}
    search={(m, q) => `${m.label} ${m.chain} ${m.version}`.toLowerCase().includes(q)} searchPlaceholder="Filter markets"
    numeric={['supplied', 'borrowed', 'utilization', 'supplyApy', 'borrowApy', 'apiSize']} labels={{ label: 'Market', version: 'Version', chain: 'Chain', supplied: 'Supplied', borrowed: 'Borrowed', utilization: 'Utilisation', supplyApy: 'Supply APY', borrowApy: 'Borrow APY', apiSize: 'Aave API total' }}
    initialSort={[{ id: 'supplied', desc: true }]} pageSize={pageSize} noun="market" empty="No markets match." />;
}

const reserveColumns = defineColumns<Reserve>((col) => [
  col.accessor('symbol', { header: 'Reserve', enableHiding: false, cell: ({ row }) => (
    <Link href={`/reserves/${row.original.id}`} className="flex items-center gap-2.5 outline-none focus-visible:underline"><AssetAvatar symbol={row.original.symbol} /><span className="leading-tight"><span className="block font-medium">{row.original.symbol}</span><span className="block text-xs text-muted-foreground">{row.original.marketLabel} · {row.original.version}</span></span></Link>) }),
  col.accessor('chain', { header: 'Chain', cell: ({ row }) => <Chain chain={row.original.chain} logo={row.original.logo} /> }),
  col.accessor('supplied', { header: ({ column }) => <SortHeader column={column} label="Supplied" />, cell: ({ row }) => <span className="tabular-nums">{usd(row.original.supplied)}</span> }),
  col.accessor('borrowed', { header: ({ column }) => <SortHeader column={column} label="Borrowed" />, cell: ({ row }) => <span className="tabular-nums">{usd(row.original.borrowed)}</span> }),
  col.accessor('utilization', { header: ({ column }) => <SortHeader column={column} label="Utilisation" />, cell: ({ row }) => <Util value={row.original.utilization} /> }),
  col.accessor('supplyApy', { header: ({ column }) => <SortHeader column={column} label="Supply APY" />, cell: ({ row }) => <span className="tabular-nums">{pct(row.original.supplyApy)}</span> }),
  col.accessor('borrowApy', { header: ({ column }) => <SortHeader column={column} label="Borrow APY" />, cell: ({ row }) => <span className="tabular-nums">{pct(row.original.borrowApy)}</span> }),
  col.accessor('liqThreshold', { header: 'Liq. threshold', cell: ({ row }) => <span className="tabular-nums text-muted-foreground">{row.original.liqThreshold ? pct(row.original.liqThreshold, 0) : NA}</span> }),
]);
export function ReservesTable({ data, title, caption, pageSize = 15 }: { data: Reserve[]; title: string; caption: Caption; pageSize?: number }) {
  return <DataTable<Reserve> rows={data} columns={reserveColumns} title={title} caption={caption} getRowId={(r) => r.id} rowHref={(r) => `/reserves/${r.id}`}
    search={(r, q) => `${r.symbol} ${r.marketLabel} ${r.chain} ${r.version}`.toLowerCase().includes(q)} searchPlaceholder="Filter reserves"
    numeric={['supplied', 'borrowed', 'utilization', 'supplyApy', 'borrowApy', 'liqThreshold']} labels={{ symbol: 'Reserve', chain: 'Chain', supplied: 'Supplied', borrowed: 'Borrowed', utilization: 'Utilisation', supplyApy: 'Supply APY', borrowApy: 'Borrow APY', liqThreshold: 'Liq. threshold' }}
    initialSort={[{ id: 'supplied', desc: true }]} pageSize={pageSize} noun="reserve" empty="No reserves match." />;
}

const chainColumns = defineColumns<ChainRow>((col) => [
  col.accessor('chain', { header: 'Chain', enableHiding: false, cell: ({ row }) => <span className="flex items-center gap-2.5"><AssetAvatar symbol={row.original.chain} src={row.original.logo} /><span className="font-medium">{row.original.chain}</span></span> }),
  col.accessor('version', { header: 'Version', cell: ({ row }) => <Badge variant="outline" className="px-1.5 text-muted-foreground">{row.original.version}</Badge> }),
  col.accessor('tvlNet', { header: ({ column }) => <SortHeader column={column} label="Net TVL" />, cell: ({ row }) => <span className="tabular-nums">{usd(row.original.tvlNet)}</span> }),
  col.accessor('borrowed', { header: ({ column }) => <SortHeader column={column} label="Borrowed" />, cell: ({ row }) => <span className="tabular-nums">{usd(row.original.borrowed)}</span> }),
  col.accessor('tvlGross', { header: 'Gross TVL', cell: ({ row }) => <span className="tabular-nums text-muted-foreground">{usd(row.original.tvlGross)}</span> }),
]);
export function ChainsTable({ data, title, caption, pageSize = 15 }: { data: ChainRow[]; title: string; caption: Caption; pageSize?: number }) {
  return <DataTable<ChainRow> rows={data} columns={chainColumns} title={title} caption={caption} getRowId={(c) => c.id}
    search={(c, q) => `${c.chain} ${c.version}`.toLowerCase().includes(q)} searchPlaceholder="Filter chains"
    numeric={['tvlNet', 'borrowed', 'tvlGross']} labels={{ chain: 'Chain', version: 'Version', tvlNet: 'Net TVL', borrowed: 'Borrowed', tvlGross: 'Gross TVL' }}
    initialSort={[{ id: 'tvlNet', desc: true }]} pageSize={pageSize} noun="chain" empty="No chains match." />;
}
