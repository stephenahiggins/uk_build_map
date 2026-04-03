# Growth MAP — seed batch 2

You are a research assistant. Using **web search**, find **verifiable** local-government-led or council-funded **infrastructure, regeneration, transport, or major public-works projects** for **each** local authority listed below. Scope: **United Kingdom**, evidence from roughly the **last 24 months** where possible.

## Authorities in this batch (use these exact `localAuthorityId` and `regionId` values)

| localAuthorityId | name | code | regionName | countryCode |
|------------------|------|------|------------|-------------|
| 991a2631-5af6-4f86-bd50-5031229ec62d | Bournemouth, Christchurch and Poole | E06000058 | Unassigned | ENGLAND |
| 89ba0b58-baf3-4a7c-9ca9-d82c41059681 | Bracknell Forest | E06000036 | Unassigned | ENGLAND |
| 4228d1cd-c9f6-4824-bb60-7656f06612a4 | Bradford | E08000032 | Unassigned | ENGLAND |
| 90db78e8-e501-4aac-abd9-8a5d46562cfe | Braintree | E07000067 | Unassigned | ENGLAND |
| c77a8255-6252-4556-920a-2b0d111748aa | Breckland | E07000143 | Unassigned | ENGLAND |
| 56733ec9-49f1-401a-8d5b-5cc99d6485d0 | Brent | E09000005 | Unassigned | ENGLAND |
| 95924b8c-df87-4994-89c9-1ec1e8cb21ef | Brentwood | E07000068 | Unassigned | ENGLAND |
| b95e88d6-0f9e-4e02-8844-7d7b84748104 | Brighton and Hove | E06000043 | Unassigned | ENGLAND |
| aae3ef62-d578-4f92-ab26-fdf1fd4826c1 | Bristol, City of | E06000023 | Unassigned | ENGLAND |
| 53ac3a0e-fa9e-4874-8801-2209272aab5f | Broadland | E07000144 | Unassigned | ENGLAND |
| bbcdedd5-a1fa-4555-94e4-7bc38591a29d | Bromley | E09000006 | Unassigned | ENGLAND |
| c01c2169-8b2d-4633-82fa-bfc58e817882 | Bromsgrove | E07000234 | Unassigned | ENGLAND |
| 09fa2982-ea4f-4206-a9c3-0577830ce00c | Broxbourne | E07000095 | Unassigned | ENGLAND |
| 1a375801-aa11-4183-b770-50ddf8da615b | Broxtowe | E07000172 | Unassigned | ENGLAND |
| 75d44285-e9d2-4622-936b-4036a76da7d0 | Buckinghamshire | E06000060 | Unassigned | ENGLAND |
| 175678cf-60cf-473c-8ddc-ddf99e6c46ae | Burnley | E07000117 | Unassigned | ENGLAND |
| eab1fa0f-b6fd-4f3c-8230-f74d48588035 | Bury | E08000002 | Unassigned | ENGLAND |
| 8025f679-fb6f-49fb-8b1e-0f9a9396b8cf | Calderdale | E08000033 | Unassigned | ENGLAND |
| 6bd33e35-4bc1-45d1-8ccc-3bff8fdebd3d | Cambridge | E07000008 | Unassigned | ENGLAND |
| 81c87fa4-2637-4f67-88fd-1bdda7237ae7 | Camden | E09000007 | Unassigned | ENGLAND |
| e9f58529-27d0-4f0e-b356-af551db11db7 | Cannock Chase | E07000192 | Unassigned | ENGLAND |
| 30428149-cba0-4d0f-925a-84428a8245d0 | Canterbury | E07000106 | Unassigned | ENGLAND |

## Output format

Return **only** a JSON **array** (no markdown fences, no commentary). Each element must be one project object suitable for `scripts/seedProjectsFromFile.ts`:

- `id`: unique string (e.g. slug or UUID).
- `title`, `description`, `type`: usually `LOCAL_GOV` for council schemes (or `REGIONAL_GOV` / `NATIONAL_GOV` if truly regional/national).
- `regionId`, `localAuthorityId`: **must** match one of the rows above for the authority the project belongs to.
- `createdById`: `1`.
- `status`: `GREEN`, `AMBER`, or `RED` from cited reporting.
- `statusRationale`: short, grounded in evidence.
- `latitude`, `longitude`, `locationDescription`, `locationSource`, `locationConfidence` when you can cite a site.
- `evidence`: array of objects with `type` (`URL` for links), `title`, `source`, `url` (real http(s) only), `datePublished` (ISO date), `summary`.

## Rules

1. **Do not invent URLs.** Every `url` must be a real page you could open.
2. If you cannot find solid projects for an authority, **omit** that authority rather than guessing.
3. Prefer official `.gov.uk` council sources, combined authorities, or reputable national/local press.
4. **Save** your JSON array to `backend/seeds/claude-batches/out/batch-002.json` (create the `out` folder if needed).
