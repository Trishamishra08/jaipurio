# Claude connector (MCP)

Lets Claude read and edit the Jaipurio admin through a custom connector in claude.ai.

- Endpoint: `https://<host>/api/mcp`. In claude.ai: Settings → Connectors → Add custom connector, paste that URL.
- Sign-in: OAuth 2.1 with PKCE. `/oauth/authorize` asks for a Jaipurio admin email, password and (if on) the authenticator code, then which permissions to give: Read, Edit, Delete, API keys.
- Tokens are signed, not stored: access 7 days, refresh 90 days. Changing the admin's password cuts every connection of that admin.
- Off switch: `MCP_ENABLED=false`. Revoke a single token: add its `jti` to `MCP_REVOKED_TOKENS` (comma list).
- Secret: `MCP_SECRET`, falls back to `JWT_ACCESS_SECRET`.

## Safety rules in code

- Prices, stock, variants, vendor, approval status and product slugs are locked (`config.js` `PRODUCT_LOCKED_FIELDS`). Orders, payments, users and settings money fields are not exposed.
- Each collection lists the fields Claude may write (`collections.js`). Anything else is refused.
- Blogs, pages, city pages, FAQs and blog categories are created as drafts. The slug of a live record cannot change.
- Customer contact fields and secrets are stripped from every result (`redact.js`).
- Schema with ratings is refused unless it comes from real review data.
- API keys are write-only, AES-256-GCM in `mcp_credentials`.
- Every call is written to `mcp_audit` (`mcp_audit_log` tool).
- Rate limits: 120 calls/min per connection, 20 failed sign-ins/min per IP, 10 login attempts/min per IP.

## Tools

Content (`tools/content.js`): site_info, find, get, create, update, publish, delete, seo_get, seo_set, redirect_check, media_bulk_alt, settings_get, tracking_set, mcp_audit_log, credentials_status, credential_set, credential_remove.

SEO (`tools/seo.js`): ga4_report, seo_audit_page, seo_audit_site, seo_sitemap, seo_robots_get, seo_meta_issues, seo_pagespeed, seo_crux, seo_gsc_status, seo_gsc_performance, seo_gsc_opportunities, seo_cannibalization, seo_content_gaps, seo_gsc_inspect, seo_gsc_submit_sitemap, seo_bing_status, seo_bing_performance, seo_indexnow_submit, seo_keyword_map_list/add/assign/remove, seo_internal_links_suggest, seo_intel_log.

GA4 (`ga4_report`) uses the same service account with Viewer access; property from `ga4_property_id` (default 294270069). The storefront GA4 tag reads `settings.googleAnalyticsId` and loads only on jaipurio.in.

Search Console tools need `gsc_service_account_json` and `gsc_property` (default `sc-domain:jaipurio.in`). IndexNow only runs on the live host.

Tests: `node --test tests/mcpConnector.test.js`.
