# Integration Status Model

## Status Labels

| Status | Definition | User Expectation |
|--------|-----------|------------------|
| ✅ Live | Fully operational and tested | Can use immediately |
| 🔶 Beta | Working but may have edge cases | Use with awareness of limitations |
| 🗓️ Planned | On roadmap, not yet started | Check back or request updates |
| 🔒 Internal Only | Used by SZL team internally | Not available to customers |
| ❌ Deprecated | Being phased out | Migrate to replacement |

## Connector Readiness Checklist

Before an integration moves to "Live":
- [ ] Credentials secured in environment secrets
- [ ] Error handling implemented
- [ ] Rate limiting respected
- [ ] Health check endpoint functional
- [ ] Documentation complete
- [ ] Security review completed
- [ ] Owner assigned
- [ ] Monitoring in place
- [ ] Rollback plan documented
