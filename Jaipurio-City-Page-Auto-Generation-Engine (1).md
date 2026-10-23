# Jaipurio City/Country Page Auto-Generation Engine — Architecture Decision

## Decision
Built a Node.js/Express/MongoDB system where admin fills a short form (city, country,
shipping zone, categories, occasions) and the system auto-generates most of a city
page's content (meta/title/H1/50-word summary/quick-answers/FAQs), driven by a
shipping-zone lookup table + deterministic phrase-bank variation — NOT by swapping
the city name into one fixed template.

## Key safeguard: publish gate
Pure 100% automatic publish (zero human input) would make every city page read as
the same doorway-page pattern to Google — directly against the rules we documented
in `Jaipurio-City-Page-SEO-Rules.md`. So `CityPage.meetsPublishBar()` blocks
publishing until:
- Main Content (Section 7) has 700+ real words, AND
- At least 1 genuine, verifiable Local Proof fact (Section 22) is added.

Everything else (zones, FAQs, quick-answers, meta tags, category grids) is safe
to auto-generate because it's derived from real operational data (shipping zones),
not invented per city.

## Uniqueness mechanism
1. Different shipping zone → different real facts (transit days, customs note,
   currency, return window) — `backend/data/shippingZones.js`.
2. Same zone, different city → different phrasing, picked by a deterministic hash
   of the city name across 3–4 template variants per sentence slot — so repeat
   "Regenerate" calls are idempotent, and cities in the same zone still read
   differently from each other.

## Deliverables (in `jaipurio-city-engine.zip`, delivered to user 2026-10-16)
- `backend/models/CityPage.js` — Mongoose schema, auto vs. editor-owned fields split
- `backend/data/shippingZones.js` — 6 real zones (UK/EU, North America, GCC, AUS/NZ,
  Southeast Asia, India domestic)
- `backend/services/cityPageContentEngine.js` — the generator
- `backend/routes/admin.cityPages.js` — admin CRUD + regenerate + publish-gate API
- `backend/routes/public.cityPage.js` — customer-facing SSR route (`/shop/:slug/`)
- `backend/views/renderCityPage.js` — SSR template, all 25 sections from
  Jaipurio-City-Page-SEO-Rules.md, reusing the real shared header/footer/CSS
- `admin-dashboard-demo.html` — standalone, no-server demo of the admin "cards" flow
  with live preview and the same publish gate, for Rajendra to test directly
- `backend/sample-output-london.html` / `sample-output-dubai.html` — proof-of-uniqueness
  samples generated through the real engine (different zones, different phrasing)

## Next steps (not yet built)
- Wire `fetchProducts()` stub in `renderCityPage.js` to a real Products query
- Real admin auth middleware (demo has none)
- Sitemap auto-regeneration on publish (route `/shop.json` already filters to
  published+indexable pages, ready to feed a sitemap builder)
- Real courier rates API behind the postcode-check widget (currently a labeled demo)
