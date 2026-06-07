# Breaking Changes — SZL Holdings

## Current Breaking Changes
None in the current release cycle. All changes are additive and backward-compatible.

## How We Handle Breaking Changes
1. Breaking changes are announced in release notes at least 2 weeks before implementation
2. Deprecated features are marked in code and documentation
3. Migration guides are provided for any schema or API changes
4. Rollback plans are documented for every release

## API Versioning
Currently all APIs are at v1 (implicit). When breaking API changes are needed:
- New endpoints will be versioned (e.g., /api/v2/...)
- Old endpoints will be maintained for a deprecation period
- Migration documentation will be provided

## Schema Changes
Database schema changes follow these rules:
- Additive changes (new tables, new columns) are non-breaking
- Column type changes are avoided — new columns are added instead
- Table renames are avoided — aliases are used instead
- All schema changes are tracked via Drizzle ORM migrations
