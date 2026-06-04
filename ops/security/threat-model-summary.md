# Threat Model Summary

Generated: 2026-04-15

## System Boundaries

```
[Browser/Mobile] <--HTTPS--> [Replit Proxy] <--HTTP--> [Express API] <--TCP--> [PostgreSQL]
                                                         |
                                                         +--> [OpenAI/Anthropic/Gemini APIs]
                                                         +--> [Stripe API]
                                                         +--> [Email Services]
```

## Trust Boundaries

1. **Public Internet to Replit Proxy**: TLS termination, mTLS for preview
2. **Proxy to Application**: Internal network, path-based routing
3. **Application to Database**: Connection string with credentials
4. **Application to External APIs**: API keys in env vars

## Threat Categories (STRIDE)

### Spoofing
| Threat | Mitigation | Residual Risk |
|--------|-----------|---------------|
| Session hijacking | HttpOnly + Secure + SameSite cookies | Low |
| Token theft | Short-lived sessions (24h), refresh policy | Low |
| Internal token abuse | ALLOY_INTERNAL_TOKEN restricted to server-side | Medium — rotate regularly |

### Tampering
| Threat | Mitigation | Residual Risk |
|--------|-----------|---------------|
| Request body manipulation | Zod input validation | Low (on validated routes) |
| Database tampering | Org-scoped queries, RBAC | Low |
| Field encryption bypass | AES-256-GCM with auth tags | Low |

### Repudiation
| Threat | Mitigation | Residual Risk |
|--------|-----------|---------------|
| Action denial | Audit trail via activity logger | Low |
| Log tampering | Structured Pino logs with request IDs | Medium — no immutable log sink yet |

### Information Disclosure
| Threat | Mitigation | Residual Risk |
|--------|-----------|---------------|
| Error stack traces | Suppressed in production | Low |
| PII in logs | Logging policy, no sensitive data | Medium — needs automated enforcement |
| Client bundle secrets | VITE_ prefix audit (clean) | Low |
| Cross-org data leakage | callerOrgIds + inArray guards | Low |

### Denial of Service
| Threat | Mitigation | Residual Risk |
|--------|-----------|---------------|
| API flooding | Rate limiting (200/15m global) | Low |
| Auth brute force | 10/15m sliding limit on auth | Low |
| Large payload | 10MB body limit | Low |
| Slow queries | Need query timeout enforcement | Medium |

### Elevation of Privilege
| Threat | Mitigation | Residual Risk |
|--------|-----------|---------------|
| Role escalation | Server-side RBAC with hierarchy | Low |
| Internal token exposure | Env var only, not in client bundles | Low |
| SQL injection | Drizzle ORM parameterized queries | Low |

## High-Priority Residual Risks

1. **Internal token rotation**: ALLOY_INTERNAL_TOKEN is static — implement rotation
2. **Log immutability**: No tamper-proof log sink — consider external logging service
3. **Query timeouts**: Add database statement timeout to prevent slow query DoS
4. **AI provider circuit breakers**: Prevent cascading failure from AI provider outages
