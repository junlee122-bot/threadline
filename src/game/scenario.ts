import type { IncidentDecision, SimulationModifiers } from '../types'

export const TOTAL_SECONDS = 8 * 60

/**
 * Modifier values are cumulative intervention strength. Positive values help the
 * system; for `load`, positive means load relief/backpressure rather than demand.
 */
export const INITIAL_MODIFIERS: SimulationModifiers = {
  stability: 0,
  load: 0,
  cache: 0,
  database: 0,
  observability: 0,
  revenue: 0,
}

/**
 * FAULTLINE incident 047
 *
 * The apparent correlation with release 24.7.13 is deliberate misdirection.
 * The actual causal chain is an expired hot-key cohort -> cache stampede ->
 * database connection-pool exhaustion -> checkout cascade.
 */
export const INCIDENT_DECISIONS: IncidentDecision[] = [
  {
    id: 'first-signal',
    triggerAt: 45,
    index: '01 / 06',
    title: 'A suspicious coincidence',
    situation:
      'Checkout p95 rose four minutes after release 24.7.13. Cache misses are climbing too, but the deploy touched no cache code.',
    signal: 'Release correlation: 0.61 · cache-miss correlation: 0.93',
    choices: [
      {
        id: 'trace-correlation',
        label: 'Trace the dependency chain',
        command: 'trace --from checkout --through cache,db --freeze-deploys',
        description:
          'Freeze new changes and correlate cache misses with database saturation before mutating production.',
        rationale:
          'The trace exposes the cache-to-database causal edge and preserves the response window.',
        verdict: 'optimal',
        scoreDelta: 12,
        effects: {
          stability: 3,
          load: 4,
          cache: 8,
          database: 6,
          observability: 18,
          revenue: 2,
        },
      },
      {
        id: 'rollback-release',
        label: 'Rollback the release',
        command: 'deploy rollback release-24.7.13 --global',
        description:
          'Treat temporal correlation as causation and spend the next deployment window reverting.',
        rationale:
          'The release is a red herring. Rollback adds churn while the cache stampede keeps opening database connections.',
        verdict: 'dangerous',
        scoreDelta: -10,
        effects: {
          stability: -5,
          load: -2,
          cache: 0,
          database: -3,
          observability: -6,
          revenue: -7,
        },
      },
      {
        id: 'scale-api',
        label: 'Double API capacity',
        command: 'scale api-gateway --replicas 2x',
        description:
          'Add stateless capacity to absorb the latency spike while investigation continues.',
        rationale:
          'More workers briefly hide queueing, but they also create more concurrent calls to the constrained database.',
        verdict: 'mixed',
        scoreDelta: 1,
        effects: {
          stability: 3,
          load: -4,
          cache: 0,
          database: -8,
          observability: 2,
          revenue: 1,
        },
      },
    ],
  },
  {
    id: 'cache-stampede',
    triggerAt: 110,
    index: '02 / 06',
    title: 'The herd arrives',
    situation:
      'A synchronized TTL cohort expired across 38 hot product keys. Thousands of workers are rebuilding identical values.',
    signal: 'Hit rate 96% → 34% · origin reads +1,840%',
    choices: [
      {
        id: 'single-flight',
        label: 'Coalesce cache fills',
        command: 'cache singleflight enable --keys hotset --stale-while-revalidate',
        description:
          'Serve stale values and allow only one origin request to rebuild each hot key.',
        rationale:
          'Request coalescing breaks the stampede at its source and immediately relieves the database.',
        verdict: 'optimal',
        scoreDelta: 15,
        effects: {
          stability: 9,
          load: 10,
          cache: 30,
          database: 12,
          observability: 4,
          revenue: 10,
        },
      },
      {
        id: 'flush-cache',
        label: 'Flush the entire cache',
        command: 'cache flush --all --force',
        description:
          'Remove suspect entries and let every node rebuild from the source of truth.',
        rationale:
          'A global flush turns a partial stampede into a guaranteed one and multiplies origin reads.',
        verdict: 'dangerous',
        scoreDelta: -18,
        effects: {
          stability: -12,
          load: -14,
          cache: -35,
          database: -24,
          observability: -2,
          revenue: -14,
        },
      },
      {
        id: 'add-workers',
        label: 'Add checkout workers',
        command: 'scale checkout-workers --replicas +120',
        description:
          'Increase consumer concurrency to drain the visible queue.',
        rationale:
          'The queue drains briefly, but additional consumers amplify pressure on the same downstream bottleneck.',
        verdict: 'mixed',
        scoreDelta: -3,
        effects: {
          stability: 3,
          load: -8,
          cache: 2,
          database: -12,
          observability: 1,
          revenue: 2,
        },
      },
    ],
  },
  {
    id: 'pool-exhaustion',
    triggerAt: 175,
    index: '03 / 06',
    title: 'Connections at the redline',
    situation:
      'The primary has capacity for 1,800 connections. Active sessions have crossed 1,620 and lock wait time is accelerating.',
    signal: 'Pool utilization 91% · lock waits +730% · CPU only 58%',
    choices: [
      {
        id: 'backpressure',
        label: 'Gate concurrency',
        command: 'gateway shed --class noncritical --db-concurrency 720',
        description:
          'Apply backpressure, preserve payment writes, and reject low-value fan-out before it reaches the pool.',
        rationale:
          'Concurrency limits stop connection amplification while protecting the revenue-critical path.',
        verdict: 'optimal',
        scoreDelta: 14,
        effects: {
          stability: 12,
          load: 25,
          cache: 0,
          database: 28,
          observability: 2,
          revenue: 0,
        },
      },
      {
        id: 'raise-pool-limit',
        label: 'Raise the pool ceiling',
        command: 'db pool set --max 3200',
        description:
          'Allow every waiting worker to open a database connection.',
        rationale:
          'The database is waiting on locks, not CPU. More sessions deepen contention and push the primary into collapse.',
        verdict: 'dangerous',
        scoreDelta: -16,
        effects: {
          stability: -18,
          load: -10,
          cache: -4,
          database: -32,
          observability: -5,
          revenue: -12,
        },
      },
      {
        id: 'kill-long-queries',
        label: 'Terminate long queries',
        command: 'db terminate --older-than 15s --exclude payments',
        description:
          'Free a subset of occupied sessions without changing admission control.',
        rationale:
          'This buys time, but new stampede reads will refill every connection until upstream pressure is gated.',
        verdict: 'mixed',
        scoreDelta: 4,
        effects: {
          stability: 5,
          load: 2,
          cache: 0,
          database: 11,
          observability: 4,
          revenue: 0,
        },
      },
    ],
  },
  {
    id: 'blast-radius',
    triggerAt: 250,
    index: '04 / 06',
    title: 'Choose what survives',
    situation:
      'Search, recommendations, and order history now compete with payments for the same constrained dependencies.',
    signal: '$612 lost / sec · 86,000 active checkout sessions',
    choices: [
      {
        id: 'degraded-checkout',
        label: 'Enter graceful degradation',
        command: 'features disable recs,history --preserve checkout,payments',
        description:
          'Remove nonessential reads and keep a minimal checkout path online.',
        rationale:
          'A smaller product surface sharply reduces fan-out while preserving the transaction path customers need.',
        verdict: 'optimal',
        scoreDelta: 11,
        effects: {
          stability: 14,
          load: 18,
          cache: 3,
          database: 10,
          observability: 1,
          revenue: 14,
        },
      },
      {
        id: 'global-failover',
        label: 'Fail over the whole region',
        command: 'traffic failover us-east eu-west --all',
        description:
          'Move all traffic to a warm region that still shares the global catalog primary.',
        rationale:
          'The bottleneck follows the workload because the destination still depends on the saturated global database.',
        verdict: 'dangerous',
        scoreDelta: -9,
        effects: {
          stability: -10,
          load: -20,
          cache: 0,
          database: -14,
          observability: 1,
          revenue: -10,
        },
      },
      {
        id: 'payments-only',
        label: 'Queue new orders',
        command: 'checkout mode queue --confirm-asynchronously',
        description:
          'Accept carts into a durable queue and process payment confirmation asynchronously.',
        rationale:
          'Queueing protects intent and reduces synchronous load, though confirmation latency costs some conversion.',
        verdict: 'mixed',
        scoreDelta: 5,
        effects: {
          stability: 9,
          load: 13,
          cache: 0,
          database: 7,
          observability: 2,
          revenue: -3,
        },
      },
    ],
  },
  {
    id: 'recovery-window',
    triggerAt: 330,
    index: '05 / 06',
    title: 'Recovery can trigger a second wave',
    situation:
      'The pool is draining. Millions of invalid or expired keys remain, and a careless recovery will recreate the herd.',
    signal: 'Connection slope −42/min · cold-key population 2.8M',
    choices: [
      {
        id: 'progressive-warm',
        label: 'Warm the cache progressively',
        command: 'cache warm --rate 2pct/min --jitter-ttl 35pct --canary 5pct',
        description:
          'Canary hot keys, jitter expirations, and expand only while connection pressure falls.',
        rationale:
          'A staggered warm-up prevents synchronized expiry and converts recovery into a controlled slope.',
        verdict: 'optimal',
        scoreDelta: 15,
        effects: {
          stability: 14,
          load: 8,
          cache: 28,
          database: 16,
          observability: 3,
          revenue: 4,
        },
      },
      {
        id: 'invalidate-again',
        label: 'Invalidate and rebuild cleanly',
        command: 'cache invalidate --namespace catalog --rebuild-now',
        description:
          'Discard the remaining cache population and perform one clean rebuild.',
        rationale:
          'The second invalidation synchronizes the entire cold population and launches another origin-read wave.',
        verdict: 'dangerous',
        scoreDelta: -18,
        effects: {
          stability: -16,
          load: -12,
          cache: -30,
          database: -20,
          observability: -2,
          revenue: -14,
        },
      },
      {
        id: 'hold-forty-percent',
        label: 'Hold traffic at 40%',
        command: 'gateway cap --traffic 40pct --until manual',
        description:
          'Keep the system stable at a low ceiling without repairing cache behavior yet.',
        rationale:
          'The platform stabilizes, but the unresolved cache pattern and lost demand prevent a full recovery.',
        verdict: 'mixed',
        scoreDelta: 2,
        effects: {
          stability: 8,
          load: 12,
          cache: 2,
          database: 9,
          observability: 1,
          revenue: -8,
        },
      },
    ],
  },
  {
    id: 'restore-service',
    triggerAt: 410,
    index: '06 / 06',
    title: 'The last gate',
    situation:
      'Customer traffic is waiting behind the gates. Metrics are green, but only under reduced concurrency.',
    signal: 'p95 612ms · pool 43% · queued sessions 118,000',
    choices: [
      {
        id: 'slo-gated-release',
        label: 'Reopen against live SLOs',
        command: 'gateway ramp --step 10pct --guard p95<800,pool<70',
        description:
          'Increase traffic in measured steps and automatically stop if saturation returns.',
        rationale:
          'SLO gates recover revenue while keeping the restored cache and database inside safe limits.',
        verdict: 'optimal',
        scoreDelta: 14,
        effects: {
          stability: 16,
          load: 10,
          cache: 8,
          database: 14,
          observability: 2,
          revenue: 8,
        },
      },
      {
        id: 'open-floodgates',
        label: 'Reopen all traffic now',
        command: 'gateway cap --remove --all-regions',
        description:
          'Recover conversion immediately by releasing every waiting session.',
        rationale:
          'The synchronized surge recreates connection pressure before the cache population is fully healthy.',
        verdict: 'dangerous',
        scoreDelta: -17,
        effects: {
          stability: -18,
          load: -25,
          cache: -8,
          database: -20,
          observability: 0,
          revenue: 8,
        },
      },
      {
        id: 'stay-degraded',
        label: 'Stay degraded until morning',
        command: 'incident hold --mode degraded --ttl 8h',
        description:
          'Protect stability by leaving gates and nonessential features disabled.',
        rationale:
          'Safe but costly: the incident is contained without restoring normal customer experience or revenue.',
        verdict: 'mixed',
        scoreDelta: 3,
        effects: {
          stability: 9,
          load: 15,
          cache: 4,
          database: 10,
          observability: 1,
          revenue: -18,
        },
      },
    ],
  },
]
