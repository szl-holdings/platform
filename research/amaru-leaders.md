# Leaders in the Amaru Field — Research Brief

  > Source: live web search, 2026-05-01.
  > Goal: distill architectural patterns worth stealing for Amaru/Conduit
  > (data integration / sync), then "make it our own" via A11oy governance.

  ---

  ## Landscape

  | Player | Class | Open source? | Standout pattern |
  |---|---|---|---|
  | **Airbyte** | ELT (extract-load-transform) | yes (airbytehq/airbyte) | Modular connector spec, Connector Builder, CDK in Python; 350+ connectors |
  | **Fivetran** | Managed ELT | no | Log-based binary CDC, automated schema evolution, drift handling |
  | **Singer** | Open spec | yes (singer-io) | Tap/target stdin/stdout JSON-line protocol — universal contract |
  | **Hightouch** | Reverse ETL | partial | Sync warehouse → SaaS tools; sync diffing, change-tracking |
  | **dbt** | Transformation + semantic | partial | Semantic layer (MetricFlow), governed metric definitions |
  | **Meltano** | OSS ELT runner | yes (meltano/meltano) | Orchestrates Singer taps/targets, project-as-code |
  | **Estuary Flow** | Streaming CDC | partial | Materialized views over change streams, exactly-once semantics |

  ---

  ## Patterns worth stealing

  ### 1. Singer-style tap/target spec (from Singer + Meltano)
  - A connector is a process that reads stdin (config + state) and writes
    newline-delimited JSON messages of three types: `SCHEMA`, `RECORD`, `STATE`.
  - This is dead simple, language-agnostic, and lets us *governed*-wrap any
    third-party tap behind A11oy without forking it.
  - **Take it**: define an Amaru "tap contract" v1 that mirrors Singer's
    message types but adds a fourth: `PROOF` — every batch emits a proof
    envelope (signal hashes, source class, retention class) into proof_chain.

  ### 2. Log-based CDC over polling (from Fivetran)
  - Fivetran's edge is binary log readers (MySQL binlog, Postgres WAL,
    SQL Server CT/CDC) — no schema-killing full table reads.
  - For a tenant-scoped Amaru we don't need their scale, but we DO want
    the WAL pattern for any Postgres source. Postgres logical decoding
    (pgoutput) is free and battle-tested.
  - **Take it**: ship a `postgres-wal` connector class as a first-class
    citizen, alongside a `http-poll` and `webhook` class.

  ### 3. Schema evolution as a first-class event (from Airbyte + Fivetran)
  - Both treat a destination column add/rename/widen as an audit event,
    not a silent migration. Fivetran's "schema drift" panel is the
    reference UX.
  - **Take it**: every Amaru sync emits `schema.evolved` events that
    feed the A11oy reflexivity signal mesh — schema drift is a *cognitive*
    signal, not just a data signal.

  ### 4. Reverse ETL diffing (from Hightouch)
  - Hightouch keeps a hash of the last-synced record per primary key and
    only sends deltas. Cuts API spend by 10x.
  - **Take it**: sync run rows already exist in our schema — add a
    `row_hash` column and gate destination writes on hash change.

  ### 5. Detection-as-code / sync-as-code (from dbt + Meltano)
  - Sync definitions live in version control, not a UI database. UI is a
    view on top.
  - **Take it**: every Amaru sync gets a YAML representation that round-
    trips through the API — UI edits emit YAML diffs to proof_chain.

  ### 6. Connector Builder (from Airbyte)
  - Low-code declarative connector spec lets non-engineers wire up new
    REST APIs without writing Python.
  - **Take it**: ship a "Conduit Builder" page that emits the same YAML
    contract as the hand-coded ones.

  ---

  ## Where we beat the field

  The leaders all share three weaknesses we can exploit:

  1. **No native proof chain.** None of them produce verifiable evidence
     of WHAT was synced, WHO approved it, and WHY. We do — proof_chain is
     already in our schema. A11oy-governed sync is genuinely novel.

  2. **No cognitive feedback loop.** Sync failures are dashboards; they
     don't feed an AI cognition system that can rewrite its own retry,
     batching, or routing strategy. With the Cognitive Reflexivity Engine,
     sync health emits `cognitive-reflexive` signals → Self-Model adapts.

  3. **No unified governance across sync + activate + audit.** Hightouch
     does reverse, Airbyte does forward, dbt does transform — nobody owns
     the full proof-bearing loop. Conduit + A11oy can.

  ---

  ## What we will build (Amaru track)

  1. Run the conduit_* migrations so the env actually has the tables
     (logs show `relation "conduit_syncs" does not exist`).
  2. Replace the simulated sync execution in `routes/conduit.ts` with
     a real run engine that:
     - resolves the tap spec
     - emits SCHEMA / RECORD / STATE / PROOF messages
     - writes to `conduit_sync_runs` + `conduit_sync_run_rows`
     - writes a proof envelope to `proof_chain`
     - emits a `cognitive-reflexive` signal (sync.success / sync.failed
       / sync.drift_detected) into the A11oy signal mesh.
  3. Wire two real built-in connector classes:
     - `http-poll` (REST API source, JSON path extraction)
     - `postgres-table` (full-table read with state column for incremental)
  4. Land an Amaru landing page in A11oy showing live sync health, drift
     events, and the cognitive-reflexive feedback loop in action.

  ---

  ## References (live URLs from search)

  - [Open Source Data Pipeline | Airbyte](https://airbyte.com/solutions/airbyte-open-source)
- [GitHub - airbytehq/airbyte: The leading data integration platform for ETL / ELT data pipelines from APIs, databases & files to data warehouses, data lakes & data lakehouses. Both self-hosted and Cloud-hosted. · GitHub](https://github.com/airbytehq/airbyte)
- [Airbyte 2.0 | Airbyte Docs](https://docs.airbyte.com/release_notes/v-2.0)
- [Change data capture (CDC): Tools, benefits, and best practices](https://www.fivetran.com/blog/change-data-capture-what-it-is-and-how-to-use-it)
- [10 Top CDC Tools and How To Choose the Right Platform](https://www.fivetran.com/learn/cdc-tools)
- [Optimize Log-Based Change Data Capture Performance](https://fivetran.com/docs/connectors/databases/troubleshooting/optimize-cdc-performance)
- [Singer | Open Source ETL](https://www.singer.io/)
- [GitHub - singer-io/getting-started: This repository is a getting started guide to Singer. · GitHub](https://github.com/singer-io/getting-started)
- [Singer.io — PipelineWise documentation](https://transferwise.github.io/pipelinewise/concept/singer.html)
- [Hightouch Reverse ETL | Sync data in minutes | Hightouch](https://hightouch.com/platform/reverse-etl)
- [What is Reverse ETL? The Definitive Guide | Hightouch](https://hightouch.com/blog/reverse-etl)
- [Hightouch: Reverse ETL Platform Explained - Startupik | Startup magazine](https://startupik.com/hightouch-reverse-etl-platform-explained/)
- [dbt Semantic Layer architecture | dbt Developer Hub](https://docs.getdbt.com/docs/use-dbt-semantic-layer/sl-architecture)
- [Understanding semantic layer architecture | dbt Labs](https://www.getdbt.com/blog/semantic-layer-architecture)
- [dbt Semantic Layer | dbt Developer Hub - dbt Labs](https://docs.getdbt.com/docs/use-dbt-semantic-layer/dbt-sl)
