// The only file most dashboards need to edit. Name the product, the platform resources the pages
// read, and the navigation. lib/aave.ts turns the three aave resources into the shapes the pages read;
// without DATUM_API_KEY the pages run on labelled sample data (lib/sample.ts).
export const config = {
  // 'draft' until `datum check <slug>` prints READY and the owner signs the brief; the page says so.
  status: 'draft' as 'draft' | 'live',
  slug: 'aave-dashboard-next',
  // The name this dashboard's brief, product note and reconciliation rows use in datum-context.
  context: 'aave-dashboard',
  title: 'State of Aave',
  description: 'Every Aave v3 reserve on twenty chains and every v4 spoke, per market and per reserve, with Aave\'s own totals beside ours, read hourly from the Datum data platform.',
  // The question the overview answers. Pages lead with it.
  question: 'Where does Aave stand today across its markets and chains, and is v4 taking share from v3?',
  product: { slug: 'aave', label: 'Aave', defillamaSlug: 'aave' },
  // Resources are product/name pairs from GET /api/v1/products on datum-api.
  resources: {
    markets: { product: 'aave', name: 'markets' },      // one row per version, chain, market and day; totals, weighted APYs, Aave's own totalMarketSize
    reserves: { product: 'aave', name: 'reserves' },    // one row per reserve per day; percent-as-number
    protocols: { product: 'aave', name: 'protocols' },  // DefiLlama net and gross TVL per chain for aave-v2, aave-v3, aave-v4
  },
  // How far back the overview trend goes (our own count, daily rows) and the DefiLlama context series.
  trend: { days: 90 },
  contextDays: 400,
  // The sign-in gate: the overview is open to everyone; every other page asks once for a name, an email
  // and an occupation (kept on that browser). Leads join the Datum Labs list through app/api/gate.
  gate: { enabled: true, free: ['/'] as string[] },
  nav: [
    { href: '/', label: 'Overview' },
    { href: '/markets', label: 'Markets' },
    { href: '/reserves', label: 'Reserves' },
    { href: '/chains', label: 'Chains' },
    { href: '/methodology', label: 'Methodology' },
  ],
  sources: [
    { name: 'Datum data platform: reserves and markets', role: 'headline' as 'headline' | 'comparison', cadence: 'hourly, daily grain', detail: 'Every Aave v3 reserve on twenty chains and every v4 reserve by spoke, read from Aave\'s API and the pool contracts: supply, borrow, rates, utilisation, liquidation threshold, price. Markets are the sums per version, chain and pool with size-weighted rates. Daily rows are the last snapshot of the UTC day; history from 4 September 2026.' },
    { name: 'Aave API totalMarketSize', role: 'comparison' as 'headline' | 'comparison', cadence: 'hourly', detail: 'Aave\'s own total for each market, stored beside our sum of its reserves. The first-party reconciliation: the two should agree to within a price feed.' },
    { name: 'DefiLlama', role: 'comparison' as 'headline' | 'comparison', cadence: 'daily', detail: 'Net and gross TVL per chain for aave-v2, aave-v3 and aave-v4, for the Chains page and the long view on the overview. Its TVL counts collateral; ours counts assets supplied.' },
  ],
  definitions: [
    { term: 'Supplied', unit: 'USD', text: 'Assets deposited in a reserve at the snapshot, at the platform price feed. A market\'s supplied is the sum of its reserves.' },
    { term: 'Borrowed', unit: 'USD', text: 'Debt outstanding against a reserve.' },
    { term: 'Utilisation', unit: '%', text: 'Borrowed divided by supplied, per reserve and per market. Above 85% withdrawals may queue.' },
    { term: 'Supply APY, borrow APY', unit: '% a year', text: 'The rates Aave reports at the snapshot. A market\'s rate is weighted by supplied (or borrowed) value.' },
    { term: 'Liquidation threshold', unit: '%', text: 'The debt to collateral ratio at which a position in that reserve can be liquidated.' },
    { term: 'Market, spoke', unit: 'label', text: 'A v3 market is one pool on one chain (Ethereum core, Ethereum Lido, Base...). A v4 spoke is one lending market attached to the v4 hub; the platform stores each spoke as its own market.' },
    { term: 'Aave API total', unit: 'USD', text: 'Aave\'s own totalMarketSize for a market, read from its API and stored beside our sum for reconciliation.' },
    { term: 'Net TVL, gross TVL', unit: 'USD', text: 'DefiLlama\'s figures per chain: gross counts collateral posted, net takes borrowed out.' },
  ],
};
export type DatumConfig = typeof config;
