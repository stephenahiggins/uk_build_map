# Growth MAP — seed batch 4

You are a research assistant. Using **web search**, find **verifiable** local-government-led or council-funded **infrastructure, regeneration, transport, or major public-works projects** for **each** local authority listed below. Scope: **United Kingdom**, evidence from roughly the **last 24 months** where possible.

## Authorities in this batch (use these exact `localAuthorityId` and `regionId` values)

| localAuthorityId | name | code | regionName | countryCode |
|------------------|------|------|------------|-------------|
| ec7bacad-6fd4-49d8-b03b-f385edceae36 | Dartford | E07000107 | Unassigned | ENGLAND |
| 55a6a888-b4fd-4c08-862a-5193175639cc | Derby | E06000015 | Unassigned | ENGLAND |
| 477bad74-9175-4081-aa92-ba38262782bf | Derbyshire Dales | E07000035 | Unassigned | ENGLAND |
| 1a13033a-7cf6-40da-b7db-658832c3250d | Doncaster | E08000017 | Unassigned | ENGLAND |
| 0a7eec36-8501-4ac4-94fa-b6307157e0c0 | Dorset | E06000059 | Unassigned | ENGLAND |
| 11877e29-f3a9-48b6-adf0-d28cb5f5e2d6 | Dover | E07000108 | Unassigned | ENGLAND |
| 9bf7def2-da4b-4906-8de5-d6fb7c9b6570 | Dudley | E08000027 | Unassigned | ENGLAND |
| 1795b1c7-413a-444c-a9d3-30661cdf7ec9 | Ealing | E09000009 | Unassigned | ENGLAND |
| 8d33ba9e-f1cb-489c-a7fa-83e2c53b1ce2 | East Cambridgeshire | E07000009 | Unassigned | ENGLAND |
| bc34f0f3-2116-4264-8840-e806a29b7cba | East Devon | E07000040 | Unassigned | ENGLAND |
| b473e5d1-c527-4a0a-bee1-1c33f8e2dcef | East Hampshire | E07000085 | Unassigned | ENGLAND |
| 061f24d2-8db5-4afe-88c0-903d34abb795 | East Hertfordshire | E07000242 | Unassigned | ENGLAND |
| 83569b61-4cbf-469e-b2ce-0f29a4eedb30 | East Lindsey | E07000137 | Unassigned | ENGLAND |
| fd54eb81-620d-4f25-88f4-44d16c1dd5d2 | East Riding of Yorkshire | E06000011 | Unassigned | ENGLAND |
| 3a9d3532-ce84-41e9-a5a6-4ebcf29f2988 | East Staffordshire | E07000193 | Unassigned | ENGLAND |
| 167fa00f-0939-45ce-aae4-bc2a52e23b22 | East Suffolk | E07000244 | Unassigned | ENGLAND |
| 8877dc28-1f35-4641-9e18-e378ae0c1ee4 | Eastbourne | E07000061 | Unassigned | ENGLAND |
| 3061db65-662a-42ce-98d4-662b8829abe2 | Eastleigh | E07000086 | Unassigned | ENGLAND |
| 24578131-915e-4e3e-a16c-bf08b745e434 | Elmbridge | E07000207 | Unassigned | ENGLAND |
| 89197ab7-89a3-4a38-86fb-f72f21f3e521 | Enfield | E09000010 | Unassigned | ENGLAND |
| 9c5d53b8-ee3d-4ad0-8e23-be31d153e006 | Epping Forest | E07000072 | Unassigned | ENGLAND |
| eb069eae-ca05-473e-bbde-02c3f3e2a85a | Epsom and Ewell | E07000208 | Unassigned | ENGLAND |

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
4. **Save** your JSON array to `backend/seeds/claude-batches/out/batch-004.json` (create the `out` folder if needed).
