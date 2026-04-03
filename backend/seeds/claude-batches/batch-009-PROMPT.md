# Growth MAP — seed batch 9

You are a research assistant. Using **web search**, find **verifiable** local-government-led or council-funded **infrastructure, regeneration, transport, or major public-works projects** for **each** local authority listed below. Scope: **United Kingdom**, evidence from roughly the **last 24 months** where possible.

## Authorities in this batch (use these exact `localAuthorityId` and `regionId` values)

| localAuthorityId | name | code | regionName | countryCode |
|------------------|------|------|------------|-------------|
| 814d26be-4a5a-4b6f-9c62-df6fbb1369c6 | Northumberland | E06000057 | Unassigned | ENGLAND |
| 4e9417bf-f787-4de4-b133-63cc43f724a1 | Norwich | E07000148 | Unassigned | ENGLAND |
| c0410e92-f833-49c2-8e5f-84f5d4754cd8 | Nottingham | E06000018 | Unassigned | ENGLAND |
| 5dd82acf-6049-4194-a85b-edfc88d13d5c | Nuneaton and Bedworth | E07000219 | Unassigned | ENGLAND |
| 3314cd16-0cc0-485f-a181-f269151d20a4 | Oadby and Wigston | E07000135 | Unassigned | ENGLAND |
| 68c43f8b-b4b6-4aee-b567-95fc988b6078 | Oldham | E08000004 | Unassigned | ENGLAND |
| 8ce20ee0-fde4-4acf-9c26-32c471dab770 | Oxford | E07000178 | Unassigned | ENGLAND |
| 5332eea4-682a-4e56-bb3d-909f4398b15b | Pendle | E07000122 | Unassigned | ENGLAND |
| e0439480-b49f-4636-8c37-9671272c7635 | Peterborough | E06000031 | Unassigned | ENGLAND |
| 4212bbed-8db0-4254-8477-908fbac7ccbf | Plymouth | E06000026 | Unassigned | ENGLAND |
| 38d6224d-7d80-402f-8ae1-4927b7a3241f | Portsmouth | E06000044 | Unassigned | ENGLAND |
| 5e98d753-9efc-435b-af85-566487322ae2 | Preston | E07000123 | Unassigned | ENGLAND |
| f0455ea9-5b2c-44f6-84ae-17d80f0ff54d | Reading | E06000038 | Unassigned | ENGLAND |
| f1ec1447-4992-41af-aaff-a9a2e97011f5 | Redbridge | E09000026 | Unassigned | ENGLAND |
| 85268d52-2dd4-48f8-a379-aa576f28c1d9 | Redcar and Cleveland | E06000003 | Unassigned | ENGLAND |
| 04ccc3be-b55d-4bff-8812-6f0788807d2f | Redditch | E07000236 | Unassigned | ENGLAND |
| 1ad44592-d118-4e3c-9390-c155ca91fca7 | Reigate and Banstead | E07000211 | Unassigned | ENGLAND |
| 9183543c-f7c6-469f-a856-e0446e9d3c99 | Ribble Valley | E07000124 | Unassigned | ENGLAND |
| ee3cd39e-1937-41d8-8855-b137bfd735c0 | Richmond upon Thames | E09000027 | Unassigned | ENGLAND |
| 4df67854-7f50-4b8d-b431-93adfdd800dc | Rochdale | E08000005 | Unassigned | ENGLAND |
| fdd05462-2dff-4fae-b2fa-9b266bc309ad | Rochford | E07000075 | Unassigned | ENGLAND |
| 32d2c506-e6e8-499e-b27f-adb92c1f34f3 | Rossendale | E07000125 | Unassigned | ENGLAND |

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
4. **Save** your JSON array to `backend/seeds/claude-batches/out/batch-009.json` (create the `out` folder if needed).
